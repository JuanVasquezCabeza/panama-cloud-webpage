# ==========================================
# Stage 1: Verification & Asset Optimization
# ==========================================
FROM alpine:3.18 AS asset-validator

WORKDIR /app

# Copy the static website source (home + generated pages)
COPY index.html .
COPY products-and-solutions ./products-and-solutions
COPY blog ./blog

# Perform basic syntax/HTML integrity validation on every page
RUN echo "Validating HTML structure..." && \
    for f in $(find . -name index.html); do \
      grep -q "<html" "$f" && grep -q "</html>" "$f" || { echo "Invalid HTML: $f"; exit 1; }; \
    done && \
    echo "Validation successful!"

# ==========================================
# Stage 2: Ultra-Lightweight Production Nginx
# ==========================================
FROM nginx:alpine3.18-slim

# Copy tuned Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy verified static assets from Stage 1
COPY --from=asset-validator /app /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Run nginx in foreground (daemon off)
CMD ["nginx", "-g", "daemon off;"]
