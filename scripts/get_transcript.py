import sys
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import WebshareProxyConfig
from youtube_transcript_api._errors import TranscriptsDisabled, VideoUnavailable
import os


proxy_username = os.getenv("PROXY_UNAME", "")
proxy_password = os.getenv("PROXY_PASS", "")

# print the proxy credentials
print(f"Proxy Username: {proxy_username}")
print(f"Proxy Password: {proxy_password}")
# Initialize the YouTubeTranscriptApi with proxy configuration

ytt_api = YouTubeTranscriptApi(
    proxy_config=WebshareProxyConfig(
        proxy_username="sbdyglot",
        proxy_password="3j68ypptqdes",
    )
)

def get_transcript(video_id):
    try:
        transcript = ytt_api.get_transcript(video_id)
        return " ".join([entry['text'] for entry in transcript])
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
