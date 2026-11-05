import express from 'express';
import { versao } from '../tools/versao.js';
import { prisma } from "../config/database.js";

const routesRouter = express.Router();

routesRouter.get('/', function(req, res, next) {
  res.json({ app: 'Api - Task Manager', version: `Versão: ${versao}` });
});

routesRouter.get("/health", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        console.log("Database connection successful");
        res.status(200).json({
            status: "OK",
            database: "connected"
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: "ERROR",
            database: "disconnected"
        });
    }
});

export default routesRouter;
