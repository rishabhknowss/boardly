FROM Node:23.8.0-alpine3.20

RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY package*.json ./package*.json
COPY ./packages ./packages
COPY ./turbo.json ./turbo.json

RUN pnpm install --omit=dev

COPY ./apps/ws-backend ./apps/ws-backend

RUN pnpm run build

EXPOSE 8080

CMD ["pnpm", "run", "start"]

