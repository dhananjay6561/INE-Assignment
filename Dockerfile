# Multi-stage Dockerfile to build frontend (Vite) and backend (Node/Express)

# --- Build frontend ---
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --silent || npm install --silent
COPY frontend/ .
RUN npm run build

# --- Build backend ---
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
# Install backend deps
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --production --silent || npm install --production --silent
COPY backend/ .

# Copy frontend build into backend public folder
RUN mkdir -p public
COPY --from=frontend-build /app/frontend/dist ./public

# Expose port
EXPOSE 5000

# Start the backend server
ENV NODE_ENV=production
CMD ["node", "src/app.js"]
