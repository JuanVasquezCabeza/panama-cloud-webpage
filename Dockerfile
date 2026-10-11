# ==========================================
# Stage 1: Verification & Asset Optimization
# ==========================================
FROM alpine:3.18 AS asset-validator

WORKDIR /app

# Copy the static website source
COPY index.html .
COPY products-and-solutions/index.html ./products-and-solutions/index.html

# Perform basic syntax/HTML integrity validation
RUN echo "Validating HTML structure..." && \
    grep -q "<html" index.html && \
    grep -q "</html>" index.html && \
    grep -q "<html" products-and-solutions/index.html && \
    grep -q "</html>" products-and-solutions/index.html && \
    echo "Validation successful!"

# ==========================================
# Stage 2: Ultra-Lightweight Production Nginx
# ==========================================
FROM nginx:alpine3.18-slim

# Copy tuned Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy verified static assets from Stage 1
COPY --from=asset-validator /app/index.html /usr/share/nginx/html/index.html
COPY --from=asset-validator /app/products-and-solutions/index.html /usr/share/nginx/html/products-and-solutions/index.html

# Expose HTTP port
EXPOSE 80

# Run nginx in foreground (daemon off)
CMD ["nginx", "-g", "daemon off;"]
