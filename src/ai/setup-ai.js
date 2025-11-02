import fetch from "node-fetch";

/**
 * Testa la connessione con l'IA locale (Ollama o LM Studio)
 * e verifica che il modello sia attivo e risponda correttamente.
 */

export async function testAILocal() {
  const AI_URL = process.env.AI_URL || "http://localhost:4000/respond";
  console.log("🧠 Test connessione modulo AI...");

  try {
    const testPrompt = {
      question: "Verifica connessione sistema DM REALM ALPHA.",
      context: "Diagnostica interna."
    };

    const res = await fetch(AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPrompt)
    });

    if (!res.ok) {
      console.error(`❌ Errore risposta AI (${res.status})`);
      return false;
    }

    const data = await res.json();
    if (data.reply) {
      console.log("✅ AI risponde correttamente:");
      console.log("→", data.reply.slice(0, 120) + "...");
      return true;
    } else {
      console.error("⚠️ AI non ha restituito testo valido.");
      return false;
    }
  } catch (err) {
    console.error("❌ Errore durante la verifica AI:", err.message);
    return false;
  }
}
