import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import Memory from "../core/models/Memory.js";

const scripts = JSON.parse(fs.readFileSync(path.resolve("src/ai/scripts.json")));
const AI_URL = process.env.AI_URL || "http://localhost:4000/respond";

/**
 * Recupera il contesto recente da MongoDB
 */
async function getContext(key) {
  const doc = await Memory.findOne({ key });
  if (!doc) return "";
  return doc.history.map(h => `${h.role}: ${h.content}`).join("\n");
}

/**
 * Salva un messaggio nel DB (persistenza)
 */
async function addMemory(key, role, content) {
  let doc = await Memory.findOne({ key });
  if (!doc) doc = new Memory({ key, history: [] });
  doc.history.push({ role, content });
  if (doc.history.length > 15) doc.history.shift();
  await doc.save();
}

/**
 * Sistema ibrido di risposta AI/script
 */
export async function handleHybridResponse(content, userId, channelId) {
  const key = channelId || userId;
  const lower = content.toLowerCase();

  // 🔹 Controllo risposte scriptate
  for (const [category, data] of Object.entries(scripts)) {
    if (data.keywords.some(k => lower.includes(k))) {
      await addMemory(key, "user", content);
      await addMemory(key, "assistant", data.reply);
      return { source: "script", category, reply: data.reply };
    }
  }

  // 🧠 Nessuna corrispondenza → chiama IA locale
  const context = await getContext(key);

  try {
    const res = await fetch(AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: content,
        context: context || "Nessun contesto recente"
      })
    });
    const data = await res.json();

    await addMemory(key, "user", content);
    await addMemory(key, "assistant", data.reply);

    return {
      source: "ai",
      category: data.category || "generico",
      reply: data.reply || "⚙️ Non ho informazioni sufficienti, ma lo staff sarà avvisato."
    };
  } catch (err) {
    console.error("❌ Errore AI ibrida:", err);
    return {
      source: "fallback",
      category: "errore",
      reply: "⚠️ Il sistema AI è momentaneamente non disponibile."
    };
  }
}

