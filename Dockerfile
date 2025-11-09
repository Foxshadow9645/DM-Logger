FROM ollama/ollama:latest

# Crea la cartella di lavoro
WORKDIR /app

# Copia tutto il codice
COPY . .

# Installa Node.js e npm
RUN apt update && apt install -y nodejs npm

# Installa le dipendenze
RUN npm install

# Rendi eseguibile lo script
RUN chmod +x start.sh

# Healthcheck per Ollama
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:11434/api/tags || exit 1

# Avvia il bot + microservizi
CMD ["./start.sh"]
