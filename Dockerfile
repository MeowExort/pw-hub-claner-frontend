# Multi-stage build for Vite React app

# 1) Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Build-time configuration for Vite (can be overridden with --build-arg)
ARG VITE_API_URL=https://api.claner.pw-hub.ru/api
ARG VITE_WS_URL=wss://api.claner.pw-hub.ru/events
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}

# Install dependencies (use ci when lockfile exists)
COPY package*.json ./
RUN npm ci || npm install

# Copy sources and build
COPY . .
# Ensure production mode build (Vite defaults to production for build)
RUN npm run build

# 2) Production stage using Nginx to serve static files
FROM nginx:1.27-alpine AS runner

# Install curl for container healthcheck
RUN apk add --no-cache curl

# Copy build output
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -fsS http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
