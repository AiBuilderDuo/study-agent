import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import { parseMany, concatParsed } from "./src/parsers/index.js";
import { explain } from "./src/agent/explain.js";
import { mindmap } from "./src/agent/mindmap.js";
import { quiz } from "./src/agent/quiz.js";
import { chapters } from "./src/agent/chapters.js";
import { analyzeStyle, rewriteInStyle } from "./src/agent/styleLearn.js";
import { authMiddleware } from "./src/utils/auth.js";
import { markdownToPdf } from "./src/utils/pdfExport.js";
import cookieParser from "cookie-parser";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [
    "https://agent-portal-home.lovable.app",
    /\.lovable\.app$/,
    /\.lovableproject\.com$/,
    /^http:\/\/localhost(:\d+)?$/
  ],
  credentials: true
}));

const UPLOAD_DIR = path.join(__dirname, "uploads");
await fs.mkdir(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1 GB per file
});

app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/login", (req, res) => {
  const { password } = req.body || {};
  if (!process.env.APP_PASSWORD || password === process.env.APP_PASSWORD) {
    res.cookie("app_token", process.env.APP_PASSWORD || "open", { httpOnly: true, sameSite: "lax" });
    return res.json({ ok: true });
  }
  res.status(401).json({ error: "Password errata" });
});

// In-memory session store: sessionId -> { text, files }
const sessions = new Map();

function newSessionId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

app.post("/api/upload", upload.array("files", 50), async (req, res) => {
  try {
    const paths = req.files.map((f) => f.path);
    const parsed = await parseMany(paths);
    const text = concatParsed(parsed);
    const sessionId = newSessionId();
    sessions.set(sessionId, { text, files: parsed.map((p) => ({ name: p.name, kind: p.kind, chars: p.text.length })) });
    res.json({ sessionId, files: sessions.get(sessionId).files, totalChars: text.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

function getSession(req, res) {
  const s = sessions.get(req.body.sessionId || req.query.sessionId);
  if (!s) {
    res.status(404).json({ error: "Sessione non trovata. Carica di nuovo i file." });
    return null;
  }
  return s;
}

app.post("/api/explain", async (req, res) => {
  const s = getSession(req, res);
  if (!s) return;
  try {
    const md = await explain(s.text);
    res.json({ markdown: md });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/mindmap", async (req, res) => {
  const s = getSession(req, res);
  if (!s) return;
  try {
    const md = await mindmap(s.text);
    res.json({ markdown: md });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/chapters", async (req, res) => {
  const s = getSession(req, res);
  if (!s) return;
  try {
    const md = await chapters(s.text);
    res.json({ markdown: md });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/quiz", async (req, res) => {
  const s = getSession(req, res);
  if (!s) return;
  try {
    const seed = req.body.seed || Date.now();
    const data = await quiz(s.text, seed);
    res.json(data);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Style learning: upload reference, then rewrite target
app.post("/api/style/analyze", async (req, res) => {
  const s = getSession(req, res);
  if (!s) return;
  try {
    const profile = await analyzeStyle(s.text);
    res.json(profile);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/style/rewrite", async (req, res) => {
  try {
    const { targetSessionId, styleProfile } = req.body;
    const target = sessions.get(targetSessionId);
    if (!target) return res.status(404).json({ error: "Target session non trovata" });
    const md = await rewriteInStyle(target.text, styleProfile);
    res.json({ markdown: md });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/export/pdf", async (req, res) => {
  try {
    const { markdown, title } = req.body;
    if (!markdown) return res.status(400).json({ error: "markdown richiesto" });
    const pdf = await markdownToPdf(markdown, title || "Study Agent Export");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${(title||"export").replace(/[^\w]+/g,"_")}.pdf"`);
    res.send(pdf);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.get("/api/health", (req, res) => res.json({ ok: true, provider: "groq", model: process.env.LLM_MODEL || "llama-3.3-70b-versatile" }));

app.listen(PORT, () => {
  console.log(`Study Agent in ascolto su http://localhost:${PORT}`);
});
