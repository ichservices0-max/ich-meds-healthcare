# syntax=docker/dockerfile:1
FROM node:22-slim AS builder
WORKDIR /app/backend

RUN apt-get update -y && apt-get install -y openssl

COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci
COPY backend/ ./
RUN npm run build

FROM node:22-slim
WORKDIR /app/backend

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/backend ./
EXPOSE 5000
CMD ["npm", "start"]
