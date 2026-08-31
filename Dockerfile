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

ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_URL="postgresql://healthcare_app:HealthCare2026SecurePass123@db.umzmsvsardudkjpvdogx.supabase.co:5432/postgres"
ENV JWT_SECRET="hc-jwt-secret-2026-antigravity-secure-key-xK9mP2"
ENV JWT_REFRESH_SECRET="hc-refresh-secret-2026-antigravity-key-Lw7nQ4"
ENV FRONTEND_URL="https://www.ichmeds.in,https://frontend-kappa-liard-40.vercel.app,http://localhost:3000"

COPY --from=builder /app/backend ./
EXPOSE 5000
CMD ["npm", "start"]
