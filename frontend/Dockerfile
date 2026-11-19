# =========================================
# Sendería Chile - Frontend (Ionic + React + Vite)
# =========================================

# Etapa 1: compila la aplicación a archivos estáticos.
FROM node:22-alpine AS build
WORKDIR /app

# Cypress solo se usa en pruebas; no descargar su binario dentro de la imagen.
ENV CYPRESS_INSTALL_BINARY=0

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite incrusta estas variables al compilar; llegan desde docker-compose.
ARG VITE_API_URL=http://localhost:3000/api
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_API_URL=$VITE_API_URL \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

# Etapa 2: Nginx sirve los archivos compilados.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
