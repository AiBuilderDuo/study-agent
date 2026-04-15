# Study Agent

Agent AI che legge i tuoi appunti e produce **spiegazioni dettagliate**, **mappe mentali**, **quiz rigenerabili**, **divisione in capitoli** e **riscritture nel tuo stile**.

Tono dell'agent: preciso, argomentativo, intelligente, sicuro di se', non omette nulla.

## Funzionalita'

- Upload fino a **1 GB** per file, multi-file, multi-formato: PDF, DOCX, TXT, MD, CSV, HTML, JSON, immagini (OCR ita+eng), **audio** (trascrizione via Whisper).
- **Spiegazione** completa in Markdown con titoli, esempi, collegamenti fra concetti.
- **Mappa mentale** generata in sintassi Mermaid.
- **Quiz** da 15 domande (MCQ + V/F + aperte) con seed per rigenerazione infinita.
- **Capitoli** con sinossi e concetti chiave.
- **Style Learning**: analizza lo stile di un set di appunti e riscrive altri file in quello stile.
- **Export PDF** di ogni output con un click.
- **Login con password** (tramite `APP_PASSWORD`), disabilitato se la variabile non e' impostata.
- **Docker** ready (Dockerfile + docker-compose).

## Stack

- Node.js >= 18
- Express + Multer (upload)
- Groq API (SDK `openai` puntato a `api.groq.com`) con `llama-3.3-70b-versatile` + `whisper-large-v3` (tier free)
- `pdf-parse`, `mammoth`, `tesseract.js`

## Setup

```bash
git clone <repo-url>
cd study-agent
npm install
cp .env.example .env
# inserisci la tua GROQ_API_KEY nel file .env
npm start
```

Apri `http://localhost:3000`.

## Variabili ambiente

| Variabile | Descrizione |
|-----------|-------------|
| `GROQ_API_KEY` | Chiave API Groq (obbligatoria — usata per LLM e per trascrizione audio Whisper) |
| `LLM_MODEL` | Modello Groq (default `llama-3.3-70b-versatile`) |
| `APP_PASSWORD` | Se impostata, abilita login con password |
| `PORT` | Porta server (default 3000) |

## Docker

```bash
cp .env.example .env
# compila .env
docker compose up --build
```

Poi apri `http://localhost:3000`.

## Flusso d'uso

1. **Carica gli appunti** nella prima card.
2. Clicca **Spiegazione / Mappa / Capitoli / Quiz** per i vari output. "Rigenera quiz" produce un quiz diverso ogni volta.
3. Per lo **style learning**:
   - Carica prima gli appunti modello e clicca "Analizza stile".
   - Poi carica un secondo file nella sezione "target" e clicca "Riscrivi nello stile".

## Endpoint API

- `POST /api/upload` (multipart) → `{ sessionId, files, totalChars }`
- `POST /api/explain` `{ sessionId }` → `{ markdown }`
- `POST /api/mindmap` `{ sessionId }` → `{ markdown }` (contiene blocco Mermaid)
- `POST /api/chapters` `{ sessionId }` → `{ markdown }`
- `POST /api/quiz` `{ sessionId, seed? }` → JSON quiz
- `POST /api/style/analyze` `{ sessionId }` → `{ profile, examples }`
- `POST /api/style/rewrite` `{ targetSessionId, styleProfile }` → `{ markdown }`

## Note

- I file caricati restano in `uploads/` (gitignored). Le sessioni sono in memoria (reset al restart).
- Per file molto grandi (centinaia di MB di testo) l'agent processa in chunk automaticamente.

## Licenza

MIT
