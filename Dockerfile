FROM ollama/ollama:latest

WORKDIR /app

COPY . .

RUN apt update && apt install -y nodejs npm
RUN npm install

CMD bash -c "ollama serve & sleep 8 && ollama pull phi3:mini && node src/ai/api.js & node src/index.js"

