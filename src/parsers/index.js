import fs from "fs/promises";
import path from "path";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import { createWorker } from "tesseract.js";
import { isAudio, transcribeAudio } from "./audio.js";

const TEXT_EXTS = new Set([".txt", ".md", ".markdown", ".rtf", ".csv", ".json", ".html", ".htm"]);
const IMG_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"]);

export async function parseFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const name = path.basename(filePath);

  if (ext === ".pdf") {
    const buf = await fs.readFile(filePath);
    const data = await pdfParse(buf);
    return { name, text: data.text, kind: "pdf" };
  }

  if (ext === ".docx") {
    const { value } = await mammoth.extractRawText({ path: filePath });
    return { name, text: value, kind: "docx" };
  }

  if (TEXT_EXTS.has(ext)) {
    const text = await fs.readFile(filePath, "utf8");
    return { name, text, kind: "text" };
  }

  if (isAudio(filePath)) {
    const { text, error } = await transcribeAudio(filePath);
    return { name, text, kind: "audio", error };
  }

  if (IMG_EXTS.has(ext)) {
    const worker = await createWorker("ita+eng");
    const { data } = await worker.recognize(filePath);
    await worker.terminate();
    return { name, text: data.text, kind: "image-ocr" };
  }

  // Fallback: leggi come testo grezzo
  try {
    const text = await fs.readFile(filePath, "utf8");
    return { name, text, kind: "raw" };
  } catch {
    return { name, text: "", kind: "unsupported" };
  }
}

export async function parseMany(filePaths) {
  const out = [];
  for (const fp of filePaths) {
    try {
      out.push(await parseFile(fp));
    } catch (e) {
      out.push({ name: path.basename(fp), text: "", kind: "error", error: String(e) });
    }
  }
  return out;
}

export function concatParsed(parsed) {
  return parsed
    .filter((p) => p.text && p.text.trim())
    .map((p) => `===== FILE: ${p.name} =====\n${p.text}`)
    .join("\n\n");
}
