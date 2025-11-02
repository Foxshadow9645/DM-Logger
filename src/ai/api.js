// ─────────────────────────────────────────────
// 🤖 DM REALM ALPHA — AI MICROSERVICE
// Versione 2.0 – Compatibile Node.js v22 / Express 4.19
// ─────────────────────────────────────────────

import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();

// ─────────────────────────────────────────────
// ⚙️ CONFIGURAZIONE DI BASE
// ─────────────────────────────────────────────
const app = express();
app.use(bodyParser.json());

const PORT = process.env.AI_PORT || 4000;

// Messaggio di avvio
console.log("🧠 Inizializzazione microservizio DM ALPHA AI...");
console.log("⏳ Caricamento modelli ibridi...");

// ─────────────────────────────────────────────
// 📚 DATABASE RISPOSTE STATICHE (SCRIPT BASE)
// ─────────────────────────────────────────────
import fs from "fs";
import path from "path";

const scriptPath = path.resolve("src/ai/scripts.json");
let scripts = {};

try {
  scripts = JSON.parse(fs.readFileSync(scriptPath, "utf-8"));
  console.log(`📜 Script AI caricati (${Object.keys(scripts).length} categorie)`);
} catch (err) {
  console.warn("⚠️ Nessun file scripts.json trovato o errore di parsing.");
}

// ─────────────────────────────────────────────
// 🧩 FUNZIONE RISPOSTA AI IBRIDA
// ─────────────────────────────────────────────
function generateResponse(question, context = "") {
  const q = question.toLowerCase();

  // 1️⃣ Risposte definite nello script.json
  for (const key in scripts) {
    if (q.includes(key.toLowerCase())) {
      const possible = scripts[key];
      const random = possible[Math.floor(Math.random() * possible.length)];
      return random;
    }
  }

  // 2️⃣ Risposte predefinite per fallback
  if (q.includes("ai") || q.includes("assistente")) {
    return "🧠 Sono l’assistente DM ALPHA, posso segnalare, analizzare o creare log. Come posso aiutarti?";
  }
  if (q.includes("ticket") || q.includes("problema")) {
    return "📩 Sembra che tu stia parlando di un ticket. Posso aiutarti ad aprirne uno o a contattare lo staff.";
  }

  // 3️⃣ Fallback finale
  return "🤖 Non ho informazioni specifiche su questo argomento, ma il mio sistema di log lo inoltrerà allo staff per analisi.";
}

// ─────────────────────────────────────────────
// 🔗 ENDPOINT API — /respond
// ─────────────────────────────────────────────
app.post("/respond", async (req, res) => {
  try {
    const { question, context } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: "Richiesta non valida: 'question' mancante." });
    }

    const reply = generateResponse(question, context);
    res.json({ reply, model: "DM-ALPHA-Local" });
  } catch (err) {
    console.error("❌ Errore durante la risposta AI:", err.message);
    res.status(500).json({ error: "Errore interno AI" });
  }
});

// ─────────────────────────────────────────────
// 🧪 ENDPOINT DI TEST — GET /ping
// ─────────────────────────────────────────────
app.get("/ping", (req, res) => {
  res.json({ status: "online", service: "DM-ALPHA-AI", timestamp: Date.now() });
});

// ─────────────────────────────────────────────
// 🚀 AVVIO SERVER
// ─────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🤖 DM ALPHA AI Microservice attivo sulla porta ${PORT}`);
  console.log("✅ Pronto per ricevere richieste su /respond e /ping");
});
