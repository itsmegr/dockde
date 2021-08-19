FROM node:14-alpine
WORKDIR /app
COPY package.json .

ARG NODE_ENV
RUN if [ "$NODE_ENV"= "development" ]; \
        then npm install; \
        else npm install --production=false; \
        fi
RUN npm install
COPY . .
EXPOSE $PORT
