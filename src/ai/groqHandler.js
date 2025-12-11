import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import Memory from "../core/models/Memory.js";
import dotenv from "dotenv";
dotenv.config();

// Carichiamo i file di configurazione (Prompt e Regole)
const scriptsPath = path.resolve("src/ai/scripts.json");
const scripts = JSON.parse(fs.readFileSync(scriptsPath, "utf8"));

const basePromptsPath = path.resolve("src/ai/training/base_prompts.json");
const basePrompts = JSON.parse(fs.readFileSync(basePromptsPath, "utf8"));

const rulesetPath = path.resolve("src/ai/training/ruleset.json");
const ruleset = JSON.parse(fs.readFileSync(rulesetPath, "utf8"));

// Inizializza Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Costruiamo il System Prompt unico
const SYSTEM_PROMPT = [...basePrompts, ...ruleset].join("\n");

export async function getSmartReply(userId, messageContent, contextInfo = "") {
  try {
    const lowerMsg = messageContent.toLowerCase();

    // 1️⃣ Script statici (Risposte preimpostate veloci)
    for (const [key, data] of Object.entries(scripts)) {
      if (data.keywords.some(k => lowerMsg.includes(k))) {
        await saveToMemory(userId, "user", messageContent);
        await saveToMemory(userId, "assistant", data.reply);
        return data.reply;
      }
    }

    // 2️⃣ Recupero Memoria dal DB
    let memoryDoc = await Memory.findOne({ key: userId });
    if (!memoryDoc) memoryDoc = new Memory({ key: userId, history: [] });

    // 3️⃣ Costruzione messaggi per Llama 3
    // Groq vuole: System Message + Storia Chat + Nuovo Messaggio
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...memoryDoc.history.map(m => ({
        role: m.role, // 'user' o 'assistant' sono già corretti nel DB
        content: m.content
      }))
    ];

    // Aggiungiamo il contesto attuale e il messaggio dell'utente
    const finalPrompt = contextInfo ? `[Info Sistema: ${contextInfo}] ${messageContent}` : messageContent;
    messages.push({ role: "user", content: finalPrompt });

    // 4️⃣ Chiamata all'AI (Usiamo Llama 3.3 o 3.1 che sono velocissimi)
    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile", // O "llama3-8b-8192" per max velocità
      temperature: 0.7,
      max_tokens: 400,
      stream: false,
    });

    const replyText = chatCompletion.choices[0]?.message?.content || "⚠️ Errore generazione risposta.";

    // 5️⃣ Salvataggio in Memoria
    memoryDoc.history.push({ role: "user", content: messageContent });
    memoryDoc.history.push({ role: "assistant", content: replyText });
    
    // Manteniamo solo gli ultimi 20 messaggi per non intasare il DB
    if (memoryDoc.history.length > 20) memoryDoc.history = memoryDoc.history.slice(-20);
    
    await memoryDoc.save();
    return replyText;

  } catch (error) {
    console.error("❌ Errore Groq:", error.message);
    return "⚠️ *Errore di comunicazione con il server AI (Groq).*";
  }
}

async function saveToMemory(userId, role, content) {
    await Memory.findOneAndUpdate(
        { key: userId },
        { $push: { history: { role, content } } },
        { upsert: true, new: true }
    );
}
