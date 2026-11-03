import express from 'express';
import * as atribuicaoController from './atribuicaoController.js';

const atribuicaoRouter = express.Router();

atribuicaoRouter.get('/atribuicoes/minhas', atribuicaoController.listarMinhasAtribuicoes);
atribuicaoRouter.post('/tarefas/:tarefaId/atribuicoes', atribuicaoController.atribuirUsuario);
atribuicaoRouter.get('/tarefas/:tarefaId/atribuicoes', atribuicaoController.listarAtribuicoesDaTarefa);
atribuicaoRouter.delete('/tarefas/:tarefaId/atribuicoes/:usuarioId', atribuicaoController.removerAtribuicao);

export { atribuicaoRouter };
