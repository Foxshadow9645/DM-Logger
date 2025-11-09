# ─────────────────────────────────────────────
# 🧠 DM REALM ALPHA — Dockerfile (Railway + Ollama)
# Versione stabile 2025.11
# ─────────────────────────────────────────────
FROM ubuntu:22.04

# Imposta directory
WORKDIR /app

# Installa dipendenze di base
RUN apt update && apt install -y curl git bash build-essential

# Installa Node.js 22 e npm
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt install -y nodejs

# Installa Ollama
RUN curl -fsSL https://ollama.ai/install.sh | bash

# Copia progetto nel container
COPY . .

# Installa dipendenze Node.js
RUN npm install

# Crea script di avvio
RUN echo '#!/bin/bash\n\
set -e\n\
echo \"🚀 Avvio Ollama...\"\n\
ollama serve &\n\
sleep 8\n\
echo \"⬇️ Download modello phi3:mini (se non presente)...\"\n\
ollama pull phi3:mini || true\n\
echo \"🤖 Avvio microservizio AI...\"\n\
node src/ai/api.js &\n\
echo \"⚙️ Avvio bot principale...\"\n\
node src/index.js\n' > /app/start.sh && chmod +x /app/start.sh

# Espone la porta del microservizio AI
EXPOSE 4000

# Comando finale
CMD ["/bin/bash", "/app/start.sh"]
