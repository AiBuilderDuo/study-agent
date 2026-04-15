import { marked } from "marked";
import puppeteer from "puppeteer";

const CSS = `
body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 780px; margin: 2rem auto; color: #1a1a1a; line-height: 1.6; padding: 0 1rem; }
h1,h2,h3 { color: #0f172a; margin-top: 1.8em; }
h1 { border-bottom: 2px solid #3b82f6; padding-bottom: .3em; }
pre { background: #f1f5f9; padding: .75rem; border-radius: 6px; overflow-x: auto; }
code { background: #f1f5f9; padding: .1rem .3rem; border-radius: 4px; font-size: .9em; }
blockquote { border-left: 4px solid #3b82f6; margin: 1em 0; padding: .4em 1em; background: #f8fafc; color: #475569; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #cbd5e1; padding: .4em .6em; }
th { background: #f1f5f9; }
`;

export async function markdownToPdf(markdown, title = "Study Agent Export") {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${CSS}</style></head><body><h1>${title}</h1>${marked.parse(markdown)}</body></html>`;
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
      printBackground: true,
    });
    return pdf;
  } finally {
    await browser.close();
  }
}
