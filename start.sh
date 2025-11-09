#!/bin/bash

# Avvia Ollama
ollama serve &

# Aspetta Ollama
until curl -s http://localhost:11434 > /dev/null; do
  echo "⏳ Attesa Ollama..."
  sleep 1
done
echo "✅ Ollama avviato"

# Pull modello
ollama pull phi3:mini

# Avvia microservizio AI
node src/ai/api.js &

# Avvia il bot
node src/index.js
