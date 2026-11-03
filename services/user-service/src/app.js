import express from "express";
import { createRequire } from "node:module";
import { usersRouter } from "./routes/users/userRoutes.js";
import internalRouter from "./routes/internalRoutes.js";
import { prisma } from "./config/database.js";

const app = express();
const require = createRequire(import.meta.url);
const serviceVersion = require("../package.json").version;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', function(req, res, next) {
  res.json({ app: 'Api - User Manager', version: `Versão: ${serviceVersion}` });
});
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({ status: "OK", service: "user-service", version: serviceVersion, database: "connected" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "ERROR", database: "disconnected" });
  }
});

app.use("/internal", internalRouter);
app.use("/users", usersRouter);
app.use((req, res) => res.status(404).json({ error: "Rota não encontrada" }));
app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: "Erro interno do servidor" });
});

export default app;
