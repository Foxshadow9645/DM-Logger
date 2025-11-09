#!/bin/bash

# Avvia il server Ollama in background
ollama serve &

# Attendi che Ollama sia pronto (localhost:11434)
until curl -s http://localhost:11434 > /dev/null; do
  echo "⏳ Attesa Ollama..."
  sleep 1
done
echo "✅ Ollama è attivo su http://localhost:11434"

# Pull modello AI (es. phi3:mini)
ollama pull phi3:mini

# Avvia il microservizio AI (porta 4000)
node src/ai/api.js &

# Avvia il bot principale
node src/index.js
