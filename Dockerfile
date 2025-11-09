# Base: Ollama per LLM + Node support
FROM ollama/ollama:latest

# Cartella di lavoro
WORKDIR /app

# Copia del progetto
COPY . .

# Installa Node.js + npm (per il bot + AI microservice)
RUN apt update && apt install -y nodejs npm

# Installa le dipendenze Node
RUN npm install

# Assicurati che il modello Ollama sia già disponibile
RUN ollama pull phi3:mini

# Porta per il microservizio AI
EXPOSE 4000

# Avvia entrambi (Ollama già incluso nel container base)
CMD ["bash", "start.sh"]
