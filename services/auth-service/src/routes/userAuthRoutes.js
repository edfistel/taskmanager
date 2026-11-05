import { Router } from "express";
import { body, validationResult } from "express-validator";
import { autenticar } from "../middlewares/authMiddlewares.js";
import { criarUsuario, alterarSenha } from "../controllers/userAuthController.js";

const router = Router();

function validarCampos(req, res, next) {
  const erros = validationResult(req);
  if (!erros.isEmpty()) return res.status(400).json({ erro: erros.array()[0].msg });
  return next();
}

router.post("/register", [
  body("nome").isString().trim().notEmpty().withMessage("Nome obrigatório"),
  body("email").isString().trim().isEmail().withMessage("E-mail inválido"),
  body("senha").isString().isLength({ min: 8 }).withMessage("A senha deve ter pelo menos 8 caracteres"),
  validarCampos,
], criarUsuario);

router.use(autenticar);
router.put("/alterarSenha", alterarSenha);

export default router;
