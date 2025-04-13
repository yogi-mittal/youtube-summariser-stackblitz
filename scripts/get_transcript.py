import sys
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import WebshareProxyConfig
from youtube_transcript_api._errors import TranscriptsDisabled, VideoUnavailable
from youtube_transcript_api.formatters import TextFormatter
import os


proxy_username = os.getenv("PROXY_UNAME", "")
proxy_password = os.getenv("PROXY_PASS", "")

ytt_api = YouTubeTranscriptApi(
    proxy_config=WebshareProxyConfig(
        proxy_username=proxy_username,
        proxy_password=proxy_password,
    )
)

def get_transcript(video_id):
    try:        
        transcript_list = ytt_api.list(video_id)
        for ts in transcript_list:
            default_language_code = ts.language_code
            break

        transcript = ytt_api.fetch(video_id, languages=[default_language_code, 'en', 'en-US', 'en-GB', 'en-IN']) 
        formatter = TextFormatter()
        text_formatted = formatter.format_transcript(transcript)
        return text_formatted
    except TranscriptsDisabled:
        return "Error: Transcripts are disabled for this video."
    except VideoUnavailable:
        return "Error: Video is unavailable."
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: No video URL provided.")
        sys.exit(1)

    video_url = sys.argv[1]
    print(get_transcript(video_url))
