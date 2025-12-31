import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { spawn } from 'child_process';
import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';

// Initialize the YouTube API client
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.GOOGLE_API_KEY
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getYouTubeTranscript(videoId : string): Promise<string> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', ['./scripts/get_transcript.py', videoId]);

    let transcript = '';
    pythonProcess.stdout.on('data', (data) => {
      transcript += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error('Python Error:', data.toString());
      reject(data.toString());
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(transcript.trim());
      } else {
        reject(`Python script exited with code ${code}`);
      }
    });
  });
}

// Function to fetch details of YouTube video
async function fetchDetailsOfYoutubeVideo(videoId: string) {
  try {

    // Fetch video details using YouTube API
    const response = await youtube.videos.list({
      part: ['snippet'],
      id: [videoId],
    });


    const video = response.data.items?.[0];
    if (!video) {
      throw new Error('No video found with the provided ID');
    }

    //retrun video details of first video
    return {
      title: video.snippet?.title || 'Unknown Title',
      description: video.snippet?.description || 'No Description Available',
      channel: video.snippet?.channelTitle || 'Unknown Channel',
      videoId: videoId || 'Unknown Video ID',
      defaultLanguage: video.snippet?.defaultLanguage || 'Unknown Language',
      defaultAudioLanguage: video.snippet?.defaultAudioLanguage || 'Unknown Audio Language',
    };
  } catch (error : any) {
    throw new Error('Error fetching video details:', { cause: error });
  }
}

async function saveVideoDetailsToFile(videoId: string, videoDetails: any, transcript: string) {
  try {
    // Define the file name and path
    const fileName = `${videoId}.txt`;
    const filePath = path.join('./transcripts', fileName);

    console.log('Saving video details to file:', videoDetails);

    // Create the content to save
    const content = `Video ID: ${videoDetails.videoId}

      Title: ${videoDetails.title}

      Default Language: ${videoDetails.defaultLanguage}

      Default Audio Language: ${videoDetails.defaultAudioLanguage}

      Channel: ${videoDetails.channel}

      Description: 
      ${videoDetails.description}

      Transcript:
      ${transcript}
    `;

    // Ensure the directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Write the content to the file
    await fs.writeFile(filePath, content.trim(), 'utf8');

    console.log(`Video details and transcript saved to ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error saving video details to file:', error);
    throw error;
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true; // File exists
  } catch {
    return false; // File does not exist
  }
}

function extractYouTubeVideoId(url: string): string | null {
  // Handles URLs like:
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://www.youtube.com/embed/VIDEO_ID
  const regex = /(?:youtube\.com\/(?:.*[?&]v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    const videoId = extractYouTubeVideoId(url);;

    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL. Please provide a valid video URL.' },
        { status: 400 }
      );
    }

    //check if video details are already saved as a file and if yes use them, else fetch it from youtube again
    const fileName = `${videoId}.txt`;
    const filePath = path.join('./transcripts', fileName);
    const doesFileExist = await fileExists(filePath);

    if(!doesFileExist){
      const videoDetails = await fetchDetailsOfYoutubeVideo(videoId);
      const transcript = await getYouTubeTranscript(videoId);
      await saveVideoDetailsToFile(videoId, videoDetails, transcript);
    }

    let youTubeVideoInfo;

    try {
      const content = await fs.readFile(filePath, 'utf8');
      youTubeVideoInfo = content;
      console.log('Read video details from file:', content);
    } catch (error) {
      throw new Error('Error reading video details from file:', { cause: error });
    }


    const stream = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an advanced AI assistant specializing in summarizing YouTube videos. Given all the information about a youtube video like it's title, description and transcript, your task is to generate a **concise and structured summary** that captures all meaningful information while omitting any unnecessary pleasantries, filler words, off-topic discussions, and redundant explanations.`,
        },
        {
          role: "user",
          content: `**Input (YouTube Video Information):** \n\n${youTubeVideoInfo}`
        }
      ],
      stream: true,
    });

    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      },
    });

    return new NextResponse(customStream);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}

//5. **Language**: For output language use the Default Language code mentioned in video information.
