import express from 'express';
import routesRouter from './routes/routes.js';
import { usersRouter } from './routes/users/userRoutes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', routesRouter);
app.use('/users', usersRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: 'Erro interno do servidor' });
});

export default app;
