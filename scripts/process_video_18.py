import os
import subprocess
import sys
import speech_recognition as sr

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

def process_video_18():
    files = [f for f in os.listdir('training_videos') if f.startswith('18 -') or f.startswith('18')]
    if not files:
        print("Video 18 not found!")
        return
    video_filename = files[0]
    video_path = os.path.abspath(os.path.join('training_videos', video_filename))
    print(f"Processing Video 18: {video_filename.encode('ascii', errors='replace').decode('ascii')}")

    # 1. Extract Frames
    frames_dir = os.path.abspath(os.path.join('extracted_frames', 'video_18'))
    os.makedirs(frames_dir, exist_ok=True)
    
    print("Extracting frames...")
    ffmpeg_exe = r"C:\ffmpeg\bin\ffmpeg.exe"
    frame_pattern = os.path.join(frames_dir, "frame_%04d.jpg")
    
    cmd = [
        ffmpeg_exe,
        "-y",
        "-i", video_path,
        "-vf", "fps=0.5",
        "-q:v", "2",
        frame_pattern
    ]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    frame_count = len(os.listdir(frames_dir))
    print(f"Frames extracted: {frame_count}")

    # 2. Transcribe Audio
    audio_path = os.path.abspath(os.path.join('extracted_frames', 'video_18', 'audio.wav'))
    print("Extracting audio...")
    cmd_audio = [
        ffmpeg_exe,
        "-y",
        "-i", video_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        audio_path
    ]
    subprocess.run(cmd_audio, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    if not os.path.exists(audio_path):
        print("Failed to extract audio")
        return

    print("Transcribing audio...")
    recognizer = sr.Recognizer()
    
    # Get audio duration using ffprobe
    ffprobe_exe = r"C:\ffmpeg\bin\ffprobe.exe"
    cmd_probe = [
        ffprobe_exe,
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        audio_path
    ]
    probe_res = subprocess.run(cmd_probe, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    duration = float(probe_res.stdout.strip() or 0)
    print(f"Audio duration: {duration:.1f} seconds")

    segment_len = 45 # seconds
    transcripts = []
    
    with sr.AudioFile(audio_path) as source:
        curr = 0
        while curr < duration:
            try:
                audio_data = recognizer.record(source, duration=segment_len)
                text = recognizer.recognize_google(audio_data, language="hi-IN")
                timestamp = f"[{int(curr//60):02d}:{int(curr%60):02d}]"
                print(f"{timestamp} {text.encode('ascii', errors='replace').decode('ascii')}")
                transcripts.append(f"{timestamp} {text}")
            except sr.UnknownValueError:
                pass
            except Exception as e:
                pass
            curr += segment_len

    os.makedirs('transcripts', exist_ok=True)
    transcript_file = os.path.join('transcripts', 'video_18_transcript.txt')
    with open(transcript_file, 'w', encoding='utf-8') as f:
        f.write(f"TRANSCRIPT FOR: {video_filename}\n")
        f.write("=" * 85 + "\n\n")
        for line in transcripts:
            f.write(line + "\n")
            
    print(f"Transcript written to {transcript_file}")

    if os.path.exists(audio_path):
        os.remove(audio_path)

if __name__ == "__main__":
    process_video_18()
