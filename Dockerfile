# =========================================================
# Stage 1: Build and Compile Espace de Travail
# =========================================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy full source tree
COPY . .

# Build React client application and bundle backend server
# This produces the frontend build in dist/ and server in dist/server.cjs
RUN npm run build

# =========================================================
# Stage 2: Production Execution Environment
# =========================================================
FROM node:20-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

# Copy packages lists
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built artifacts from the builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/public ./public
# Copy fallback datasets if needed
COPY --from=builder /usr/src/app/data_fallback ./data_fallback

# Create storage directory for local documents/backups
RUN mkdir -p uploads backups && chmod -R 775 uploads backups

EXPOSE 3000

CMD ["npm", "run", "start"]
