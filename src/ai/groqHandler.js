import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import Memory from "../core/models/Memory.js";
import dotenv from "dotenv";
dotenv.config();

// Carichiamo configurazioni
const scriptsPath = path.resolve("src/ai/scripts.json");
const scripts = JSON.parse(fs.readFileSync(scriptsPath, "utf8"));

const basePromptsPath = path.resolve("src/ai/training/base_prompts.json");
const basePrompts = JSON.parse(fs.readFileSync(basePromptsPath, "utf8"));

const rulesetPath = path.resolve("src/ai/training/ruleset.json");
const ruleset = JSON.parse(fs.readFileSync(rulesetPath, "utf8"));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// System Prompt Base
const BASE_SYSTEM_PROMPT = [...basePrompts, ...ruleset].join("\n");

export async function getSmartReply(userId, messageContent, contextInfo = "") {
  try {
    const lowerMsg = messageContent.toLowerCase();

    // 1️⃣ Script statici (Risposte veloci)
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

    // 3️⃣ COSTRUZIONE MESSAGGI (LA PARTE CRITICA MODIFICATA)
    
    // A. Il System Message contiene le regole generali
    const messages = [{ role: "system", content: BASE_SYSTEM_PROMPT }];

    // B. Se c'è un contesto tecnico (Info Sistema), lo aggiungiamo come System Message temporaneo
    // Questo permette all'AI di saperlo ORA, ma non lo salviamo nella storia chat!
    if (contextInfo) {
      messages.push({ 
        role: "system", 
        content: `[CONTESTO ATTUALE - NON RIPETERE ALL'UTENTE]\n${contextInfo}` 
      });
    }

    // C. Aggiungiamo la storia della chat (solo i messaggi puliti)
    messages.push(...memoryDoc.history.map(m => ({
      role: m.role,
      content: m.content
    })));

    // D. Aggiungiamo il nuovo messaggio dell'utente (PULITO, senza contesto incollato)
    messages.push({ role: "user", content: messageContent });

    // 4️⃣ Chiamata AI
    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.8, // Alzato leggermente per più varietà
      max_tokens: 400,
      stream: false,
    });

    const replyText = chatCompletion.choices[0]?.message?.content || "⚠️ Errore generazione risposta.";

    // 5️⃣ Salvataggio PULITO in Memoria (Solo testo utente e risposta AI)
    memoryDoc.history.push({ role: "user", content: messageContent });
    memoryDoc.history.push({ role: "assistant", content: replyText });
    
    // Manteniamo solo gli ultimi 10 messaggi per evitare confusione
    if (memoryDoc.history.length > 10) memoryDoc.history = memoryDoc.history.slice(-10);
    
    await memoryDoc.save();
    return replyText;

  } catch (error) {
    console.error("❌ Errore Groq:", error.message);
    return "⚠️ *Errore di comunicazione con il server AI.*";
  }
}

async function saveToMemory(userId, role, content) {
    await Memory.findOneAndUpdate(
        { key: userId },
        { $push: { history: { role, content } } },
        { upsert: true, new: true }
    );
}
