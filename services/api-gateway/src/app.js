import express from "express";
import { autenticar } from "./middlewares/authMiddleware.js";
import { gatewayVersion, obterStatusApis, registrarRequisicaoApi } from "./observability.js";
import { prisma } from "./config/database.js";

const app = express();
const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const userServiceUrl = process.env.USER_SERVICE_URL || "http://localhost:3002";
const taskServiceUrl = process.env.TASK_SERVICE_URL || "http://localhost:3003";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => res.json({ app: "Task Manager API Gateway", version: gatewayVersion }));
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({ status: "OK", service: "api-gateway", version: gatewayVersion });
  } catch {
    return res.status(503).json({ status: "ERROR", service: "api-gateway", database: "disconnected" });
  }
});

app.get("/internal/status", async (req, res) => {
  const token = process.env.INTERNAL_SERVICE_TOKEN;
  if (!token || req.get("x-internal-service-token") !== token) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    return res.json(await obterStatusApis());
  } catch (error) {
    console.error("Falha ao consultar status das APIs:", error.message);
    return res.status(503).json({ error: "Status indisponível" });
  }
});

app.use("/auth", encaminharPara("auth-service", authServiceUrl));
app.use("/users/register", encaminharPara("auth-service", authServiceUrl));
app.use("/users/alterarSenha", autenticar, encaminharPara("auth-service", authServiceUrl));
app.use("/users", autenticar, encaminharPara("user-service", userServiceUrl));

for (const caminho of [
  "/quadros",
  "/listas",
  "/tarefas",
  "/subtarefas",
  "/comentarios",
  "/atribuicoes",
]) {
  app.use(caminho, autenticar, encaminharPara("task-service", taskServiceUrl));
}

app.use((req, res) => res.status(404).json({ error: "Rota não encontrada" }));

function encaminharPara(serviceKey, baseUrl) {
  return async (req, res) => {
    const startedAt = Date.now();
    const endpoint = normalizarEndpoint(req);
    try {
      const headers = { accept: req.headers.accept || "application/json" };
      if (req.headers.authorization) headers.authorization = req.headers.authorization;
      const options = { method: req.method, headers };
      if (!['GET', 'HEAD'].includes(req.method) && req.body !== undefined) {
        headers["content-type"] = "application/json";
        options.body = JSON.stringify(req.body);
      } else if (req.headers["content-type"]) {
        headers["content-type"] = req.headers["content-type"];
      }

      const upstream = await fetch(`${baseUrl}${req.originalUrl}`, options);
      const body = Buffer.from(await upstream.arrayBuffer());
      registrarRequisicaoApi(serviceKey, req.method, endpoint, upstream.status, Date.now() - startedAt);
      const contentType = upstream.headers.get("content-type");
      if (contentType) res.setHeader("content-type", contentType);
      res.status(upstream.status);
      return res.send(body);
    } catch (error) {
      registrarRequisicaoApi(serviceKey, req.method, endpoint, 502, Date.now() - startedAt);
      console.error(`Falha ao encaminhar para ${baseUrl}`, error);
      return res.status(502).json({ error: "Serviço indisponível" });
    }
  };
}

function normalizarEndpoint(req) {
  const endpoint = `${req.baseUrl}${req.path}` || req.path;
  return endpoint
    .split("/")
    .map((segment) => {
      if (!segment) return segment;
      if (/^\d+$/.test(segment) || /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(segment)) return ":id";
      if (segment.includes("@") || segment.length > 80) return ":param";
      return segment;
    })
    .join("/");
}

export default app;
