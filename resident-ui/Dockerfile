FROM node:26-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Usuario no-root (hallazgo de seguridad, guía de remediación imarthe75 2026-07-29).
# uid 1000 por si se agrega un bind mount de desarrollo más adelante.
RUN chown -R node:node /app
USER node

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "dev"]
