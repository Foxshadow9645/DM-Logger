#!/bin/bash

# Avvia Ollama
ollama serve &

# Aspetta che Ollama sia online
echo "⏳ Avvio di Ollama..."
until curl -s http://localhost:11434 > /dev/null; do
  sleep 1
done
echo "✅ Ollama è online!"

# Scarica il modello LLM (adesso che Ollama è attivo)
ollama pull phi3:mini

# Avvia il microservizio AI
node src/ai/api.js &

# Avvia il bot Discord
node src/index.js
