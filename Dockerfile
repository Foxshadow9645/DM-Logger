FROM ollama/ollama:latest

WORKDIR /app

# Copia codice bot
COPY . .

# Installa node + dipendenze
RUN apt update && apt install -y nodejs npm
RUN npm install

# Avvio:
# - Avvia Ollama in background
# - Aspetta che si accenda
# - Scarica modello
# - Avvia AI microservice
# - Avvia bot
CMD ollama serve & \
    sleep 6 && \
    ollama pull phi3:mini && \
    node src/ai/api.js & \
    node src/index.js

