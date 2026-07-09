#!/bin/sh
set -e

export PORT="${PORT:-8080}"
echo "[tech-form] Listening on PORT=$PORT"

echo "[tech-form] prisma migrate deploy..."
npx prisma migrate deploy

echo "[tech-form] seeding if empty..."
npm run db:seed

echo "[tech-form] starting Next.js..."
exec npm run start
