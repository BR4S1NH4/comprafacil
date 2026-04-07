# Build com contexto na pasta api (compatível com Render: Root Directory = api).
FROM node:22-alpine

WORKDIR /api

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
