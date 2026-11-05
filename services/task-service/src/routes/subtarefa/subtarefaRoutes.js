import express from 'express';
import * as subtarefaController from './subtarefaController.js';

const subtarefaRouter = express.Router();

subtarefaRouter.post('/tarefas/:tarefaId/subtarefas', subtarefaController.criarSubtarefa);
subtarefaRouter.get('/tarefas/:tarefaId/subtarefas', subtarefaController.listarSubtarefasDaTarefa);
subtarefaRouter.put('/subtarefas/:id', subtarefaController.renomearSubtarefa);
subtarefaRouter.patch('/subtarefas/:id/concluir', subtarefaController.marcarConcluida);
subtarefaRouter.delete('/subtarefas/:id', subtarefaController.apagarSubtarefa);

export { subtarefaRouter };
