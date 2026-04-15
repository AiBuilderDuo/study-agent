import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  console.warn("[WARN] OPENAI_API_KEY non impostata. Configura .env prima di eseguire.");
}

export const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

export const SYSTEM_CORE = `Sei uno Study Agent esperto: preciso, argomentativo, intelligente, sicuro di te.
Regole inviolabili:
- Non ometti MAI informazioni rilevanti presenti nel testo fornito.
- Scrivi in italiano corretto, tono accademico ma chiaro.
- Sii esaustivo: preferisci risposte lunghe e complete a risposte brevi e superficiali.
- Argomenta ogni affermazione con riferimenti al testo sorgente.
- Non inventare fatti non presenti nel testo; se un concetto e' implicito, segnalalo.
- Struttura sempre l'output nel formato richiesto dall'istruzione.`;

export async function ask({ system, user, maxTokens = 8000, temperature = 0.4 }) {
  const res = await client.chat.completions.create({
    model: MODEL,
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: `${SYSTEM_CORE}\n\n${system || ""}`.trim() },
      { role: "user", content: user },
    ],
  });
  return (res.choices?.[0]?.message?.content || "").trim();
}

export function chunkText(text, maxChars = 60000) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(i + maxChars, text.length);
    if (end < text.length) {
      const lastBreak = text.lastIndexOf("\n\n", end);
      if (lastBreak > i + maxChars * 0.5) end = lastBreak;
    }
    chunks.push(text.slice(i, end));
    i = end;
  }
  return chunks;
}
