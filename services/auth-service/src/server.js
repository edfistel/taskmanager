import "dotenv/config";
import app from "./app.js";

const port = Number(process.env.AUTH_PORT) || 3001;

app.listen(port, () => {
  console.log(`Servico de autenticacao rodando na porta ${port}`);
});
