import argon2 from "argon2";
import { prisma } from "../config/database.js";
import { buscarUsuarioPorEmail } from "../routes/users/userService.js";
import {
  gerarAccessToken,
  gerarRefreshToken
} from "../tools/tokens.js";

const DURACAO_REFRESH_TOKEN_MS = 7 * 24 * 60 * 60 * 1000;

function erroComStatus(mensagem, status) {
  return Object.assign(new Error(mensagem), { status });
}

export async function login(email, senha) {
  if (
    typeof email !== "string" || !email.trim() ||
    typeof senha !== "string" || !senha.trim()
  ) {
    throw erroComStatus("O usuário e a senha precisam ser preenchidos", 400);
  }

  let usuario;

  try {
    usuario = await buscarUsuarioPorEmail(email);
  } catch (erro) {
    if (["O email precisa ser preenchido", "Digite um email válido"].includes(erro.message)) {
      throw erroComStatus("Digite um e-mail válido", 400);
    }

    throw erro;
  }

  const senhaCorreta = usuario && await argon2.verify(usuario.senha, senha);
  if (!senhaCorreta) {
    throw erroComStatus("Credenciais inválidas", 401);
  }

  const usuarioAutenticado = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email
  };
  const accessToken = gerarAccessToken(usuarioAutenticado);
  const refreshToken = gerarRefreshToken();

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      expiraEm: new Date(Date.now() + DURACAO_REFRESH_TOKEN_MS),
      usuarioId: usuario.id
    }
  });

  return { usuario: usuarioAutenticado, accessToken, refreshToken };
}

export async function atualizarToken(refreshToken) {
  const registro = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { usuario: true }
  });

  if (!registro) {
    throw erroComStatus("Refresh token inválido", 401);
  }

  if (registro.revogado) {
    throw erroComStatus("Refresh token revogado", 401);
  }

  if (registro.expiraEm <= new Date()) {
    await prisma.refreshToken.update({
      where: { id: registro.id },
      data: { revogado: true }
    });

    throw erroComStatus("Refresh token expirado", 401);
  }

  const novoRefreshToken = gerarRefreshToken();
  const accessToken = gerarAccessToken(registro.usuario);

  await prisma.$transaction(async (transacao) => {
    const revogacao = await transacao.refreshToken.updateMany({
      where: {
        id: registro.id,
        revogado: false,
        expiraEm: { gt: new Date() }
      },
      data: { revogado: true }
    });

    if (revogacao.count !== 1) {
      throw erroComStatus("Refresh token inválido", 401);
    }

    await transacao.refreshToken.create({
      data: {
        token: novoRefreshToken,
        expiraEm: new Date(Date.now() + DURACAO_REFRESH_TOKEN_MS),
        usuarioId: registro.usuarioId
      }
    });
  });

  return { accessToken, refreshToken: novoRefreshToken };
}

export async function logout(refreshToken) {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken, revogado: false },
    data: { revogado: true }
  });
}
