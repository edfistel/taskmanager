import express from 'express';
import * as userController from './userController.js';
import { autenticar } from '../../middlewares/authMiddlewares.js';
const usersRouter = express.Router();

usersRouter.use(autenticar);
usersRouter.get('/buscarUsuarioPorEmail/:email', userController.buscarUsuarioPorEmail);
usersRouter.get('/buscarMeuPerfil', userController.buscarMeuPerfil);
usersRouter.delete('/apagarUsuario', userController.apagarUsuario);
export { usersRouter };
