FROM node:16-alpine

WORKDIR /app
COPY package-lock.json package.json knexfile.js .
RUN NODE_ENVIRONMENT=production npm i
COPY . .

CMD ["node", "src/index"]
