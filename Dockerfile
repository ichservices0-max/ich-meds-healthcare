# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci
COPY backend/ ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app/backend
COPY --from=builder /app/backend ./
EXPOSE 5000
CMD ["npm", "start"]
