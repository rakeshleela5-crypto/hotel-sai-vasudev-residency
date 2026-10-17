import os
import subprocess
import sys
import speech_recognition as sr

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

def process_video_15():
    files = [f for f in os.listdir('training_videos') if f.startswith('15 -') or f.startswith('15')]
    if not files:
        print("Video 15 not found!")
        return
    video_filename = files[0]
    video_path = os.path.abspath(os.path.join('training_videos', video_filename))
    print(f"Processing Video 15: {video_filename.encode('ascii', errors='replace').decode('ascii')}")

    # 1. Extract Frames
    frames_dir = os.path.abspath(os.path.join('extracted_frames', 'video_15'))
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
    transcript_path = os.path.abspath(os.path.join('transcripts', 'video_15_transcript.txt'))
    temp_dir = os.path.abspath(os.path.join('transcripts', 'temp_chunks_15'))
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
    chunk_len = 45 # seconds
    
    print("Transcribing audio in chunks...")
    while start_time < total_duration:
        chunk_file = os.path.join(temp_dir, f"chunk_{int(start_time)}.wav")
        audio_cmd = [
            ffmpeg_exe,
            "-y",
            "-ss", str(start_time),
            "-t", str(chunk_len),
            "-i", video_path,
            "-ar", "16000",
            "-ac", "1",
            chunk_file
        ]
        subprocess.run(audio_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        mins = int(start_time // 60)
        secs = int(start_time % 60)
        timestamp = f"[{mins:02d}:{secs:02d}]"
        
        try:
            with sr.AudioFile(chunk_file) as source:
                audio_data = r.record(source)
                text = r.recognize_google(audio_data, language="hi-IN")
                print(f"{timestamp} {text.encode('ascii', errors='replace').decode('ascii')}")
                transcript_lines.append(f"{timestamp} {text}")
        except sr.UnknownValueError:
            transcript_lines.append(f"{timestamp} [Music/Silence/Inaudible]")
        except Exception as e:
            transcript_lines.append(f"{timestamp} [Error: {str(e)}]")
            
        if os.path.exists(chunk_file):
            try:
                os.remove(chunk_file)
            except:
                pass
        start_time += chunk_len
        
    with open(transcript_path, 'w', encoding='utf-8') as f:
        f.write("TRANSCRIPT FOR: Video 15 - Receipt Entry in Hotel Management Software | Record Guest Payments Easily\n")
        f.write("=" * 85 + "\n\n")
        f.write("\n".join(transcript_lines))
        
    print(f"\nSaved transcript to {transcript_path}")
    try:
        os.rmdir(temp_dir)
    except:
        pass

if __name__ == '__main__':
    process_video_15()
