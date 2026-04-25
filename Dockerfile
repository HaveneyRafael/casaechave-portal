# ============================
# Stage 1: Build do Tailwind CSS
# ============================
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production=false
COPY tailwind.config.js ./
COPY src/ ./src/
COPY *.html *.js ./
RUN npx tailwindcss -i ./src/input.css -o ./dist/output.css --minify

# ============================
# Stage 2: Nginx para servir
# ============================
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/ /usr/share/nginx/html/dist/
COPY . /usr/share/nginx/html/
# Remove arquivos de build do diretório público
RUN rm -rf /usr/share/nginx/html/node_modules \
           /usr/share/nginx/html/src \
           /usr/share/nginx/html/package*.json \
           /usr/share/nginx/html/tailwind.config.js \
           /usr/share/nginx/html/.git
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
