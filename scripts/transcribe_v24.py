import speech_recognition as sr
import subprocess
import os

os.makedirs("transcripts", exist_ok=True)
wav_path = "transcripts/video_24_audio.wav"

if not os.path.exists(wav_path):
    print("Converting mp3 to wav...")
    subprocess.run(["ffmpeg", "-y", "-i", "transcripts/video_24_audio.mp3", "-ar", "16000", "-ac", "1", wav_path], check=True)

r = sr.Recognizer()
# Process in 30-second chunks
chunk_duration = 30
total_duration = 9 * 60 + 38 # ~578 seconds

full_transcript = []
for start in range(0, total_duration, chunk_duration):
    chunk_wav = f"transcripts/chunk_{start}.wav"
    subprocess.run(["ffmpeg", "-y", "-ss", str(start), "-t", str(chunk_duration), "-i", wav_path, "-ac", "1", "-ar", "16000", chunk_wav], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        with sr.AudioFile(chunk_wav) as source:
            audio_data = r.record(source)
            text = r.recognize_google(audio_data, language="hi-IN")
            print(f"[{start}s - {start+chunk_duration}s]: {text}")
            full_transcript.append(f"[{start//60:02d}:{start%60:02d}] {text}")
    except Exception as e:
        # try English
        try:
            with sr.AudioFile(chunk_wav) as source:
                audio_data = r.record(source)
                text = r.recognize_google(audio_data, language="en-IN")
                print(f"[{start}s - {start+chunk_duration}s] (en): {text}")
                full_transcript.append(f"[{start//60:02d}:{start%60:02d}] (en) {text}")
        except:
            pass
    if os.path.exists(chunk_wav):
        os.remove(chunk_wav)

with open("transcripts/video_24_transcript.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(full_transcript))

print("Transcription finished!")
