import express from 'express';
import * as userController from './userController.js';
const usersRouter = express.Router();

usersRouter.post('/', userController.criarUsuario);
usersRouter.post('/login', userController.login);
usersRouter.get('/buscarUsuarioPorEmail/:email', userController.buscarUsuarioPorEmail);
usersRouter.get('/buscarMeuPerfil', userController.buscarMeuPerfil);
usersRouter.delete('/apagarUsuario', userController.apagarUsuario);
usersRouter.put('/alterarSenha', userController.alterarSenha);
export { usersRouter };
