import {
  login,
  atualizarToken as gerarNovoAccessToken,
  logout,
} from "../service/authService.js";

export async function entrar(req, res) {
  try {
    const { email, senha } = req.body || {};
    return res.status(200).json(await login(email, senha));
  } catch (error) {
    return responderErro(res, error, "Erro ao realizar login");
  }
}

export async function atualizarToken(req, res) {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ erro: "Refresh token não informado" });
    return res.status(200).json(await gerarNovoAccessToken(refreshToken));
  } catch (error) {
    return responderErro(res, error, "Erro ao atualizar token");
  }
}

export async function sair(req, res) {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ erro: "Refresh token não informado" });
    await logout(refreshToken);
    return res.status(200).json({ mensagem: "Logout realizado com sucesso" });
  } catch (error) {
    return responderErro(res, error, "Erro ao realizar logout");
  }
}

function responderErro(res, error, mensagemFallback) {
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  return res.status(status).json({ erro: status >= 500 ? mensagemFallback : error.message });
}
