import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("[WARN] ANTHROPIC_API_KEY non impostata. Configura .env prima di eseguire.");
}

export const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-5";

export const SYSTEM_CORE = `Sei uno Study Agent esperto: preciso, argomentativo, intelligente, sicuro di te.
Regole inviolabili:
- Non ometti MAI informazioni rilevanti presenti nel testo fornito.
- Scrivi in italiano corretto, tono accademico ma chiaro.
- Sii esaustivo: preferisci risposte lunghe e complete a risposte brevi e superficiali.
- Argomenta ogni affermazione con riferimenti al testo sorgente.
- Non inventare fatti non presenti nel testo; se un concetto e' implicito, segnalalo.
- Struttura sempre l'output nel formato richiesto dall'istruzione.`;

export async function ask({ system, user, maxTokens = 8000, temperature = 0.4 }) {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    temperature,
    system: `${SYSTEM_CORE}\n\n${system || ""}`.trim(),
    messages: [{ role: "user", content: user }],
  });
  return res.content.map((b) => (b.type === "text" ? b.text : "")).join("\n").trim();
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
