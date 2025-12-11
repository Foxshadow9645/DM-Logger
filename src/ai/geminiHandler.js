import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import Memory from "../core/models/Memory.js";
import dotenv from "dotenv";
dotenv.config();

// Carichiamo le configurazioni JSON
const scriptsPath = path.resolve("src/ai/scripts.json");
const scripts = JSON.parse(fs.readFileSync(scriptsPath, "utf8"));

const basePromptsPath = path.resolve("src/ai/training/base_prompts.json");
const basePrompts = JSON.parse(fs.readFileSync(basePromptsPath, "utf8"));

const rulesetPath = path.resolve("src/ai/training/ruleset.json");
const ruleset = JSON.parse(fs.readFileSync(rulesetPath, "utf8"));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ USA QUESTA VERSIONE SPECIFICA (Più stabile e con limiti più alti)
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash-002", 
    systemInstruction: {
        role: "system",
        parts: [{ text: [...basePrompts, ...ruleset].join("\n") }]
    }
});

/**
 * Gestisce la risposta intelligente
 */
export async function getSmartReply(userId, messageContent, contextInfo = "") {
  try {
    const lowerMsg = messageContent.toLowerCase();

    // 1️⃣ CONTROLLO SCRIPT (Risparmia chiamate AI)
    for (const [key, data] of Object.entries(scripts)) {
      if (data.keywords.some(k => lowerMsg.includes(k))) {
        await saveToMemory(userId, "user", messageContent);
        await saveToMemory(userId, "model", data.reply);
        return data.reply;
      }
    }

    // 2️⃣ RECUPERO MEMORIA
    let memoryDoc = await Memory.findOne({ key: userId });
    if (!memoryDoc) {
      memoryDoc = new Memory({ key: userId, history: [] });
    }

    const history = memoryDoc.history.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    // 3️⃣ GENERAZIONE RISPOSTA AI
    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 300,
      },
    });

    const prompt = contextInfo ? `[Info Sistema: ${contextInfo}] ${messageContent}` : messageContent;

    const result = await chat.sendMessage(prompt);
    const replyText = result.response.text();

    // 4️⃣ SALVATAGGIO
    memoryDoc.history.push({ role: "user", content: messageContent });
    memoryDoc.history.push({ role: "assistant", content: replyText });

    if (memoryDoc.history.length > 20) {
      memoryDoc.history = memoryDoc.history.slice(-20);
    }
    
    await memoryDoc.save();

    return replyText;

  } catch (error) {
    // Gestione specifica dell'errore 429 (Troppe richieste)
    if (error.status === 429 || (error.message && error.message.includes("429"))) {
        console.warn("⚠️ Quota Gemini superata (429).");
        return "⚠️ *I miei circuiti sono sovraccarichi. Per favore, attendi un minuto prima di farmi un'altra domanda.*";
    }
    
    console.error("❌ Errore Gemini Handler:", error);
    return "⚠️ *Errore di comunicazione con il nodo neurale AI. Riprova più tardi.*";
  }
}

async function saveToMemory(userId, role, content) {
    const mappedRole = role === "model" ? "assistant" : "user";
    await Memory.findOneAndUpdate(
        { key: userId },
        { $push: { history: { role: mappedRole, content } } },
        { upsert: true, new: true }
    );
}
