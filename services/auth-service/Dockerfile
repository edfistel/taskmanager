FROM node:24-bookworm-slim
WORKDIR /app
COPY services/auth-service/package*.json ./
RUN npm ci
COPY services/auth-service/prisma ./prisma
COPY services/auth-service/prisma.config.ts ./prisma.config.ts
RUN DATABASE_URL=postgresql://taskmanager:taskmanager_dev@postgres:5432/taskmanager?schema=auth npm run generate
COPY services/auth-service/src ./src
EXPOSE 3001
CMD ["npm", "start"]
