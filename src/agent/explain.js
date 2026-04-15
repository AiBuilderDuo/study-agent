import { ask, chunkText } from "./claude.js";

const SYSTEM = `Compito: produrre una SPIEGAZIONE DETTAGLIATA del materiale fornito.
Requisiti:
- Copri ogni concetto presente, senza omissioni.
- Definisci i termini tecnici la prima volta che appaiono.
- Usa esempi, analogie e riformulazioni per chiarire i passaggi difficili.
- Collega i concetti tra loro evidenziando causa-effetto e dipendenze.
- Output in Markdown con titoli (##), sottotitoli (###), elenchi e blocchi di evidenza.`;

export async function explain(text) {
  const chunks = chunkText(text, 60000);
  if (chunks.length === 1) {
    return ask({ system: SYSTEM, user: `Testo da spiegare:\n\n${chunks[0]}`, maxTokens: 12000 });
  }
  const partials = [];
  for (let i = 0; i < chunks.length; i++) {
    const p = await ask({
      system: SYSTEM,
      user: `Parte ${i + 1}/${chunks.length} del materiale. Spiega SOLO questa parte in dettaglio.\n\n${chunks[i]}`,
      maxTokens: 8000,
    });
    partials.push(p);
  }
  return ask({
    system: SYSTEM,
    user: `Unisci e armonizza le seguenti spiegazioni parziali in un unico documento coerente, senza perdere dettagli:\n\n${partials.join("\n\n---\n\n")}`,
    maxTokens: 12000,
  });
}
