FROM node:20-alpine

WORKDIR /usr/src/
COPY package.json ./
COPY .env ./.env
RUN npm install 

COPY . .

EXPOSE 3000
RUN npm run build --production

RUN npm install -g serve

CMD serve -s build