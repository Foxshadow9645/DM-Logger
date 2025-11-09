import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;
const OLLAMA_API = process.env.OLLAMA_API || "http://localhost:11434/api/generate"; // se Ollama è in container, usa "http://ollama:11434"

app.post("/respond", async (req, res) => {
  const { question, context = "" } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Domanda mancante." });
  }

  const prompt = `${context ? `[CONTESTO]: ${context}\n` : ""}[DOMANDA]: ${question}`;

  try {
    const ollamaRes = await fetch(OLLAMA_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "phi3:mini", // puoi cambiare con "llama3", "mistral", ecc.
        prompt,
        stream: false,
      }),
    });

    if (!ollamaRes.ok) {
      const error = await ollamaRes.text();
      return res.status(500).json({ error: "Errore Ollama", detail: error });
    }

    const data = await ollamaRes.json();
    return res.json({ reply: data.response });
  } catch (err) {
    console.error("Errore contatto Ollama:", err.message);
    return res.status(500).json({ error: "Errore contatto Ollama", detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🤖 AI Microservice attivo su http://localhost:${PORT}/respond`);
});
