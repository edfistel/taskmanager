import "dotenv/config";
import { PrismaClient } from '../../prisma/generated/client/client.ts'
import { PrismaPg } from '@prisma/adapter-pg'

const conexao = {
  database: process.env.DB_DATABASE,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

const adapter = new PrismaPg(conexao);

export const prisma = new PrismaClient({
  adapter,
});