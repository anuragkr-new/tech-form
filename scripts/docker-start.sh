#!/bin/sh
set -e

export PORT="${PORT:-8080}"
echo "[tech-form] Listening on PORT=$PORT"

wait_for_db() {
  echo "[tech-form] waiting for database..."
  attempts=0
  max_attempts=30

  while [ "$attempts" -lt "$max_attempts" ]; do
    if npx prisma migrate deploy; then
      return 0
    fi

    attempts=$((attempts + 1))
    echo "[tech-form] database not ready, retrying in 5s (${attempts}/${max_attempts})..."
    sleep 5
  done

  echo "[tech-form] database connection failed after ${max_attempts} attempts"
  return 1
}

wait_for_db

echo "[tech-form] seeding if empty..."
npm run db:seed

echo "[tech-form] starting Next.js..."
exec npm run start
