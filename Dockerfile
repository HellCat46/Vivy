FROM node:22-alpine

RUN mkdir -p /home/node/vivy && chown -R node:node /home/node/vivy

WORKDIR /home/node/vivy

COPY package.json yarn.lock ./

USER node

RUN yarn install

COPY --chown=node:node . .


CMD [ "yarn", "start"]