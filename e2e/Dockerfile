FROM node:11.10.1-alpine

RUN apk add --no-cache tzdata libgcc libstdc++ musl && cp /usr/share/zoneinfo/Asia/Tokyo /etc/localtime

WORKDIR /var/app/node
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
EXPOSE 3000

RUN yarn build
ENTRYPOINT ["yarn", "start"]