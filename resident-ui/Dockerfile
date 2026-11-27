FROM node:26-alpine

RUN apk add --no-cache postgresql-client python3 py3-yaml git

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY package*.json ./
COPY scripts ./scripts

RUN npm ci --no-audit --no-fund

COPY . .

# Servir Monaco Editor 100% en local desde /vs (sin peticiones a CDNs externos)
RUN mkdir -p /app/public && ln -sfn /app/node_modules/monaco-editor/min/vs /app/public/vs

# Usuario no-root (hallazgo de seguridad, guía de remediación imarthe75 2026-07-29).
# uid 1000 por si se agrega un bind mount de desarrollo más adelante.
RUN chown -R node:node /app
USER node

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "dev"]
