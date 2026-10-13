# syntax=docker/dockerfile:1

# Stage 1: build Angular
FROM node:22.22.3-alpine AS build

WORKDIR /app

# copiar package.json, lockfile e .npmrc (registro privado @code2youlabs)
COPY package*.json .npmrc ./

# instalar dependências (usando lockfile) com o token do GitHub Packages
# fornecido somente no build (BuildKit secret), sem entrar na imagem
RUN --mount=type=secret,id=node_auth_token,env=NODE_AUTH_TOKEN \
    npm ci --legacy-peer-deps

# copiar o resto do código
COPY . .

# build de produção
RUN npm run build:prod

# Stage 2: Nginx servindo o build
FROM nginx:alpine

# remove qualquer arquivo padrão do nginx
RUN rm -rf /usr/share/nginx/html/*

# copie o build Angular para a raiz publica do admin
COPY --from=build /app/dist/clickmanager-admin/browser /usr/share/nginx/html

# Copia config SPA customizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
