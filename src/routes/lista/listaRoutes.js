import express from 'express';
import * as listaController from './listaController.js';

const listaRouter = express.Router();

listaRouter.post('/quadros/:quadroId/listas', listaController.criarLista);
listaRouter.get('/quadros/:quadroId/listas', listaController.listarListasDoQuadro);
listaRouter.put('/listas/:id', listaController.renomearLista);
listaRouter.patch('/listas/:id/mover', listaController.moverLista);
listaRouter.delete('/listas/:id', listaController.apagarLista);

export { listaRouter };
