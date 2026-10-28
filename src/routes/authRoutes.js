import { Router } from "express";
import { body, validationResult } from "express-validator";
import {
  entrar,
  atualizarToken,
  sair
} from "../controllers/authControllers.js";

const router = Router();

function validarCampos(req, res, next) {
  const erros = validationResult(req);

  if (!erros.isEmpty()) {
    return res.status(400).json({ erro: erros.array()[0].msg });
  }

  return next();
}

const validarLogin = [
  body("email").isString().trim().isEmail().withMessage("E-mail inválido"),
  body("senha").isString().notEmpty().withMessage("Senha obrigatória"),
  validarCampos
];

const validarRefreshToken = [
  body("refreshToken").isString().notEmpty().withMessage("Refresh token não informado"),
  validarCampos
];

router.post("/login", validarLogin, entrar);
router.post("/refresh", validarRefreshToken, atualizarToken);
router.post("/logout", validarRefreshToken, sair);

export default router;
