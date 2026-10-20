import express from 'express';
import * as quadroController from './quadroController.js';

const quadroRouter = express.Router();

quadroRouter.post('/', quadroController.criarQuadro);
quadroRouter.get('/', quadroController.listarMeusQuadros);
quadroRouter.get('/:id', quadroController.buscarQuadro);
quadroRouter.put('/:id', quadroController.atualizarQuadro);
quadroRouter.delete('/:id', quadroController.apagarQuadro);

export { quadroRouter };
