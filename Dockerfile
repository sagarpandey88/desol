# Multi-stage Dockerfile to build frontend and backend and produce a single runtime image

FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --legacy-peer-deps || npm install
COPY frontend/ .
RUN npm run build

FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --legacy-peer-deps || npm install
COPY backend/ .
RUN npm run build

# Copy frontend build into backend dist/public
RUN mkdir -p dist/public
COPY --from=frontend-build /app/frontend/dist ./dist/public

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production deps for backend
COPY backend/package.json ./backend-package.json
RUN mv backend-package.json package.json && npm ci --only=production --legacy-peer-deps || npm install --production

# Copy built backend dist and node_modules
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/node_modules ./node_modules

EXPOSE 4000
ENV PORT=4000
CMD ["node", "dist/index.js"]
