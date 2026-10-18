import speech_recognition as sr
import subprocess
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

os.makedirs("transcripts", exist_ok=True)
mp3_path = "transcripts/video_33_audio.mp3"
wav_path = "transcripts/video_33_audio.wav"

if not os.path.exists(mp3_path):
    print("Waiting for audio file...")
    exit(1)

if not os.path.exists(wav_path):
    print("Converting mp3 to wav...")
    subprocess.run(["ffmpeg", "-y", "-i", mp3_path, "-ar", "16000", "-ac", "1", wav_path], check=True)

# Probe duration of wav
probe_cmd = [
    "ffprobe", "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", wav_path
]
duration_res = subprocess.run(probe_cmd, capture_output=True, text=True)
total_duration = int(float(duration_res.stdout.strip())) + 2
print(f"Total duration: {total_duration} seconds ({total_duration//60}m {total_duration%60}s)")

r = sr.Recognizer()
chunk_duration = 30

full_transcript = []
print("Starting transcription of Video 33...")
for start in range(0, total_duration, chunk_duration):
    chunk_wav = f"transcripts/chunk_v33_{start}.wav"
    subprocess.run(["ffmpeg", "-y", "-ss", str(start), "-t", str(chunk_duration), "-i", wav_path, "-ac", "1", "-ar", "16000", chunk_wav], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    text = ""
    try:
        with sr.AudioFile(chunk_wav) as source:
            audio_data = r.record(source)
            text = r.recognize_google(audio_data, language="hi-IN")
            print(f"[{start//60:02d}:{start%60:02d}] (hi): {text}")
    except sr.UnknownValueError:
        try:
            with sr.AudioFile(chunk_wav) as source:
                audio_data = r.record(source)
                text = r.recognize_google(audio_data, language="en-IN")
                print(f"[{start//60:02d}:{start%60:02d}] (en): {text}")
        except Exception:
            pass
    except Exception as e:
        pass
    finally:
        if os.path.exists(chunk_wav):
            os.remove(chunk_wav)
            
    if text:
        full_transcript.append(f"[{start//60:02d}:{start%60:02d}] {text}")

transcript_file = "transcripts/video_33_transcript.txt"
with open(transcript_file, "w", encoding="utf-8") as f:
    f.write("\n".join(full_transcript))

print(f"Transcription complete! Saved to {transcript_file}")
