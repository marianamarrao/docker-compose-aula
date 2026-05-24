FROM node:18-alpine

WORKDIR /app

# Copia só o package.json primeiro (melhor uso de cache do Docker)
COPY package.json .
RUN npm install

# Copia o resto do código
COPY . .

EXPOSE 8080

CMD ["node", "index.js"]
