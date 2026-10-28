import {
  login,
  atualizarToken as gerarNovoAccessToken,
  logout
} from "../service/authService.js";

export async function entrar(req, res) {

  try {

    const { email, senha } = req.body || {};

    const tokens = await login(
      email,
      senha
    );

    return res.status(200).json(tokens);

  } catch (erro) {

    return responderErro(res, erro, "Erro ao realizar login");
  }
}


export async function atualizarToken(req, res) {

  try {

    const { refreshToken } = req.body || {};

    if (!refreshToken) {
      return res.status(400).json({ erro: "Refresh token não informado" });
    }

    const resultado = await gerarNovoAccessToken(
      refreshToken
    );

    return res.status(200).json(resultado);

  } catch (erro) {

    return responderErro(res, erro, "Erro ao atualizar token");
  }
}


export async function sair(req, res) {

  try {

    const { refreshToken } = req.body || {};

    if (!refreshToken) {
      return res.status(400).json({ erro: "Refresh token não informado" });
    }

    await logout(refreshToken);

    return res.status(200).json({
      mensagem: "Logout realizado com sucesso"
    });

  } catch (erro) {

    return responderErro(res, erro, "Erro ao realizar logout");
  }
}

function responderErro(res, erro, mensagemFallback) {
  const status = erro.status || 500;

  if (status >= 500) {
    console.error(erro);
  }

  return res.status(status).json({
    erro: status >= 500 ? mensagemFallback : erro.message
  });
}
