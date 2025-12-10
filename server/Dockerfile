# -----------------------------
# 1. Build environment
# -----------------------------
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# -----------------------------
# 2. Production image
# -----------------------------
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app ./
RUN npm ci --omit=dev

EXPOSE 3001
CMD ["node", "server.js"]
