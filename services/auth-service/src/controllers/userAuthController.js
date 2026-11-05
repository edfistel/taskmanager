import * as userAuthService from "../service/userAuthService.js";

export async function criarUsuario(req, res) {
  try {
    const { nome, email, senha } = req.body || {};
    const usuario = await userAuthService.criarUsuario({ nome, email, senha });
    return res.status(201).json({ success: true, body: usuario });
  } catch (error) {
    const status = error.status || (error.code === "P2002" || error.message?.includes("já cadastrado")
      ? 409
      : ["Dados de cadastro inválidos", "E-mail inválido", "A senha deve ter pelo menos 8 caracteres"].includes(error.message)
        ? 400
        : 500);
    return res.status(status).json({ success: false, message: error.message });
  }
}

export async function alterarSenha(req, res) {
  try {
    await userAuthService.alterarSenhaDoUsuario({
      id: req.user.id,
      senhaAtual: req.body?.senhaAtual,
      novaSenha: req.body?.novaSenha,
    });
    return res.status(200).json({ success: true, message: "Senha alterada com sucesso" });
  } catch (error) {
    const status = error.message === "Usuário não encontrado"
      ? 404
      : error.message === "Senha atual incorreta"
        ? 403
        : ["A senha precisa ser preenchida", "A senha precisa ter no mínimo 8 caracteres"].includes(error.message)
          ? 400
          : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
}
