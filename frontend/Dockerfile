FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

ARG VITE_API_URL=/api/v1
ARG VITE_APP_ENV=production
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APP_ENV=${VITE_APP_ENV}
ENV VITE_USE_MOCKS=false

RUN npm run build

FROM nginx:alpine AS runtime

ENV BACKEND_PROXY_TARGET=http://backend:8000
ENV NGINX_ENVSUBST_FILTER=^BACKEND_PROXY_TARGET$

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
