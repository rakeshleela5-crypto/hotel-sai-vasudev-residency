import os
import subprocess
import sys
import speech_recognition as sr

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

def process_video_17():
    files = [f for f in os.listdir('training_videos') if f.startswith('17 -') or f.startswith('17')]
    if not files:
        print("Video 17 not found!")
        return
    video_filename = files[0]
    video_path = os.path.abspath(os.path.join('training_videos', video_filename))
    print(f"Processing Video 17: {video_filename.encode('ascii', errors='replace').decode('ascii')}")

    # 1. Extract Frames
    frames_dir = os.path.abspath(os.path.join('extracted_frames', 'video_17'))
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
    os.makedirs('transcripts', exist_ok=True)
    transcript_path = os.path.abspath(os.path.join('transcripts', 'video_17_transcript.txt'))
    temp_dir = os.path.abspath(os.path.join('transcripts', 'temp_chunks_17'))
    os.makedirs(temp_dir, exist_ok=True)
    
    ffprobe_exe = r"C:\ffmpeg\bin\ffprobe.exe"
    probe_cmd = [
        ffprobe_exe,
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        video_path
    ]
    dur_str = subprocess.check_output(probe_cmd).decode('utf-8').strip()
    total_duration = float(dur_str)
    print(f"Total Video Duration: {total_duration:.1f}s ({total_duration/60:.1f}m)")

    r = sr.Recognizer()
    transcript_lines = []
    start_time = 0
    chunk_length = 45 # 45 second chunks
    idx = 1
    
    while start_time < total_duration:
        chunk_file = os.path.join(temp_dir, f"chunk_{idx:03d}.wav")
        current_len = min(chunk_length, total_duration - start_time)
        
        # Extract audio chunk
        audio_cmd = [
            ffmpeg_exe,
            "-y",
            "-ss", str(start_time),
            "-t", str(current_len),
            "-i", video_path,
            "-vn",
            "-acodec", "pcm_s16le",
            "-ar", "16000",
            "-ac", "1",
            chunk_file
        ]
        subprocess.run(audio_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        minutes = int(start_time // 60)
        seconds = int(start_time % 60)
        time_tag = f"[{minutes:02d}:{seconds:02d}]"
        
        text = ""
        try:
            with sr.AudioFile(chunk_file) as source:
                audio_data = r.record(source)
                text = r.recognize_google(audio_data, language="hi-IN")
        except Exception:
            try:
                with sr.AudioFile(chunk_file) as source:
                    audio_data = r.record(source)
                    text = r.recognize_google(audio_data, language="en-IN")
            except Exception:
                text = ""
                
        if text:
            print(f"{time_tag} {text}")
            transcript_lines.append(f"{time_tag} {text}")
        else:
            print(f"{time_tag} [Music / Silent / Inaudible]")
            
        try:
            os.remove(chunk_file)
        except Exception:
            pass
            
        start_time += chunk_length
        idx += 1

    try:
        os.rmdir(temp_dir)
    except Exception:
        pass

    with open(transcript_path, "w", encoding="utf-8") as f:
        f.write(f"TRANSCRIPT FOR: Video 17 - Ledger Entry & Report in Hotel?Business Software | Track All Party Transactions Easily\n")
        f.write("=====================================================================================\n\n")
        for line in transcript_lines:
            f.write(line + "\n")
            
    print(f"\nTranscript saved to {transcript_path}")

if __name__ == '__main__':
    process_video_17()
