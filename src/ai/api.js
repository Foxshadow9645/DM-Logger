// ─────────────────────────────────────────────
// 🤖 DM REALM ALPHA — AI MICROSERVICE (ibrido L2)
// ─────────────────────────────────────────────

import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
dotenv.config();

// Server Express
const app = express();
app.use(bodyParser.json());

// Porta del microservizio
const PORT = process.env.AI_PORT || 4000;

// ─────────────────────────────────────────────
// 📚 Carica scripts.json (risposte locali)
// ─────────────────────────────────────────────
const scriptPath = path.resolve("src/ai/scripts.json");
let scripts = {};

try {
  scripts = JSON.parse(fs.readFileSync(scriptPath, "utf-8"));
  console.log(`📜 Script AI caricati (${Object.keys(scripts).length} categorie)`);
} catch {
  console.warn("⚠️ Nessun scripts.json trovato. Verrà usata solo AI.");
}

// ─────────────────────────────────────────────
// 🎙️ Personalità AI (tono professionale scelto)
// ─────────────────────────────────────────────
const aiInstructions = `
Sei l'assistente ufficiale del Supporto DM REALM ALPHA.
Tono: professionale, calmo, chiaro. Nessuna emoji.
Se la richiesta è chiara, rispondi direttamente.
Se la richiesta è vaga, chiedi un dettaglio specifico.
Se serve staff, rispondi: "Sto inoltrando questa richiesta allo staff. Attendere."
`;

// ─────────────────────────────────────────────
// 🧠 FUNZIONE IBRIDA (Script locale → AI → Fallback)
// ─────────────────────────────────────────────
async function generateResponse(question) {
  const q = question.toLowerCase();

  // 1️⃣ Risposte locali da scripts.json
  for (const key in scripts) {
    if (q.includes(key.toLowerCase())) {
      const replies = scripts[key];
      return replies[Math.floor(Math.random() * replies.length)];
    }
  }

  // 2️⃣ AI avanzata via Ollama
  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "phi3:mini",
        prompt: `${aiInstructions}\nUtente: ${question}\nRisposta:`
      })
    });

    const data = await response.json();
    if (data?.response) return data.response.trim();
  } catch (err) {
    console.log("⚠️ AI locale non raggiungibile:", err.message);
  }

  // 3️⃣ Fallback finale → escalation staff
  return "Sto inoltrando questa richiesta allo staff. Attendere.";
}

// ─────────────────────────────────────────────
// 🔗 ENDPOINT API — POST /respond
// ─────────────────────────────────────────────
app.post("/respond", async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "Parametro 'question' mancante." });

  const reply = await generateResponse(question);
  res.json({ reply });
});

// ─────────────────────────────────────────────
// 🚀 START
// ─────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🤖 AI Microservice attivo su http://localhost:${PORT}/respond`);
});
