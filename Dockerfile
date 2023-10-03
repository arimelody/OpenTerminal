FROM --platform=linux/amd64 node:20-alpine3.18

# set working directory
WORKDIR /srv/openterminal

# install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 8080

CMD [ "node", "./server/main.js" ]

