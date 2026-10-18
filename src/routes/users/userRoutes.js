import express from 'express';
import { versao } from '../../tools/versao.js';

const usersRouter = express.Router();

usersRouter.get('/', function(req, res, next) {
  res.json({ route: 'Rota Users', version: `Versão: ${versao}` });
});

export { usersRouter };
