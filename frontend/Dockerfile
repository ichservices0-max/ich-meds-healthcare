FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the frontend source
COPY . ./

# Build the Next.js app
RUN npm run build

# Production image
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

EXPOSE $PORT
CMD ["npx", "next", "start"]
