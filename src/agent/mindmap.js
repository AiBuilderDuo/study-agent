import { ask } from "./claude.js";

const SYSTEM = `Compito: generare una MAPPA MENTALE del materiale in sintassi Mermaid (mindmap).
Requisiti:
- Usa il blocco \`\`\`mermaid ... \`\`\`.
- Sintassi: mindmap, con root((Titolo)) e nodi gerarchici indentati.
- Copri TUTTI i concetti principali, secondari e le relazioni chiave.
- Non inventare; attieniti al testo.
- Dopo la mappa, aggiungi una sezione "## Legenda" che spiega i rami principali.`;

export async function mindmap(text) {
  return ask({
    system: SYSTEM,
    user: `Materiale:\n\n${text.slice(0, 40000)}`,
    maxTokens: 3500,
    temperature: 0.3,
  });
}
