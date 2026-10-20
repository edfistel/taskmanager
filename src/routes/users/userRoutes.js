import express from 'express';
import { versao } from '../../tools/versao.js';
import * as userController from './userController.js';
const usersRouter = express.Router();

usersRouter.post('usuarios/', userController.criarUsuario);
usersRouter.get('usuarios/buscarUsuarioPorEmail/:email', userController.buscarUsuarioPorEmail);
usersRouter.get('usuarios/buscarMeuPerfil', userController.buscarMeuPerfil);
usersRouter.delete('/usuarios/apagarUsuario', userController.apagarUsuario);
usersRouter.put('usuarios/alterarSenha', userController.alterarSenha);
export { usersRouter };
