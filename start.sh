#!/bin/bash
set -e

echo "🚀 Avvio Ollama..."
ollama serve &

# Attendi che Ollama parta
echo "⏳ Aspetto Ollama..."
until curl -s http://localhost:11434/api/tags > /dev/null; do
  sleep 1
done
echo "✅ Ollama attivo!"

echo "⬇️ Download modello phi3:mini..."
ollama pull phi3:mini || true

echo "🤖 Avvio microservizio AI..."
node src/ai/api.js &

# Attendi che il microservizio sia attivo (porta 4000)
echo "⏳ Aspetto microservizio AI..."
until curl -s http://localhost:4000/respond > /dev/null; do
  sleep 1
done
echo "✅ Microservizio AI attivo!"

echo "🧠 Avvio bot Discord..."
node src/index.js
