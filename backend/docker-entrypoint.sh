#!/bin/sh
set -e

# 1. Aplica as migrations que ainda não rodaram neste banco.
./node_modules/.bin/prisma migrate deploy

# 2. Garante o horário de funcionamento e o primeiro admin (não mexe no que já existe).
node dist/database/seed.js

# 3. Inicia a API. O exec faz o Node receber os sinais de parada do Docker.
exec node dist/main.js
