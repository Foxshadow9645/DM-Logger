import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import Memory from "../core/models/Memory.js";
import dotenv from "dotenv";
dotenv.config();

// Carichiamo le configurazioni JSON (Training e Script)
const scriptsPath = path.resolve("src/ai/scripts.json");
const scripts = JSON.parse(fs.readFileSync(scriptsPath, "utf8"));

const basePromptsPath = path.resolve("src/ai/training/base_prompts.json");
const basePrompts = JSON.parse(fs.readFileSync(basePromptsPath, "utf8"));

const rulesetPath = path.resolve("src/ai/training/ruleset.json");
const ruleset = JSON.parse(fs.readFileSync(rulesetPath, "utf8"));

// Inizializza Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: {
        role: "system",
        parts: [{ text: [...basePrompts, ...ruleset].join("\n") }]
    }
});

/**
 * Gestisce la risposta intelligente
 * @param {string} userId - ID dell'utente (per la memoria)
 * @param {string} messageContent - Il messaggio dell'utente
 * @param {string} contextInfo - Info extra (es. ticket ID, nome utente)
 */
export async function getSmartReply(userId, messageContent, contextInfo = "") {
  try {
    const lowerMsg = messageContent.toLowerCase();

    // 1️⃣ CONTROLLO SCRIPT (Risposte rapide senza sprecare token AI)
    // Controlla se il messaggio contiene parole chiave definite in scripts.json
    for (const [key, data] of Object.entries(scripts)) {
      if (data.keywords.some(k => lowerMsg.includes(k))) {
        // Salviamo comunque nella memoria per contesto
        await saveToMemory(userId, "user", messageContent);
        await saveToMemory(userId, "model", data.reply);
        return data.reply;
      }
    }

    // 2️⃣ RECUPERO MEMORIA (MongoDB)
    let memoryDoc = await Memory.findOne({ key: userId });
    if (!memoryDoc) {
      memoryDoc = new Memory({ key: userId, history: [] });
    }

    // Convertiamo la storia per Gemini
    const history = memoryDoc.history.map(m => ({
      role: m.role === "assistant" ? "model" : "user", // Mappa 'assistant' -> 'model'
      parts: [{ text: m.content }]
    }));

    // 3️⃣ GENERAZIONE RISPOSTA AI
    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 300,
      },
    });

    // Aggiungiamo il contesto extra nel messaggio corrente se serve
    const prompt = contextInfo ? `[Info Sistema: ${contextInfo}] ${messageContent}` : messageContent;

    const result = await chat.sendMessage(prompt);
    const replyText = result.response.text();

    // 4️⃣ SALVATAGGIO MEMORIA
    // Salviamo user
    memoryDoc.history.push({ role: "user", content: messageContent });
    // Salviamo risposta AI (usiamo 'assistant' per compatibilità col tuo Schema Mongoose)
    memoryDoc.history.push({ role: "assistant", content: replyText });

    // Manteniamo solo gli ultimi 20 messaggi per non intasare il DB
    if (memoryDoc.history.length > 20) {
      memoryDoc.history = memoryDoc.history.slice(-20);
    }
    
    await memoryDoc.save();

    return replyText;

  } catch (error) {
    console.error("❌ Errore Gemini Handler:", error);
    return "⚠️ *Errore di comunicazione con il nodo neurale AI. Riprova più tardi.*";
  }
}

async function saveToMemory(userId, role, content) {
    // Funzione helper per salvare quando usiamo gli script
    const mappedRole = role === "model" ? "assistant" : "user";
    await Memory.findOneAndUpdate(
        { key: userId },
        { $push: { history: { role: mappedRole, content } } },
        { upsert: true, new: true }
    );
}
