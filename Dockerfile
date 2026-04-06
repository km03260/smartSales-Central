FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY prisma ./prisma/
RUN npx prisma generate

COPY src ./src/
COPY keys ./keys/

EXPOSE 3500

CMD ["node", "src/server.js"]
