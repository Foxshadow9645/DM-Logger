import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import Memory from "../core/models/Memory.js";
import dotenv from "dotenv";
dotenv.config();

const scriptsPath = path.resolve("src/ai/scripts.json");
const scripts = JSON.parse(fs.readFileSync(scriptsPath, "utf8"));

const basePromptsPath = path.resolve("src/ai/training/base_prompts.json");
const basePrompts = JSON.parse(fs.readFileSync(basePromptsPath, "utf8"));

const rulesetPath = path.resolve("src/ai/training/ruleset.json");
const ruleset = JSON.parse(fs.readFileSync(rulesetPath, "utf8"));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ USA "gemini-1.5-flash" (Senza suffissi strani)
// Se questo fallisce ancora, prova "gemini-pro" (che è la versione 1.0, vecchia ma indistruttibile)
const model = genAI.getGenerativeModel({ 
    model: "gemini-pro", 
    systemInstruction: {
        role: "system",
        parts: [{ text: [...basePrompts, ...ruleset].join("\n") }]
    }
});

export async function getSmartReply(userId, messageContent, contextInfo = "") {
  try {
    const lowerMsg = messageContent.toLowerCase();

    // 1️⃣ Script statici
    for (const [key, data] of Object.entries(scripts)) {
      if (data.keywords.some(k => lowerMsg.includes(k))) {
        await saveToMemory(userId, "user", messageContent);
        await saveToMemory(userId, "model", data.reply);
        return data.reply;
      }
    }

    // 2️⃣ Memoria
    let memoryDoc = await Memory.findOne({ key: userId });
    if (!memoryDoc) memoryDoc = new Memory({ key: userId, history: [] });

    const history = memoryDoc.history.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    // 3️⃣ Generazione
    const chat = model.startChat({
      history: history,
      generationConfig: { maxOutputTokens: 400 },
    });

    const prompt = contextInfo ? `[Info Sistema: ${contextInfo}] ${messageContent}` : messageContent;
    const result = await chat.sendMessage(prompt);
    const replyText = result.response.text();

    // 4️⃣ Salvataggio
    memoryDoc.history.push({ role: "user", content: messageContent });
    memoryDoc.history.push({ role: "assistant", content: replyText });
    if (memoryDoc.history.length > 20) memoryDoc.history = memoryDoc.history.slice(-20);
    
    await memoryDoc.save();
    return replyText;

  } catch (error) {
    // Gestione Errori Specifica
    if (error.status === 429) return "⚠️ *Troppe richieste. I miei circuiti si stanno raffreddando (limitazione Google).*";
    if (error.status === 404) {
        console.error("❌ MODELLO NON TROVATO. Prova a cambiare 'gemini-1.5-flash' in 'gemini-pro' nel file geminiHandler.js");
        return "⚠️ *Errore configurazione AI: Modello non disponibile.*";
    }
    
    console.error("❌ Errore Gemini:", error);
    return "⚠️ *Errore di comunicazione con il nodo neurale AI.*";
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
