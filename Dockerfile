FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY prisma ./prisma/
RUN npx prisma generate

COPY src ./src/
COPY keys ./keys/
COPY start.sh ./
RUN mkdir -p /app/uploads/logos /app/uploads/apps /app/uploads/services

EXPOSE 3500

CMD ["sh", "start.sh"]
