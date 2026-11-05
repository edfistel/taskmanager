import { createRequire } from "node:module";
import { prisma } from "./config/database.js";

const require = createRequire(import.meta.url);
export const gatewayVersion = require("../package.json").version;

function servicePort(baseUrl, configuredPort, fallbackPort) {
  const explicitPort = Number(configuredPort);
  if (explicitPort > 0) return explicitPort;
  try {
    return Number(new URL(baseUrl).port) || fallbackPort;
  } catch {
    return fallbackPort;
  }
}

const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const userServiceUrl = process.env.USER_SERVICE_URL || "http://localhost:3002";
const taskServiceUrl = process.env.TASK_SERVICE_URL || "http://localhost:3003";
const apis = [
  {
    key: "auth-service",
    name: "Autenticação",
    baseUrl: authServiceUrl,
    port: servicePort(authServiceUrl, process.env.AUTH_SERVICE_PORT, 3001),
  },
  {
    key: "user-service",
    name: "Usuários",
    baseUrl: userServiceUrl,
    port: servicePort(userServiceUrl, process.env.USER_SERVICE_PORT, 3002),
  },
  {
    key: "task-service",
    name: "Tarefas",
    baseUrl: taskServiceUrl,
    port: servicePort(taskServiceUrl, process.env.TASK_SERVICE_PORT, 3003),
  },
];

const serviceIds = new Map();
let refreshPromise;
let monitorStarted = false;
let lastCleanupAt = 0;
const cleanupIntervalMs = 24 * 60 * 60 * 1000;

async function limparLogsAntigos() {
  if (Date.now() - lastCleanupAt < cleanupIntervalMs) return;
  const retentionDays = Math.max(1, Number(process.env.GATEWAY_LOG_RETENTION_DAYS) || 30);
  const cutoff = new Date(Date.now() - retentionDays * cleanupIntervalMs);

  await Promise.all([
    prisma.apiLog.deleteMany({ where: { criadoEm: { lt: cutoff } } }),
    prisma.apiAvailabilityEvent.deleteMany({ where: { createdAt: { lt: cutoff } } }),
  ]);
  lastCleanupAt = Date.now();
}

async function verificarApi(api) {
  let active = false;
  let httpStatus = null;
  let version = null;

  try {
    const response = await fetch(`${api.baseUrl}/health`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(3000),
    });
    httpStatus = response.status;
    active = response.ok;

    if (active) {
      try {
        const health = await response.json();
        version = typeof health.version === "string" ? health.version : null;
      } catch {
        version = null;
      }
    }
  } catch {
    active = false;
  }

  return { api, active, httpStatus, version };
}

async function atualizarRegistro({ api, active, httpStatus, version }) {
  const current = await prisma.apiService.upsert({
    where: { key: api.key },
    create: {
      key: api.key,
      name: api.name,
      baseUrl: api.baseUrl,
      port: api.port,
    },
    update: {
      name: api.name,
      baseUrl: api.baseUrl,
      port: api.port,
    },
  });

  serviceIds.set(api.key, current.id);
  const checkedAt = new Date();
  const firstCheck = current.lastCheckAt === null;
  const availabilityChanged = current.active !== active;
  const versionChanged = version !== null && current.version !== version;
  let eventType = null;

  if (firstCheck) eventType = "initial_check";
  else if (availabilityChanged) eventType = active ? "recovered" : "unavailable";
  else if (versionChanged) eventType = "version_changed";

  await prisma.apiService.update({
    where: { id: current.id },
    data: {
      active,
      version: version ?? current.version,
      httpStatus,
      lastCheckAt: checkedAt,
    },
  });

  if (eventType) {
    await prisma.apiAvailabilityEvent.create({
      data: {
        apiServiceId: current.id,
        eventType,
        active,
        version: version ?? current.version,
        httpStatus,
      },
    });
  }
}

async function atualizarEstado() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const results = await Promise.all(apis.map(verificarApi));
    await Promise.all(results.map(atualizarRegistro));
    const activeApis = results.filter((result) => result.active).length;

    await prisma.apiVersion.updateMany({
      where: { ativa: true, versao: { not: gatewayVersion } },
      data: { ativa: false },
    });
    await prisma.apiVersion.upsert({
      where: { versao: gatewayVersion },
      create: {
        versao: gatewayVersion,
        descricao: "Versão do sistema Task Manager",
        ativa: true,
      },
      update: { ativa: true },
    });

    await limparLogsAntigos();
  })();

  try {
    await refreshPromise;
  } finally {
    refreshPromise = undefined;
  }
}

export function iniciarMonitoramento() {
  if (monitorStarted) return;
  monitorStarted = true;

  const verificar = () => {
    atualizarEstado().catch((error) => {
      console.error("Falha ao atualizar o catálogo de APIs do gateway:", error.message);
    });
  };

  verificar();
  const timer = setInterval(verificar, 10_000);
  timer.unref();
}

export function registrarRequisicaoApi(key, method, endpoint, statusCode, durationMs) {
  const apiServiceId = serviceIds.get(key);
  if (!apiServiceId) return;

  prisma.apiLog
    .create({
      data: { apiServiceId, metodo: method, endpoint, statusCode, duracaoMs: durationMs },
    })
    .catch((error) => {
      console.error("Falha ao gravar log de requisição do gateway:", error.message);
    });
}

export async function obterStatusApis() {
  const [version, services] = await Promise.all([
    prisma.apiVersion.findFirst({
      where: { ativa: true },
      orderBy: { criadoEm: "desc" },
      select: { versao: true, descricao: true, criadoEm: true },
    }),
    prisma.apiService.findMany({
      where: { key: { in: apis.map((api) => api.key) } },
      orderBy: { key: "asc" },
      select: {
        key: true,
        name: true,
        baseUrl: true,
        port: true,
        active: true,
        version: true,
        httpStatus: true,
        lastCheckAt: true,
      },
    }),
  ]);

  return {
    version: version?.versao ?? gatewayVersion,
    versionDescription: version?.descricao ?? null,
    versionCreatedAt: version?.criadoEm ?? null,
    registeredApis: apis.length,
    activeApis: services.filter((service) => service.active).length,
    inactiveApis: Math.max(0, apis.length - services.filter((service) => service.active).length),
    services,
  };
}
