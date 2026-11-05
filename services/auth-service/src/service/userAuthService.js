import argon2 from "argon2";
import { prisma } from "../config/database.js";

function isStringPreenchida(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function criarUsuario({ nome, email, senha }) {
  if (!isStringPreenchida(nome) || !isStringPreenchida(email) || !isStringPreenchida(senha)) {
    throw new Error("Dados de cadastro inválidos");
  }

  const nomeNormalizado = nome.trim();
  const emailNormalizado = email.trim().toLowerCase();
  if (!isEmailValido(emailNormalizado)) throw new Error("E-mail inválido");
  if (senha.length < 8) throw new Error("A senha deve ter pelo menos 8 caracteres");

  const senhaHash = await argon2.hash(senha, { type: argon2.argon2id });
  const usuario = await prisma.usuario.create({
    data: { nome: nomeNormalizado, email: emailNormalizado, senha: senhaHash },
    select: { id: true, nome: true, email: true },
  });

  try {
    await provisionarUsuario(process.env.USER_SERVICE_URL, usuario);
    await provisionarUsuario(process.env.TASK_SERVICE_URL, usuario);
    return usuario;
  } catch (error) {
    await Promise.allSettled([
      removerUsuarioProvisionado(process.env.USER_SERVICE_URL, usuario.id),
      removerUsuarioProvisionado(process.env.TASK_SERVICE_URL, usuario.id),
      prisma.usuario.deleteMany({ where: { id: usuario.id } }),
    ]);
    throw Object.assign(new Error("Não foi possível provisionar o usuário nos serviços dependentes"), { status: 503, cause: error });
  }
}

export async function alterarSenhaDoUsuario({ id, novaSenha, senhaAtual }) {
  if (!isStringPreenchida(novaSenha) || !isStringPreenchida(senhaAtual)) {
    throw new Error("A senha precisa ser preenchida");
  }
  if (novaSenha.length < 8) throw new Error("A senha precisa ter no mínimo 8 caracteres");

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { id: true, senha: true },
  });
  if (!usuario) throw new Error("Usuário não encontrado");
  if (!await argon2.verify(usuario.senha, senhaAtual)) throw new Error("Senha atual incorreta");

  const senhaHash = await argon2.hash(novaSenha, { type: argon2.argon2id });
  await prisma.usuario.update({ where: { id }, data: { senha: senhaHash }, select: { id: true } });
}

async function provisionarUsuario(baseUrl, usuario) {
  const response = await fetch(`${urlObrigatoria(baseUrl)}/internal/users`, {
    method: "POST",
    headers: headersInternos(),
    body: JSON.stringify(usuario),
  });
  if (!response.ok) throw new Error(`Falha ao provisionar usuário: HTTP ${response.status}`);
}

async function removerUsuarioProvisionado(baseUrl, id) {
  if (!baseUrl) return;
  await fetch(`${baseUrl}/internal/users/${id}`, {
    method: "DELETE",
    headers: headersInternos(),
  });
}

function urlObrigatoria(value) {
  if (!value) throw new Error("URL de serviço dependente não configurada");
  return value.replace(/\/$/, "");
}

function headersInternos() {
  if (!process.env.INTERNAL_SERVICE_TOKEN) throw new Error("INTERNAL_SERVICE_TOKEN não configurado");
  return {
    "content-type": "application/json",
    "x-internal-service-token": process.env.INTERNAL_SERVICE_TOKEN,
  };
}
