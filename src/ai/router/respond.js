import express from "express";
import fetch from "node-fetch";
import basePrompts from "../training/base_prompts.json" assert { type: "json" };
import ruleset from "../training/ruleset.json" assert { type: "json" };

export const respondRouter = express.Router();

respondRouter.post("/", async (req, res) => {
  const { question, context } = req.body;
  if (!question) return res.status(400).json({ error: "missing question" });

  const prompt = [
    ...basePrompts,
    "Contesto conversazione:",
    context || "Nessun contesto precedente",
    "\nUtente:",
    question
  ].join("\n");

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral",
        prompt,
        stream: false
      })
    });

    const data = await response.json();
    const reply = data.response || "⚙️ Non riesco a elaborare una risposta ora.";
    res.json({ reply, category: detectCategory(reply) });
  } catch (err) {
    console.error("❌ Errore AI locale:", err);
    res.status(500).json({ reply: "⚠️ Errore nel modulo AI locale." });
  }
});

function detectCategory(text) {
  const t = text.toLowerCase();
  if (t.includes("permesso") || t.includes("accesso")) return "permessi";
  if (t.includes("ban") || t.includes("kick")) return "disciplinare";
  if (t.includes("ticket") || t.includes("help")) return "supporto";
  if (t.includes("staff") || t.includes("mod")) return "abuso_staff";
  return "generico";
}

