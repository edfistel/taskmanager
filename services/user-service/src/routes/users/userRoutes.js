import express from 'express';
import * as userController from './userController.js';
import { autenticar } from '../../middlewares/authMiddlewares.js';
const usersRouter = express.Router();

usersRouter.post('/register', userController.criarUsuario);

usersRouter.use(autenticar);
usersRouter.put('/alterarSenha', userController.alterarSenha);
usersRouter.get('/buscarUsuarioPorEmail/:email', userController.buscarUsuarioPorEmail);
usersRouter.get('/buscarMeuPerfil', userController.buscarMeuPerfil);
usersRouter.delete('/apagarUsuario', userController.apagarUsuario);
export { usersRouter };
