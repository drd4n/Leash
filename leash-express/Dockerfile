FROM node:14.17.5-alpine

WORKDIR /node

COPY package*.json ./

RUN yarn

COPY . .

EXPOSE 3001
CMD [ "node", "index.js" ]