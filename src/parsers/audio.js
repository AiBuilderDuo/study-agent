import fs from "fs";
import path from "path";

const AUDIO_EXTS = new Set([".mp3", ".wav", ".m4a", ".ogg", ".flac", ".webm", ".mp4", ".mpga", ".mpeg"]);

export function isAudio(filePath) {
  return AUDIO_EXTS.has(path.extname(filePath).toLowerCase());
}

// Trascrizione via Groq Whisper (richiede GROQ_API_KEY)
export async function transcribeAudio(filePath) {
  if (!process.env.GROQ_API_KEY) {
    return { text: "", error: "GROQ_API_KEY mancante: impossibile trascrivere audio." };
  }
  const form = new FormData();
  const blob = new Blob([fs.readFileSync(filePath)]);
  form.append("file", blob, path.basename(filePath));
  form.append("model", "whisper-large-v3");
  form.append("language", "it");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: form,
  });
  if (!res.ok) {
    return { text: "", error: `Whisper error ${res.status}: ${await res.text()}` };
  }
  const data = await res.json();
  return { text: data.text || "" };
}
