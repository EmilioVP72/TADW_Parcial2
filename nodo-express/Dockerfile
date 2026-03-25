FROM node:23-alpine

WORKDIR /usr/src/app

RUN npm init -y
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]