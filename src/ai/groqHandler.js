import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import Memory from "../core/models/Memory.js";
import dotenv from "dotenv";
dotenv.config();

// ─────────────────────────────────────────────
// 📂 CARICAMENTO DATI DI ADDESTRAMENTO
// ─────────────────────────────────────────────

// 1. Script statici (Risposte preimpostate)
const scriptsPath = path.resolve("src/ai/scripts.json");
const scripts = JSON.parse(fs.readFileSync(scriptsPath, "utf8"));

// 2. Prompt Base (Personalità e Tono)
const basePromptsPath = path.resolve("src/ai/training/base_prompts.json");
const basePrompts = JSON.parse(fs.readFileSync(basePromptsPath, "utf8"));

// 3. Regole Operative (Cosa fare e non fare)
const rulesetPath = path.resolve("src/ai/training/ruleset.json");
const ruleset = JSON.parse(fs.readFileSync(rulesetPath, "utf8"));

// 4. Info Server & Gerarchia (Holder, Founder, Ruoli, ecc.) - [NUOVO]
const serverInfoPath = path.resolve("src/ai/training/server_info.json");
const serverInfo = JSON.parse(fs.readFileSync(serverInfoPath, "utf8"));

// ─────────────────────────────────────────────
// 🤖 CONFIGURAZIONE CLIENT AI
// ─────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// COSTRUZIONE DEL SYSTEM PROMPT GLOBALE
// Uniamo: Personalità + Regole + Conoscenza del Server
const BASE_SYSTEM_PROMPT = [
  ...basePrompts, 
  ...ruleset, 
  `INFO SERVER, GERARCHIA E PUNIZIONI: ${JSON.stringify(serverInfo)}`
].join("\n");

// ─────────────────────────────────────────────
// 🧠 FUNZIONE PRINCIPALE DI RISPOSTA
// ─────────────────────────────────────────────
export async function getSmartReply(userId, messageContent, contextInfo = "") {
  try {
    const lowerMsg = messageContent.toLowerCase();

    // 1️⃣ Script statici (Risposte veloci senza AI)
    // Utile per comandi immediati o FAQ comuni
    for (const [key, data] of Object.entries(scripts)) {
      if (data.keywords.some(k => lowerMsg.includes(k))) {
        await saveToMemory(userId, "user", messageContent);
        await saveToMemory(userId, "assistant", data.reply);
        return data.reply;
      }
    }

    // 2️⃣ Recupero Memoria dal DB (Storia conversazione)
    let memoryDoc = await Memory.findOne({ key: userId });
    if (!memoryDoc) memoryDoc = new Memory({ key: userId, history: [] });

    // 3️⃣ COSTRUZIONE MESSAGGI PER L'IA
    
    // A. Il System Message contiene le regole generali e la conoscenza del server
    const messages = [{ role: "system", content: BASE_SYSTEM_PROMPT }];

    // B. Se c'è un contesto tecnico del ticket (es. Categoria: Partnership), lo aggiungiamo temporaneamente
    // Questo permette all'AI di sapere il contesto attuale senza salvarlo permanentemente
    if (contextInfo) {
      messages.push({ 
        role: "system", 
        content: `[CONTESTO ATTUALE - INFO SISTEMA]\n${contextInfo}` 
      });
    }

    // C. Aggiungiamo la storia della chat (ultimi messaggi scambiati)
    messages.push(...memoryDoc.history.map(m => ({
      role: m.role,
      content: m.content
    })));

    // D. Aggiungiamo il nuovo messaggio dell'utente
    messages.push({ role: "user", content: messageContent });

    // 4️⃣ Chiamata API (Groq / Llama 3)
    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile", // Modello molto performante
      temperature: 0.7, // Creatività bilanciata
      max_tokens: 450,
      stream: false,
    });

    const replyText = chatCompletion.choices[0]?.message?.content || "⚠️ Errore generazione risposta.";

    // 5️⃣ Salvataggio in Memoria (Solo testo utente e risposta AI)
    memoryDoc.history.push({ role: "user", content: messageContent });
    memoryDoc.history.push({ role: "assistant", content: replyText });
    
    // Manteniamo solo gli ultimi 12 messaggi per non saturare la memoria
    if (memoryDoc.history.length > 12) memoryDoc.history = memoryDoc.history.slice(-12);
    
    await memoryDoc.save();
    return replyText;

  } catch (error) {
    console.error("❌ Errore Groq:", error.message);
    return "⚠️ *Errore di comunicazione con il server AI. Riprova più tardi.*";
  }
}

// Funzione helper per salvare manualmente se necessario (usata dagli script statici)
async function saveToMemory(userId, role, content) {
    await Memory.findOneAndUpdate(
        { key: userId },
        { $push: { history: { role, content } } },
        { upsert: true, new: true }
    );
}
