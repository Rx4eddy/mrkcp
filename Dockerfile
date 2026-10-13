# ==========================================
# Stage 1: Builder
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy project files
COPY . .

# Generate Prisma Client and build both frontend and server
RUN npx prisma generate
RUN npm run build

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_URL="file:./prisma/dev.db"

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production

# Generate Prisma Client in runner
RUN npx prisma generate

# Copy compiled artifacts and curated dataset from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data
COPY --from=builder /app/prisma/seed.ts ./prisma/seed.ts

# Ensure data directory and database directory exist
RUN mkdir -p /app/prisma

EXPOSE 5000

# Push DB schema, seed curated problem bank, and start server
CMD ["sh", "-c", "npx prisma db push && npx tsx prisma/seed.ts && node dist/server/index.js"]
