
import * as userRepository from './userRepository.js';

export async function buscarUsuarioPorEmail(email) {
    if(!isValidarStringPreenchida(email)){
        throw new Error('O email precisa ser preenchido');
    }

    const emailNormalizado = normalizarEmail(email);

    if(!isValidarEmail(emailNormalizado)){
        throw new Error('Digite um email válido');
    }

    return await userRepository.buscarUsuarioPorEmail(emailNormalizado);
}

export async function buscarUsuarioPorId(id) {
    return userRepository.buscarUsuarioPorId(id);
}

export async function apagarUsuario(id) {
    const usuario = await userRepository.buscarUsuarioPorId(id);

    if (!usuario) {
        return null;
    }

    await removerUsuarioDeServico(process.env.AUTH_SERVICE_URL, id);
    await removerUsuarioDeServico(process.env.TASK_SERVICE_URL, id);
    return userRepository.apagarUsuario(id);
}

export async function provisionarUsuario({ id, nome, email }) {
    if (!Number.isInteger(id) || id < 1 || !isValidarStringPreenchida(email)) {
        throw Object.assign(new Error("Dados de usuário inválidos"), { status: 400 });
    }
    return userRepository.provisionarUsuario({ id, nome, email: normalizarEmail(email) });
}

export async function removerUsuarioInterno(id) {
    return userRepository.removerUsuarioInterno(id);
}

async function removerUsuarioDeServico(baseUrl, id) {
    if (!baseUrl || !process.env.INTERNAL_SERVICE_TOKEN) {
        throw Object.assign(new Error("Configuração de serviços internos incompleta"), { status: 503 });
    }

    let response;
    try {
        response = await fetch(`${baseUrl.replace(/\/$/, "")}/internal/users/${id}`, {
            method: "DELETE",
            headers: { "x-internal-service-token": process.env.INTERNAL_SERVICE_TOKEN }
        });
    } catch (error) {
        throw Object.assign(new Error("Serviço interno indisponível"), { status: 503, cause: error });
    }

    if (!response.ok) {
        throw Object.assign(new Error("Falha ao remover usuário dos serviços dependentes"), { status: 503 });
    }
}

function isValidarString(valor) {
    return typeof valor === 'string';
}

function normalizarEmail(email) {
    return email.trim().toLowerCase();
}

function isValidarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return regex.test(email);
}

function isValidarStringPreenchida(valor) {
    if (!isValidarString(valor)) {
        return false;
    }

    return valor.trim().length > 0;
}
