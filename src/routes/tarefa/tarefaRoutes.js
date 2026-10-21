import express from 'express';
import * as tarefaController from './tarefaController.js';

const tarefaRouter = express.Router();

tarefaRouter.post('/listas/:listaId/tarefas', tarefaController.criarTarefa);
tarefaRouter.get('/listas/:listaId/tarefas', tarefaController.listarTarefasDaLista);
tarefaRouter.get('/tarefas/:id', tarefaController.buscarTarefa);
tarefaRouter.put('/tarefas/:id', tarefaController.atualizarTarefa);
tarefaRouter.patch('/tarefas/:id/mover', tarefaController.moverTarefa);
tarefaRouter.delete('/tarefas/:id', tarefaController.apagarTarefa);

export { tarefaRouter };
