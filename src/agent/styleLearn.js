import { ask } from "./claude.js";

const ANALYZE_SYSTEM = `Compito: ANALIZZARE lo stile di scrittura del materiale di riferimento.
Produci un "profilo stilistico" dettagliato che descriva:
- Registro (formale/informale/accademico/divulgativo).
- Lunghezza tipica delle frasi e dei paragrafi.
- Uso di connettivi, elenchi, esempi, metafore.
- Lessico ricorrente e termini preferiti.
- Struttura argomentativa (come introduce, sviluppa, conclude).
- Tono (neutro, assertivo, ironico...).
- Punteggiatura e particolarita'.
Output: JSON con chiave "profile" (stringa Markdown descrittiva) e "examples" (3 citazioni brevi rappresentative).`;

const REWRITE_SYSTEM = `Compito: RISCRIVERE un testo adottando un preciso profilo stilistico fornito.
Regole:
- Mantieni TUTTO il contenuto informativo del testo originale: non omettere nulla.
- Aderisci rigorosamente al profilo stilistico dato.
- Output: Markdown ben formattato. Nessuna meta-spiegazione, solo il testo riscritto.`;

export async function analyzeStyle(referenceText) {
  const raw = await ask({
    system: ANALYZE_SYSTEM,
    user: `Materiale di riferimento:\n\n${referenceText.slice(0, 80000)}`,
    maxTokens: 4000,
    temperature: 0.3,
  });
  const s = raw.indexOf("{");
  const e = raw.lastIndexOf("}");
  try {
    return JSON.parse(s >= 0 ? raw.slice(s, e + 1) : raw);
  } catch {
    return { profile: raw, examples: [] };
  }
}

export async function rewriteInStyle(targetText, styleProfile) {
  return ask({
    system: REWRITE_SYSTEM,
    user: `PROFILO STILISTICO DA IMITARE:\n${styleProfile}\n\nTESTO DA RISCRIVERE:\n${targetText.slice(0, 80000)}`,
    maxTokens: 12000,
    temperature: 0.6,
  });
}
