import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

async function testAI() {
  const endpoint = process.env.AI_ENDPOINT;
  if (!endpoint) {
    console.error("❌ Variabile AI_ENDPOINT mancante nel file .env");
    process.exit(1);
  }

  console.log("🧠 Test connessione al microservizio AI remoto...");
  console.log("→ Endpoint:", endpoint);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "Verifica connessione DM Realm Alpha Logger",
        context: "Test diagnostico Pipedream",
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("❌ Errore risposta AI:", res.status, text);
      process.exit(1);
    }

    const data = await res.json();
    console.log("✅ Risposta AI:");
    console.log("→", data.reply || "⚠️ Nessuna risposta ricevuta.");
  } catch (err) {
    console.error("❌ Errore di connessione:", err.message);
  }
}

testAI();
