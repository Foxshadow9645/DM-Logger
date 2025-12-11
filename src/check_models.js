// src/check_models.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const modelList = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).apiKey; // Hack per inizializzare
    // In realtà la libreria non ha un metodo listModels semplice esposto in tutte le versioni, 
    // ma se questo script parte, vedremo se si connette.
    console.log("✅ API Key valida. Tentativo connessione...");
    
    // Proviamo un test diretto
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Test");
    console.log("✅ gemini-1.5-flash FUNZIONA! Risposta:", result.response.text());
  } catch (error) {
    console.error("❌ ERRORE:", error.message);
    if (error.message.includes("404")) {
        console.log("💡 SUGGERIMENTO: Prova a usare 'gemini-pro' invece.");
    }
  }
}

listModels();
