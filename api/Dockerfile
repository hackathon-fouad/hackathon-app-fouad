# Image de l'API. Construite depuis la racine du dépôt : les workspaces npm
# partagent un seul package-lock.json.

# Étape 1 : compiler le TypeScript
FROM node:24-trixie-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
# --ignore-scripts : pas de hook husky dans une image
RUN npm ci --ignore-scripts
COPY api/ api/
RUN npm run build -w api

# Étape 2 : l'image finale, avec les seules dépendances de production
FROM node:24-trixie-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
RUN npm ci --omit=dev --ignore-scripts -w api
COPY --from=build /app/api/dist api/dist
USER node
EXPOSE 3000
CMD ["node", "api/dist/index.js"]
