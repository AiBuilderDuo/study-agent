let sessionId = null;
let targetSessionId = null;
let styleProfile = null;

const out = document.getElementById("output");
const info = document.getElementById("uploadInfo");
const styleInfo = document.getElementById("styleInfo");

mermaid.initialize({ startOnLoad: false, theme: "dark" });

let lastMarkdown = "";
let lastTitle = "Study Agent Export";
function setOutput(html, md, title) { out.innerHTML = html; if (md) { lastMarkdown = md; lastTitle = title || lastTitle; } renderMermaid(); }
function setLoading(label) { setOutput(`<p>⏳ ${label}...</p>`); }

async function renderMermaid() {
  const blocks = out.querySelectorAll("pre code.language-mermaid, code.language-mermaid");
  for (const b of blocks) {
    const src = b.textContent;
    const div = document.createElement("div");
    div.className = "mermaid";
    div.textContent = src;
    b.closest("pre")?.replaceWith(div) || b.replaceWith(div);
  }
  try { await mermaid.run(); } catch(e) { console.warn(e); }
}

async function api(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

async function uploadFiles(inputId) {
  const input = document.getElementById(inputId);
  if (!input.files.length) throw new Error("Seleziona almeno un file");
  const fd = new FormData();
  for (const f of input.files) fd.append("files", f);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload fallito");
  return res.json();
}

document.getElementById("uploadBtn").onclick = async () => {
  info.textContent = "Caricamento in corso...";
  try {
    const r = await uploadFiles("files");
    sessionId = r.sessionId;
    info.innerHTML = `<b>Caricati ${r.files.length} file</b> (${r.totalChars} caratteri estratti)<br/>${r.files.map(f=>`• ${f.name} [${f.kind}]`).join("<br/>")}`;
  } catch (e) { info.textContent = "Errore: " + e.message; }
};

document.getElementById("uploadTargetBtn").onclick = async () => {
  styleInfo.textContent = "Caricamento target...";
  try {
    const r = await uploadFiles("targetFiles");
    targetSessionId = r.sessionId;
    styleInfo.innerHTML += `<br/>Target caricato (${r.totalChars} caratteri)`;
    document.getElementById("rewriteBtn").disabled = !(styleProfile && targetSessionId);
  } catch (e) { styleInfo.textContent = "Errore: " + e.message; }
};

document.querySelectorAll("button[data-action]").forEach((btn) => {
  btn.onclick = async () => {
    if (!sessionId) return alert("Carica prima i file");
    const action = btn.dataset.action;
    setLoading(action);
    try {
      if (action === "quiz") {
        const data = await api("/api/quiz", { sessionId, seed: Date.now() });
        renderQuiz(data);
      } else {
        const { markdown } = await api(`/api/${action}`, { sessionId });
        setOutput(marked.parse(markdown), markdown, action);
      }
    } catch (e) { setOutput(`<p style="color:#f87171">Errore: ${e.message}</p>`); }
  };
});

document.getElementById("analyzeStyleBtn").onclick = async () => {
  if (!sessionId) return alert("Carica prima i file di riferimento");
  styleInfo.textContent = "Analisi stile in corso...";
  try {
    const data = await api("/api/style/analyze", { sessionId });
    styleProfile = data.profile || JSON.stringify(data);
    styleInfo.innerHTML = `<b>Stile analizzato.</b><br/><pre>${styleProfile.slice(0, 1200)}...</pre>`;
    document.getElementById("rewriteBtn").disabled = !(styleProfile && targetSessionId);
  } catch (e) { styleInfo.textContent = "Errore: " + e.message; }
};

document.getElementById("rewriteBtn").onclick = async () => {
  setLoading("riscrittura nello stile");
  try {
    const { markdown } = await api("/api/style/rewrite", { targetSessionId, styleProfile });
    setOutput(marked.parse(markdown));
  } catch (e) { setOutput(`<p style="color:#f87171">Errore: ${e.message}</p>`); }
};

document.getElementById("exportPdfBtn").onclick = async () => {
  if (!lastMarkdown) return alert("Nessun output da esportare");
  const res = await fetch("/api/export/pdf", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ markdown: lastMarkdown, title: lastTitle }) });
  if (!res.ok) return alert("Export fallito");
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${lastTitle}.pdf`;
  a.click();
};

function renderQuiz(data) {
  if (!data.questions) { setOutput(`<pre>${JSON.stringify(data, null, 2)}</pre>`); return; }
  const html = data.questions.map((q, i) => {
    let body = `<b>${i+1}. [${q.type}]</b> ${q.q}`;
    if (q.options) body += "<ul>" + q.options.map(o=>`<li>${o}</li>`).join("") + "</ul>";
    body += `<details><summary>Mostra risposta</summary><p><b>Risposta:</b> ${q.answer}</p><p>${q.explanation || ""}</p></details>`;
    return `<div class="quiz-q">${body}</div>`;
  }).join("");
  setOutput(`<h3>Quiz (seed ${data.seed})</h3>${html}`);
}
