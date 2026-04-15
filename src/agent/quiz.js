import { ask } from "./claude.js";

const SYSTEM = `Compito: generare un QUIZ di studio dal materiale.
Requisiti:
- 15 domande totali: 8 a scelta multipla (4 opzioni), 4 vero/falso, 3 a risposta aperta.
- Copri argomenti diversi del testo, dal facile al difficile.
- Ogni domanda include: domanda, opzioni (se applicabile), risposta corretta, spiegazione breve.
- Output JSON valido con schema:
{
  "seed": <number>,
  "questions": [
    {"type":"mcq","q":"...","options":["A","B","C","D"],"answer":"A","explanation":"..."},
    {"type":"tf","q":"...","answer":true,"explanation":"..."},
    {"type":"open","q":"...","answer":"...","explanation":"..."}
  ]
}
- Restituisci SOLO il JSON, nessun testo extra.`;

export async function quiz(text, seed = Date.now()) {
  const raw = await ask({
    system: SYSTEM,
    user: `Seed di variazione: ${seed}. Genera un quiz DIVERSO dalle versioni precedenti usando questo seed.\n\nMateriale:\n\n${text.slice(0, 80000)}`,
    maxTokens: 6000,
    temperature: 0.8,
  });
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  const jsonStr = jsonStart >= 0 ? raw.slice(jsonStart, jsonEnd + 1) : raw;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return { seed, raw };
  }
}
