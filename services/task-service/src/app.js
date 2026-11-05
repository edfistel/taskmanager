import express from 'express';
import routesRouter from './routes/routes.js';
import { quadroRouter } from './routes/quadro/quadroRoutes.js';
import { listaRouter } from './routes/lista/listaRoutes.js';
import { tarefaRouter } from './routes/tarefa/tarefaRoutes.js';
import { subtarefaRouter } from './routes/subtarefa/subtarefaRoutes.js';
import { comentarioRouter } from './routes/comentario/comentarioRoutes.js';
import { atribuicaoRouter } from './routes/atribuicao/atribuicaoRoutes.js';
import { autenticar } from './middlewares/authMiddlewares.js';
import internalRouter from './routes/internalRoutes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', routesRouter);
app.use('/internal', internalRouter);
app.use(autenticar);

app.use('/quadros', quadroRouter);
app.use(listaRouter);
app.use(tarefaRouter);
app.use(subtarefaRouter);
app.use(comentarioRouter);
app.use(atribuicaoRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: 'Erro interno do servidor' });
});

export default app;
