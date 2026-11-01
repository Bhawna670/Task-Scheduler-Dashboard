# Stage 1: build the React client
FROM node:22-alpine AS client
WORKDIR /client
COPY client/package*.json ./
RUN npm install
COPY client ./
RUN npm run build

# Stage 2: API + built client, one container
FROM node:22-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server ./
COPY --from=client /client/dist ./public
ENV NODE_ENV=production PORT=3001 DB_FILE=/data/scheduler.db
EXPOSE 3001
CMD ["node", "--disable-warning=ExperimentalWarning", "server.js"]
