# Base image con Ollama già installato
FROM ollama/ollama:latest

# Imposta directory di lavoro
WORKDIR /app

# Copia tutto il progetto dentro l'immagine
COPY . .

# Installa node e npm
RUN apt update && apt install -y nodejs npm

# Installa le dipendenze del bot
RUN npm install

# Scarica automaticamente il modello AI (zero browser)
RUN ollama pull phi3:mini

# Avvia sia Ollama che il bot
CMD ollama serve & sleep 3 && node src/index.js
