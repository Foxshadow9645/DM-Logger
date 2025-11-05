// ─────────────────────────────────────────────
// 🧠 IMPORT: AI L2 via Ollama (locale nel container)
// ─────────────────────────────────────────────
import fetch from "node-fetch";

// Istruzioni stile professionale
const aiInstructions = `
Sei l'assistente ufficiale del Supporto DM REALM ALPHA.
Tono: professionale, calmo, chiaro. Nessuna emoji.
Se la richiesta è chiara, rispondi in modo diretto.
Se la richiesta è confusa, chiedi un dettaglio specifico.
Se serve staff, rispondi: "Sto inoltrando questa richiesta allo staff. Attendere."
`;

// ─────────────────────────────────────────────
// 🧩 FUNZIONE RISPOSTA AI IBRIDA
// ─────────────────────────────────────────────
async function generateResponse(question, context = "") {
  const q = question.toLowerCase();

  // 1️⃣ RISPOSTE DEFINITE NEL scripts.json
  for (const key in scripts) {
    if (q.includes(key.toLowerCase())) {
      const possible = scripts[key];
      const random = possible[Math.floor(Math.random() * possible.length)];
      return random; // risposta locale → immediata
    }
  }

  // 2️⃣ FALLBACK INTELLIGENTE → CHIAMA OLLAMA
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
    console.warn("⚠️ Ollama non disponibile, uso fallback statico.");
  }

  // 3️⃣ FALLBACK FINALE (nessuna AI disponibile)
  return "Sto inoltrando questa richiesta allo staff. Attendere.";
}

// ─────────────────────────────────────────────
// 🔗 ENDPOINT API — /respond (aggiornato!)
// ─────────────────────────────────────────────
app.post("/respond", async (req, res) => {
  try {
    const { question, context } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: "Richiesta non valida: 'question' mancante." });
    }

    const reply = await generateResponse(question, context);
    res.json({ reply, model: "PHI-3 Mini (Ollama) + Script Local" });
  } catch (err) {
    console.error("❌ Errore durante la risposta AI:", err.message);
    res.status(500).json({ error: "Errore interno AI" });
  }
});
