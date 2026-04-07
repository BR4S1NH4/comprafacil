FROM node:22-alpine

WORKDIR /api

COPY api/package.json api/package-lock.json* ./
RUN npm install

COPY api/ .
COPY shared /shared

EXPOSE 3001

CMD ["npm", "start"]
