import jwt from "jsonwebtoken";
import { buscarUsuarioPorId } from "../clients/userServiceClient.js";

export async function autenticar(req, res, next) {
  const autorizacao = req.headers.authorization;

  if (!autorizacao) {
    return res.status(401).json({ erro: "Token não informado" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ erro: "JWT_SECRET não configurado" });
  }

  const partes = autorizacao.trim().split(/\s+/);

  if (partes.length !== 2 || partes[0].toLowerCase() !== "bearer") {
    return res.status(401).json({ erro: "Formato do token inválido" });
  }

  let payload;

  try {
    payload = jwt.verify(partes[1], process.env.JWT_SECRET, {
      algorithms: ["HS256"]
    });
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }

  if (!payload || typeof payload !== "object" || !Number.isInteger(payload.id)) {
    return res.status(401).json({ erro: "Token inválido" });
  }

    try {
      const usuario = await buscarUsuarioPorId(payload.id);
      if (!usuario) return res.status(401).json({ erro: "Usuário não encontrado" });
    } catch (error) {
      console.error(error);
      return res.status(error.status || 503).json({ erro: "Serviço de usuários indisponível" });
    }

    req.user = { id: payload.id, email: payload.email };
  return next();
}
