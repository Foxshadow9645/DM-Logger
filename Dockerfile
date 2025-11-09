FROM node:18

WORKDIR /app
COPY . .

# Installa le dipendenze Node
RUN npm install

# Installa Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Copia lo script di avvio
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Comando di avvio
CMD ["/start.sh"]
