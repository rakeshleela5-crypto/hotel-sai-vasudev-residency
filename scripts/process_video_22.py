import os
import subprocess
import glob
import sys

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

video_path = os.path.join("training_videos", "22 - Auto WhatsApp from ROOMG Hotel Management Software ｜ Send Bills & Booking Alerts Instantly.mp4")
output_dir = os.path.join("extracted_frames", "video_22")
os.makedirs(output_dir, exist_ok=True)
audio_output = os.path.join("transcripts", "video_22_audio.mp3")
transcript_output = os.path.join("transcripts", "video_22_transcript.txt")
os.makedirs("transcripts", exist_ok=True)

print(f"Checking video: {video_path}")
if not os.path.exists(video_path):
    # Try finding matching video
    matches = glob.glob("training_videos/22*.mp4")
    if matches:
        video_path = matches[0]
        print(f"Found video at: {video_path}")
    else:
        print("Video not found!")
        exit(1)

# 1. Extract frames (1 frame every 2 seconds)
print("Extracting frames...")
frame_cmd = [
    "ffmpeg", "-y", "-i", video_path,
    "-vf", "fps=1/2",
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

# 3. Transcribe audio with whisper
print("Transcribing audio...")
try:
    import whisper
    model = whisper.load_model("base")
    result = model.transcribe(audio_output, fp16=False)
    with open(transcript_output, "w", encoding="utf-8") as f:
        f.write(result["text"])
    print(f"Transcript written to {transcript_output}")
except Exception as e:
    print(f"Whisper transcription failed: {e}")
    # Fallback to faster-whisper or basic info
    with open(transcript_output, "w", encoding="utf-8") as f:
        f.write(f"Transcription error: {e}")
