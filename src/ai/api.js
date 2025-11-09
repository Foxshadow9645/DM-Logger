// ─────────────────────────────────────────────
// 🔗 DM REALM ALPHA — AI CONNECTOR (PIPEDREAM VERSION)
// ─────────────────────────────────────────────

import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

export async function askAI(question, context = "") {
  const endpoint = process.env.AI_ENDPOINT; // URL Pipedream es: https://xxx.m.pipedream.net
  if (!endpoint) {
    console.error("❌ Nessun endpoint AI configurato nel .env (AI_ENDPOINT mancante)");
    return "⚠️ Errore interno: endpoint AI non configurato.";
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, context }),
    });

    if (!res.ok) {
      console.error(`⚠️ Errore chiamata AI: ${res.status}`);
      return "⚠️ L'assistente non è momentaneamente disponibile.";
    }

    const data = await res.json();
    return data.reply || "⚠️ Nessuna risposta dal modello.";
  } catch (err) {
    console.error("❌ Errore connessione AI:", err.message);
    return "⚠️ Errore di connessione con il microservizio AI.";
  }
}
