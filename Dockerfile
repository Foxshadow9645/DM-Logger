FROM ollama/ollama:latest

WORKDIR /app

# Copia il bot
COPY . .

# Installa node e npm
RUN apt update && apt install -y nodejs npm
RUN npm install

# Avvio runtime:
# 1) Avvia Ollama
# 2) Aspetta 3 secondi che parta
# 3) Scarica il modello (una sola volta)
# 4) Avvia il bot
CMD ollama serve & sleep 3 && ollama pull phi3:mini && node src/index.js
