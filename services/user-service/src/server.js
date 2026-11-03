import "dotenv/config";
import app from "./app.js";

const port = Number(process.env.USER_SERVICE_PORT) || 3002;

app.listen(port, () => {
  console.log(`Servico de usuarios rodando na porta ${port}`);
});
