import express from 'express';
import { versao } from '../../tools/versao.js';
import * as userController from './userController.js';
const usersRouter = express.Router();

usersRouter.post('/', userController.criarUsuario);

export { usersRouter };
