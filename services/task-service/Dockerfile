FROM node:24-bookworm-slim
WORKDIR /app
COPY services/task-service/package*.json ./
RUN npm ci
COPY services/task-service/prisma ./prisma
COPY services/task-service/prisma.config.ts ./prisma.config.ts
RUN DATABASE_URL=postgresql://taskmanager:taskmanager_dev@postgres:5432/taskmanager?schema=tasks npm run generate
COPY services/task-service/src ./src
EXPOSE 3003
CMD ["npm", "start"]
