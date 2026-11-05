FROM node:24-bookworm-slim
WORKDIR /app
COPY services/user-service/package*.json ./
RUN npm ci
COPY services/user-service/prisma ./prisma
COPY services/user-service/prisma.config.ts ./prisma.config.ts
RUN DATABASE_URL=postgresql://taskmanager:taskmanager_dev@postgres:5432/taskmanager?schema=users npm run generate
COPY services/user-service/src ./src
EXPOSE 3002
CMD ["npm", "start"]
