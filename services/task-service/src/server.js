import app from './app.js';

const PORT = Number(process.env.TASK_SERVICE_PORT) || 3003;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
