#!/bin/bash

# Avvia Ollama in background (già incluso nella base image)
ollama serve &

# Aspetta che Ollama sia pronto sulla porta 11434
echo "⏳ Aspetto Ollama..."
until curl -s http://localhost:11434 > /dev/null; do
  sleep 1
done
echo "✅ Ollama è attivo!"

# Avvia il microservizio AI
node src/ai/api.js &

# Avvia il bot Discord
node src/index.js
