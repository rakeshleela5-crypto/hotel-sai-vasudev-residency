import os
import subprocess
import sys
import speech_recognition as sr

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

def process_video_11():
    files = [f for f in os.listdir('training_videos') if f.startswith('11 -') or '11 -' in f]
    if not files:
        print("Video 11 not found!")
        return
    video_filename = files[0]
    video_path = os.path.abspath(os.path.join('training_videos', video_filename))
    print(f"Found Video 11: {video_path}")

    # 1. Extract Frames
    frames_dir = os.path.abspath(os.path.join('extracted_frames', 'video_11'))
    os.makedirs(frames_dir, exist_ok=True)
    
    print("Extracting frames...")
    ffmpeg_exe = r"C:\ffmpeg\bin\ffmpeg.exe"
    frame_pattern = os.path.join(frames_dir, "frame_%04d.jpg")
    
    # 1 frame every 2 seconds
    cmd = [
        ffmpeg_exe,
        "-y",
        "-i", video_path,
        "-vf", "fps=0.5",
        "-q:v", "2",
        frame_pattern
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    frame_count = len(os.listdir(frames_dir))
    print(f"Frames extracted: {frame_count}")

    # 2. Transcribe Audio
    transcript_path = os.path.abspath(os.path.join('transcripts', 'video_11_transcript.txt'))
    temp_dir = os.path.abspath(os.path.join('transcripts', 'temp_chunks'))
    os.makedirs(temp_dir, exist_ok=True)
    
    # ffprobe duration
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
    chunk_duration = 45
    chunk_index = 0

    while start_time < total_duration:
        end_time = min(start_time + chunk_duration, total_duration)
        chunk_file = os.path.join(temp_dir, f"chunk_{chunk_index:04d}.wav")
        
        chunk_cmd = [
            ffmpeg_exe,
            "-y",
            "-ss", str(start_time),
            "-t", str(chunk_duration),
            "-i", video_path,
            "-vn",
            "-acodec", "pcm_s16le",
            "-ar", "16000",
            "-ac", "1",
            chunk_file
        ]
        subprocess.run(chunk_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        mins = int(start_time // 60)
        secs = int(start_time % 60)
        timestamp_str = f"[{mins:02d}:{secs:02d}]"
        
        try:
            with sr.AudioFile(chunk_file) as source:
                audio_data = r.record(source)
                text = r.recognize_google(audio_data, language='hi-IN')
                line = f"{timestamp_str} {text}"
                transcript_lines.append(line)
                print(line)
        except sr.UnknownValueError:
            pass
        except Exception as e:
            print(f"{timestamp_str} [Transcription Error]: {e}")
            
        if os.path.exists(chunk_file):
            try:
                os.remove(chunk_file)
            except:
                pass
                
        start_time += chunk_duration
        chunk_index += 1

    with open(transcript_path, "w", encoding="utf-8") as f:
        f.write(f"TRANSCRIPT FOR: Video 11 - Room Shifting\n")
        f.write("=" * 60 + "\n\n")
        f.write("\n".join(transcript_lines))
        f.write("\n")

    print(f"[DONE] Transcript saved with {len(transcript_lines)} segments to {transcript_path}")

if __name__ == '__main__':
    process_video_11()
