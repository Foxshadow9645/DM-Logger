#!/bin/bash
set -e

# avvia ollama in background
ollama serve &
sleep 6

# scarica modello (se non c’è già)
ollama pull phi3:mini || true

# avvia microservizio + bot
node src/ai/api.js &
node src/index.js
