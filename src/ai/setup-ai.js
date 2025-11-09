// ─────────────────────────────────────────────
// 🧠 DM REALM ALPHA LOGGER — Setup AI (Pipedream)
// ─────────────────────────────────────────────

import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

/**
 * Testa la connessione con il microservizio AI (Pipedream o HTTP esterno)
 */
export async function testAILocal() {
  const AI_URL = process.env.AI_ENDPOINT;

  console.log("🧠 Test connessione modulo AI...");
  console.log("→ Endpoint:", AI_URL);

  if (!AI_URL) {
    console.error("❌ Variabile AI_ENDPOINT mancante nel .env");
    return;
  }

  try {
    const response = await fetch(AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "Test", context: "Verifica connessione" }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ Errore risposta AI:", text);
      return;
    }

    const data = await response.json();
    console.log("✅ AI risponde correttamente:");
    console.log("→", data.reply || "Nessuna risposta definita");
  } catch (err) {
    console.error("❌ Errore durante la verifica AI:", err.message);
  }
}
