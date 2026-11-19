# =========================================
# Sendería Chile - API (Express + TypeScript)
# =========================================

# Etapa 1: compila TypeScript a JavaScript.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Etapa 2: imagen final, solo con lo necesario para ejecutar.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=development \
    HOST=0.0.0.0 \
    PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY docker-start.mjs ./docker-start.mjs

# Carpeta de imágenes sugeridas (se monta como volumen en docker-compose).
RUN mkdir -p uploads/sugerencias-imagenes && chown -R node:node /app/uploads

# No ejecutar como root.
USER node

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "docker-start.mjs"]
