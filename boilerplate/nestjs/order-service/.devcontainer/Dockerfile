FROM node:20-alpine

WORKDIR /workspace

RUN apk add --no-cache git

RUN npm install -g @nestjs/cli typescript ts-node

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
