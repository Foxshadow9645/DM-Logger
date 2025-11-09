# Usa immagine base Node
FROM node:18

WORKDIR /app
COPY . .

# Installa dipendenze
RUN npm install

# Installa Ollama e avvia server
RUN curl -fsSL https://ollama.com/install.sh | sh

# Serve non parte da solo, quindi usiamo uno script
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
