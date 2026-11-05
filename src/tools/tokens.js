import jwt from "jsonwebtoken";
import crypto from "crypto";

export function gerarAccessToken(usuario) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET não configurado");
  }

  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
      algorithm: "HS256"
    }
  );
}

export function gerarRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}
