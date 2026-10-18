import speech_recognition as sr
import subprocess
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

os.makedirs("transcripts", exist_ok=True)
wav_path = "transcripts/video_26_audio.wav"

if not os.path.exists(wav_path):
    print("Converting mp3 to wav...")
    subprocess.run(["ffmpeg", "-y", "-i", "transcripts/video_26_audio.mp3", "-ar", "16000", "-ac", "1", wav_path], check=True)

r = sr.Recognizer()
chunk_duration = 30
total_duration = 10 * 60 + 2 # ~602 seconds

full_transcript = []
print("Starting transcription of Video 26...")
for start in range(0, total_duration, chunk_duration):
    chunk_wav = f"transcripts/chunk_v26_{start}.wav"
    subprocess.run(["ffmpeg", "-y", "-ss", str(start), "-t", str(chunk_duration), "-i", wav_path, "-ac", "1", "-ar", "16000", chunk_wav], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    text = ""
    try:
        with sr.AudioFile(chunk_wav) as source:
            audio_data = r.record(source)
            text = r.recognize_google(audio_data, language="hi-IN")
            print(f"[{start//60:02d}:{start%60:02d}] {text}")
            full_transcript.append(f"[{start//60:02d}:{start%60:02d}] {text}")
    except Exception as e:
        try:
            with sr.AudioFile(chunk_wav) as source:
                audio_data = r.record(source)
                text = r.recognize_google(audio_data, language="en-IN")
                print(f"[{start//60:02d}:{start%60:02d}] (en): {text}")
                full_transcript.append(f"[{start//60:02d}:{start%60:02d}] (en) {text}")
        except:
            print(f"[{start//60:02d}:{start%60:02d}] [Inaudible / Music]")
            full_transcript.append(f"[{start//60:02d}:{start%60:02d}] [Inaudible / Music]")
    if os.path.exists(chunk_wav):
        os.remove(chunk_wav)

with open("transcripts/video_26_transcript.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(full_transcript))

print("Transcription finished!")
