# ── Stage 1: Build tee-node (Go server) ──
FROM golang:1.23-alpine AS node-builder
RUN apk add --no-cache git
RUN git clone https://github.com/flare-foundation/tee-node.git /build
WORKDIR /build
RUN go build -o server ./cmd/server

# ── Stage 2: Build extension (TypeScript) ──
FROM node:20-alpine AS ext-builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts 2>/dev/null || npm install --ignore-scripts
COPY . .
RUN npm run build

# ── Stage 3: Runtime ──
FROM node:20-alpine
RUN apk add --no-cache gosu
WORKDIR /app

# Copy tee-node binary
COPY --from=node-builder /build/server ./server
RUN chmod +x ./server

# Copy extension
COPY --from=ext-builder /app/dist ./extension/dist
COPY --from=ext-builder /app/node_modules ./extension/node_modules
COPY --from=ext-builder /app/package.json ./extension/package.json

# Create extension user
RUN adduser -D -h /app extension

ENV MODE=1
ENV CONFIG_PORT=5500
ENV SIGN_PORT=8882
ENV EXTENSION_PORT=8883

EXPOSE 8883

CMD ["sh", "-c", "./server & gosu extension node extension/dist/main.js"]
