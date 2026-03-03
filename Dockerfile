# syntax=docker/dockerfile:1

# Admin Dashboard Dockerfile
# 3-stage build: deps → build (Vite SPA) → nginx serve

# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Stage 2: Build
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Vite bakes env vars at build time
ARG VITE_API_BASE_URL=/api/v1

RUN npm run build

# Stage 3: Serve
FROM nginx:1.27-alpine AS runtime

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Run as non-root
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
