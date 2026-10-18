import os
import subprocess
import glob
import sys

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

video_path = os.path.join("training_videos", "28 - Gst report on hotel software,gst report kaise banay pms se.mp4")
output_dir = os.path.join("extracted_frames", "video_28")
os.makedirs(output_dir, exist_ok=True)
audio_output = os.path.join("transcripts", "video_28_audio.mp3")
os.makedirs("transcripts", exist_ok=True)

print(f"Checking video: {video_path}")
if not os.path.exists(video_path):
    matches = glob.glob("training_videos/*28*.mp4")
    if matches:
        video_path = matches[0]
        print(f"Found video at: {video_path}")
    else:
        print("Video not found!")
        exit(1)

# Probe duration
probe_cmd = [
    "ffprobe", "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", video_path
]
duration_res = subprocess.run(probe_cmd, capture_output=True, text=True)
duration = float(duration_res.stdout.strip())
print(f"Video duration: {duration:.2f} seconds ({int(duration)//60}m {int(duration)%60}s)")

# 1. Extract frames (1 frame every 2 seconds for high-density UI inspection)
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

print("Processing complete!")
