# Stage 1: Build the application
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Copy environment variables
COPY .env .

# Build the application
RUN yarn build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine

# Copy the build output to a temporary directory in the image
COPY --from=build /app/dist /app/static

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (standard internal port)
EXPOSE 80

# The startup process:
# 1. Copy files from image to the mounted volume (public_html)
# 2. Set ownership of those files to the host user's UID/GID
# 3. Start Nginx as root (it will automatically drop privileges to the 'nginx' user for workers)
CMD ["sh", "-c", "cp -r /app/static/. /usr/share/nginx/html/ && nginx -g 'daemon off;'"]
