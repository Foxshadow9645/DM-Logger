import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

/**
 * Testa la connessione con il microservizio AI remoto (Pipedream)
 */
export async function testAILocal() {
  const AI_URL = process.env.AI_ENDPOINT; // ✅ cambia da AI_URL locale a AI_ENDPOINT remoto
  console.log("🧠 Test connessione modulo AI...");
  console.log("→ Endpoint:", AI_URL);
