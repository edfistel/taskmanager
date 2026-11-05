import { Router } from "express";
import { autenticarServicoInterno } from "../middlewares/internalServiceMiddleware.js";
import * as userRepository from "./users/userRepository.js";

const router = Router();
router.use(autenticarServicoInterno);

router.post("/users", async (req, res) => {
  const { id, nome, email } = req.body || {};
  if (!Number.isInteger(id) || id < 1 || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ erro: "Dados de usuário inválidos" });
  }
  const usuario = await userRepository.provisionarUsuario({ id, nome, email: email.trim().toLowerCase() });
  return res.status(201).json(usuario);
});

router.delete("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ erro: "ID de usuário inválido" });
  await userRepository.removerUsuarioInterno(id);
  return res.status(204).end();
});

export default router;
