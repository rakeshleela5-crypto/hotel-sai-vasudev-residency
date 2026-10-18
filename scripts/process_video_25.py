import os
import subprocess
import glob
import sys

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

video_path = os.path.join("training_videos", "25 - Online Vs offline hotel software ,online pms vs offline pms.mp4")
output_dir = os.path.join("extracted_frames", "video_25")
os.makedirs(output_dir, exist_ok=True)
audio_output = os.path.join("transcripts", "video_25_audio.mp3")
os.makedirs("transcripts", exist_ok=True)

print(f"Checking video: {video_path}")
if not os.path.exists(video_path):
    matches = glob.glob("training_videos/25*.mp4")
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

print("Processing complete!")
