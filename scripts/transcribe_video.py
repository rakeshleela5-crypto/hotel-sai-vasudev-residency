import os
import sys
import subprocess
import speech_recognition as sr

def transcribe_video(video_path, output_transcript_path, chunk_duration=45):
    os.makedirs(os.path.dirname(output_transcript_path), exist_ok=True)
    temp_dir = os.path.join(os.path.dirname(output_transcript_path), "temp_chunks")
    os.makedirs(temp_dir, exist_ok=True)

    # Get video duration using ffprobe
    probe_cmd = [
        "C:\\ffmpeg\\bin\\ffprobe.exe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        video_path
    ]
    try:
        dur_str = subprocess.check_output(probe_cmd).decode('utf-8').strip()
        total_duration = float(dur_str)
    except Exception as e:
        print(f"Error getting duration: {e}")
        return

    print(f"Total Video Duration: {total_duration:.1f} seconds ({total_duration/60:.1f} mins)")
    
    r = sr.Recognizer()
    transcript_lines = []
    
    start_time = 0
    chunk_index = 0
    
    while start_time < total_duration:
        end_time = min(start_time + chunk_duration, total_duration)
        chunk_file = os.path.join(temp_dir, f"chunk_{chunk_index:04d}.wav")
        
        # Extract audio chunk using ffmpeg
        ffmpeg_cmd = [
            "C:\\ffmpeg\\bin\\ffmpeg.exe",
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
        
        subprocess.run(ffmpeg_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Transcribe chunk
        mins = int(start_time // 60)
        secs = int(start_time % 60)
        timestamp_str = f"[{mins:02d}:{secs:02d}]"
        
        try:
            with sr.AudioFile(chunk_file) as source:
                audio_data = r.record(source)
                text = r.recognize_google(audio_data, language='hi-IN')
                line = f"{timestamp_str} {text}"
                transcript_lines.append(line)
                try:
                    sys.stdout.buffer.write((line + "\n").encode('utf-8'))
                    sys.stdout.flush()
                except Exception:
                    pass
        except sr.UnknownValueError:
            pass
        except Exception as e:
            try:
                sys.stdout.buffer.write(f"{timestamp_str} [Transcription Error]: {e}\n".encode('utf-8'))
            except:
                pass
            
        # Clean up chunk file
        if os.path.exists(chunk_file):
            try:
                os.remove(chunk_file)
            except:
                pass
                
        start_time += chunk_duration
        chunk_index += 1

    # Save to output file
    with open(output_transcript_path, "w", encoding="utf-8") as f:
        f.write(f"TRANSCRIPT FOR: {os.path.basename(video_path)}\n")
        f.write("=" * 60 + "\n\n")
        f.write("\n".join(transcript_lines))
        f.write("\n")

    print(f"\n[DONE] Saved {len(transcript_lines)} transcript segments to: {output_transcript_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python transcribe_video.py <video_path> <output_txt_path>")
        sys.exit(1)
        
    v_path = sys.argv[1]
    out_path = sys.argv[2]
    transcribe_video(v_path, out_path)
