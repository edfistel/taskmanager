export function autenticarServicoInterno(req, res, next) {
  const tokenConfigurado = process.env.INTERNAL_SERVICE_TOKEN;
  if (!tokenConfigurado) {
    return res.status(500).json({ erro: "INTERNAL_SERVICE_TOKEN não configurado" });
  }
  if (req.headers["x-internal-service-token"] !== tokenConfigurado) {
    return res.status(403).json({ erro: "Serviço interno não autorizado" });
  }
  return next();
}
