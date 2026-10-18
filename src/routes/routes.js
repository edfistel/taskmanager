import express from 'express';
import { versao } from '../tools/versao.js';

const routesRouter = express.Router();

routesRouter.get('/', function(req, res, next) {
  res.json({ app: 'Api - Task Manager', version: `Versão: ${versao}` });
});

export default routesRouter;
