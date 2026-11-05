function urlDoServicoUsuario() {
  const baseUrl = process.env.USER_SERVICE_URL;
  if (!baseUrl) throw Object.assign(new Error("USER_SERVICE_URL não configurada"), { status: 503 });
  return baseUrl.replace(/\/$/, "");
}

function headersInternos() {
  const token = process.env.INTERNAL_SERVICE_TOKEN;
  if (!token) throw Object.assign(new Error("INTERNAL_SERVICE_TOKEN não configurado"), { status: 503 });
  return {
    "content-type": "application/json",
    "x-internal-service-token": token,
  };
}

async function chamarServicoUsuario(path, options) {
  let response;
  try {
    response = await fetch(`${urlDoServicoUsuario()}${path}`, options);
  } catch (error) {
    throw Object.assign(new Error("Serviço de usuários indisponível"), { status: 503, cause: error });
  }

  const resultado = await response.json().catch(() => null);
  if (response.ok) return resultado?.body;
  if (response.status === 401 || response.status === 404) {
    throw Object.assign(new Error(resultado?.message || "Usuário inválido"), { status: response.status });
  }
  throw Object.assign(new Error("Falha ao consultar o serviço de usuários"), { status: 503 });
}

export async function autenticarUsuario(email, senha) {
  return chamarServicoUsuario("/internal/authenticate", {
    method: "POST",
    headers: headersInternos(),
    body: JSON.stringify({ email, senha }),
  });
}

export async function buscarUsuarioPorId(id) {
  return chamarServicoUsuario(`/internal/users/${id}`, {
    method: "GET",
    headers: headersInternos(),
  });
}
