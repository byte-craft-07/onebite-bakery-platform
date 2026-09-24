# ── Step 1: Base & Build ──
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY tsconfig*.json ./
COPY src/ ./src/
RUN npm run build

# ── Step 2: Production Runner ──
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled files and public assets
COPY --from=builder /app/dist ./dist
COPY public/ ./public/

# Create uploads folder with write permissions
RUN mkdir -p public/uploads && chown -R node:node /app

USER node

EXPOSE 5000

CMD ["node", "dist/server.js"]
