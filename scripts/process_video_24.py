import os
import subprocess
import glob
import sys

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

video_path = os.path.join("training_videos", "24 - How to generate police station report on hotel , Hotel management front office training video.mp4")
output_dir = os.path.join("extracted_frames", "video_24")
os.makedirs(output_dir, exist_ok=True)
audio_output = os.path.join("transcripts", "video_24_audio.mp3")
transcript_output = os.path.join("transcripts", "video_24_transcript.txt")
os.makedirs("transcripts", exist_ok=True)

print(f"Checking video: {video_path}")
if not os.path.exists(video_path):
    matches = glob.glob("training_videos/24*.mp4")
    if matches:
        video_path = matches[0]
        print(f"Found video at: {video_path}")
    else:
        print("Video not found!")
        exit(1)

# 1. Extract frames (1 frame every 2.5 seconds)
print("Extracting frames...")
frame_cmd = [
    "ffmpeg", "-y", "-i", video_path,
    "-vf", "fps=1/2.5",
    os.path.join(output_dir, "frame_%04d.jpg")
]
subprocess.run(frame_cmd, check=True)
print(f"Frames extracted to {output_dir}")

# 2. Extract audio
print("Extracting audio...")
audio_cmd = [
    "ffmpeg", "-y", "-i", video_path,
    "-vn", "-acodec", "libmp3lame", "-q:a", "4",
    audio_output
]
subprocess.run(audio_cmd, check=True)
print(f"Audio extracted to {audio_output}")

# 3. Transcribe audio using whisper if available
try:
    import whisper
    print("Transcribing audio with Whisper...")
    model = whisper.load_model("base")
    result = model.transcribe(audio_output, language="hi")
    with open(transcript_output, "w", encoding="utf-8") as f:
        f.write(result["text"])
    print(f"Transcript saved to {transcript_output}")
except Exception as e:
    print(f"Whisper transcription skipped or failed: {e}")

print("Processing complete!")
