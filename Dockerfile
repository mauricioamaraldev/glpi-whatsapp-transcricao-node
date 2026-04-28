FROM node:20-slim

WORKDIR /app

COPY package*.json ./

<<<<<<< HEAD
RUN npm install --production

COPY . .

CMD ["node", "index.js"]
=======
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production

CMD ["npm", "start"]
>>>>>>> bf31b8483c580d8b3a1daf486f6edc3c1dfe8086
