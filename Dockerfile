FROM ollama/ollama:latest

WORKDIR /app

COPY . .

RUN apt update && apt install -y nodejs npm

RUN npm install

EXPOSE 4000

CMD ["bash", "start.sh"]
