import express from 'express';
import * as comentarioController from './comentarioController.js';

const comentarioRouter = express.Router();

comentarioRouter.post('/tarefas/:tarefaId/comentarios', comentarioController.escreverComentario);
comentarioRouter.get('/tarefas/:tarefaId/comentarios', comentarioController.listarComentariosDaTarefa);
comentarioRouter.put('/comentarios/:id', comentarioController.editarComentario);
comentarioRouter.delete('/comentarios/:id', comentarioController.excluirComentario);

export { comentarioRouter };
