# Image du front. Construite depuis la racine du dépôt, comme celle de l'API.

# Étape 1 : construire le front avec Vite
FROM node:24-trixie-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
RUN npm ci --ignore-scripts
COPY web/ web/
RUN npm run build -w web

# Étape 2 : nginx sert les fichiers construits et relaie /api vers l'API
FROM nginx:1.30-alpine
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist /usr/share/nginx/html
EXPOSE 80
