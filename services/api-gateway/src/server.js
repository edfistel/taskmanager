import "dotenv/config";
import app from "./app.js";
import { iniciarMonitoramento } from "./observability.js";

const port = Number(process.env.API_GATEWAY_PORT) || 3000;

app.listen(port, () => {
  console.log(`API Gateway rodando na porta ${port}`);
  iniciarMonitoramento();
});
