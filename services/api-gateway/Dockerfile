FROM node:24-bookworm-slim
WORKDIR /app
COPY services/api-gateway/package*.json ./
RUN npm ci
COPY services/api-gateway/prisma ./prisma
COPY services/api-gateway/prisma.config.ts ./prisma.config.ts
RUN DATABASE_URL=postgresql://taskmanager:taskmanager_dev@postgres:5432/taskmanager?schema=public npm run generate
COPY services/api-gateway/src ./src
EXPOSE 3000
CMD ["npm", "start"]
