const userServiceUrl = (process.env.USER_SERVICE_URL || 'http://localhost:3002').replace(/\/$/, '');

function headersInternos() {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    if (!token) throw Object.assign(new Error('INTERNAL_SERVICE_TOKEN não configurado'), { status: 503 });
    return {
        'content-type': 'application/json',
        'x-internal-service-token': token,
    };
}

async function chamarUserService(path, options) {
    let response;
    try {
        response = await fetch(`${userServiceUrl}${path}`, options);
    } catch (error) {
        throw Object.assign(new Error('User Service indisponível'), { status: 503, cause: error });
    }

    const resultado = await response.json().catch(() => null);
    if (response.status === 404) return null;
    if (!response.ok) {
        throw Object.assign(new Error('Falha ao consultar o User Service'), { status: 503 });
    }
    return resultado?.body;
}

export async function buscarUsuarioPorEmail(email) {
    return chamarUserService('/internal/users/by-email', {
        method: 'POST',
        headers: headersInternos(),
        body: JSON.stringify({ email }),
    });
}

export async function buscarUsuariosPorIds(ids) {
    if (ids.length === 0) return [];
    return chamarUserService('/internal/users/by-ids', {
        method: 'POST',
        headers: headersInternos(),
        body: JSON.stringify({ ids }),
    });
}

export async function buscarUsuarioPorId(id) {
    return chamarUserService(`/internal/users/${id}`, {
        method: 'GET',
        headers: headersInternos(),
    });
}
