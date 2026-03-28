FROM node:23-alpine

RUN apk add --no-cache libc6-compat build-base python3

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]