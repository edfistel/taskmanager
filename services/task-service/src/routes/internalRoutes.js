import express from "express";
import { prisma } from "../config/database.js";
import { autenticarServicoInterno } from "../middlewares/internalServiceMiddleware.js";

const router = express.Router();
router.use(autenticarServicoInterno);

router.post("/users", async (req, res) => {
  const { id, nome, email } = req.body || {};
  if (!Number.isInteger(id) || id < 1 || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ erro: "Dados de usuário inválidos" });
  }

  const usuario = await prisma.usuario.upsert({
    where: { id },
    create: { id, nome, email: email.trim().toLowerCase() },
    update: { nome, email: email.trim().toLowerCase() },
    select: { id: true, nome: true, email: true },
  });
  return res.status(201).json(usuario);
});

router.delete("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ erro: "ID de usuário inválido" });
  await prisma.usuario.deleteMany({ where: { id } });
  return res.status(204).end();
});

export default router;
