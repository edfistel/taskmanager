import express from "express";
import { createRequire } from "node:module";
import authRouter from "./routes/authRoutes.js";
import internalRouter from "./routes/internalRoutes.js";
import { prisma } from "./config/database.js";

const app = express();
const require = createRequire(import.meta.url);
const serviceVersion = require("../package.json").version;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', function(req, res, next) {
  res.json({ app: 'Api - Auth Manager', version: `Versão: ${serviceVersion}` });
});
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connection successful in auth-service");
    return res.status(200).json({ status: "OK", service: "auth-service", version: serviceVersion, database: "connected" });
  } catch (error) {
    console.error(error);
    console.error("Database connection failed in auth-service");
    return res.status(500).json({ status: "ERROR", database: "disconnected" });
  }
});

app.use("/internal", internalRouter);
app.use("/auth", authRouter);
app.use((req, res) => res.status(404).json({ error: "Rota não encontrada" }));
app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: "Erro interno do servidor" });
});

export default app;
