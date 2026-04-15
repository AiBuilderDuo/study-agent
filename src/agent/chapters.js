import { ask } from "./claude.js";

const SYSTEM = `Compito: DIVIDERE il materiale in capitoli e sezioni in modo accurato.
Requisiti:
- Individua la struttura naturale del testo (argomenti, sotto-argomenti).
- Per ogni capitolo: titolo, intervallo indicativo (inizio-fine o paragrafi), sinossi dettagliata (5-10 righe), concetti chiave.
- Mantieni l'ordine originale.
- Output Markdown con ## per i capitoli e ### per le sezioni.`;

export async function chapters(text) {
  return ask({
    system: SYSTEM,
    user: `Materiale:\n\n${text.slice(0, 100000)}`,
    maxTokens: 8000,
    temperature: 0.3,
  });
}
