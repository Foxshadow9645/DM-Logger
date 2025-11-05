import fetch from "node-fetch";

/**
 * Testa la connessione con l'IA locale (Ollama o LM Studio)
 * e verifica che il modello sia attivo e risponda correttamente.
 */
export async function testAILocal() {
  // Usa base URL, non l'endpoint, così aggiungiamo noi /respond in modo sicuro
  const BASE = process.env.AI_URL || "http://127.0.0.1:4000";
  const ENDPOINT = `${BASE.replace(/\/+$/, "")}/respond`;

  console.log("🧠 Test connessione modulo AI...");
  console.log("→ Endpoint:", ENDPOINT);

  try {
    const testPrompt = {
      question: "Verifica connessione sistema DM REALM ALPHA.",
      context: "Diagnostica interna."
    };

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPrompt)
    });

    if (!res.ok) {
      console.error(`❌ Errore risposta AI (${res.status})`);
      return false;
    }

    const data = await res.json();
    if (data?.reply) {
      console.log("✅ AI risponde correttamente:");
      console.log("→", (data.reply || "").slice(0, 120) + "...");
      return true;
    }

    console.error("⚠️ AI non ha restituito testo valido.");
    return false;
  } catch (err) {
    console.error("❌ Errore durante la verifica AI:", err.message);
    return false;
  }
}
