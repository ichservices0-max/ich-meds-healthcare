#!/usr/bin/env bash
# Railpack start script – builds and runs the backend service

set -e

cd backend

echo "Installing backend dependencies..."
npm install

echo "Generating Prisma client..."
npx prisma generate || echo "Prisma generate skipped (maybe not needed)"

echo "Building backend..."
npm run build

# Start the server (Railway will set PORT env var)
echo "Starting server..."
npm start
