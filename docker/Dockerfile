# Образ приложения «Генератор КП по SEO».
# Multi-stage: зависимости → next build (standalone) → тонкий runtime.
# Контекст сборки — корень репозитория: docker build -f docker/Dockerfile .
# БД на сборке не нужна: страницы клиентские, API-роуты force-dynamic.

# --- Зависимости ---
FROM node:22-alpine AS deps
# libc6-compat нужен swc/sharp на musl (стандартная рекомендация Next для Alpine)
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Сборка ---
FROM node:22-alpine AS build
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Runtime ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# standalone содержит server.js и урезанный node_modules (включая
# @react-pdf/renderer и exceljs — output file tracing забирает externals).
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
# public нужен целиком: шрифты PDF (public/fonts) читаются с диска.
COPY --from=build --chown=node:node /app/public ./public

USER node
EXPOSE 3000
CMD ["node", "server.js"]
