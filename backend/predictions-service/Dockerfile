FROM node:18-slim AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
COPY tsconfig.json ./
COPY src ./src/
RUN npm run build
RUN npx prisma generate

FROM node:18-slim
RUN apt-get update -y && apt-get install -y openssl --no-install-recommends && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
EXPOSE 3003
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/app.js"]
