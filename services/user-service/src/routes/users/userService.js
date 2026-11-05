import argon2 from 'argon2';
import * as userRepository from './userRepository.js';

export async function buscarUsuarioPorEmail(email) {
    if (!isValidarStringPreenchida(email)) {
        throw new Error('O email precisa ser preenchido');
    }

    const emailNormalizado = normalizarEmail(email);
    if (!isValidarEmail(emailNormalizado)) {
        throw new Error('Digite um email válido');
    }

    return userRepository.buscarUsuarioPorEmail(emailNormalizado);
}

export async function buscarUsuarioPorId(id) {
    return userRepository.buscarUsuarioPorId(id);
}

export async function buscarUsuariosPorIds(ids) {
    return userRepository.buscarUsuariosPorIds([...new Set(ids)]);
}

export async function criarUsuario({ nome, email, senha }) {
    if (!isValidarStringPreenchida(nome) || !isValidarStringPreenchida(email) || !isValidarStringPreenchida(senha)) {
        throw Object.assign(new Error('Dados de cadastro inválidos'), { status: 400 });
    }

    const nomeNormalizado = nome.trim();
    const emailNormalizado = normalizarEmail(email);
    if (!isValidarEmail(emailNormalizado)) throw Object.assign(new Error('E-mail inválido'), { status: 400 });
    if (senha.length < 8) throw Object.assign(new Error('A senha deve ter pelo menos 8 caracteres'), { status: 400 });

    const senhaHash = await argon2.hash(senha, { type: argon2.argon2id });
    return userRepository.criarUsuario({ nome: nomeNormalizado, email: emailNormalizado, senha: senhaHash });
}

export async function autenticarCredenciais(email, senha) {
    if (!isValidarStringPreenchida(email) || !isValidarStringPreenchida(senha)) {
        throw Object.assign(new Error('Credenciais inválidas'), { status: 401 });
    }

    const emailNormalizado = normalizarEmail(email);
    if (!isValidarEmail(emailNormalizado)) throw Object.assign(new Error('Credenciais inválidas'), { status: 401 });

    const usuario = await userRepository.buscarCredenciaisPorEmail(emailNormalizado);
    if (!usuario || !await argon2.verify(usuario.senha, senha)) {
        throw Object.assign(new Error('Credenciais inválidas'), { status: 401 });
    }

    return { id: usuario.id, nome: usuario.nome, email: usuario.email };
}

export async function alterarSenhaDoUsuario({ id, novaSenha, senhaAtual }) {
    if (!isValidarStringPreenchida(novaSenha) || !isValidarStringPreenchida(senhaAtual)) {
        throw Object.assign(new Error('A senha precisa ser preenchida'), { status: 400 });
    }
    if (novaSenha.length < 8) {
        throw Object.assign(new Error('A senha precisa ter no mínimo 8 caracteres'), { status: 400 });
    }

    const usuario = await userRepository.buscarCredenciaisPorId(id);
    if (!usuario) throw Object.assign(new Error('Usuário não encontrado'), { status: 404 });
    if (!await argon2.verify(usuario.senha, senhaAtual)) {
        throw Object.assign(new Error('Senha atual incorreta'), { status: 403 });
    }

    const senhaHash = await argon2.hash(novaSenha, { type: argon2.argon2id });
    await userRepository.alterarSenha({ id, senha: senhaHash });
}

export async function apagarUsuario(id) {
    const usuario = await userRepository.buscarUsuarioPorId(id);
    if (!usuario) return null;

    await removerUsuarioDeServico(process.env.AUTH_SERVICE_URL, id);
    await removerUsuarioDeServico(process.env.TASK_SERVICE_URL, id);
    return userRepository.apagarUsuario(id);
}

async function removerUsuarioDeServico(baseUrl, id) {
    if (!baseUrl || !process.env.INTERNAL_SERVICE_TOKEN) {
        throw Object.assign(new Error('Configuração de serviços internos incompleta'), { status: 503 });
    }

    let response;
    try {
        response = await fetch(`${baseUrl.replace(/\/$/, '')}/internal/users/${id}`, {
            method: 'DELETE',
            headers: headersInternos(),
        });
    } catch (error) {
        throw Object.assign(new Error('Serviço interno indisponível'), { status: 503, cause: error });
    }

    if (!response.ok) {
        throw Object.assign(new Error('Falha ao remover usuário dos serviços dependentes'), { status: 503 });
    }
}

function urlObrigatoria(value) {
    if (!value) throw Object.assign(new Error('URL do serviço Tasks não configurada'), { status: 503 });
    return value.replace(/\/$/, '');
}

function headersInternos() {
    if (!process.env.INTERNAL_SERVICE_TOKEN) {
        throw Object.assign(new Error('INTERNAL_SERVICE_TOKEN não configurado'), { status: 503 });
    }
    return {
        'content-type': 'application/json',
        'x-internal-service-token': process.env.INTERNAL_SERVICE_TOKEN,
    };
}

function normalizarEmail(email) {
    return email.trim().toLowerCase();
}

function isValidarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidarStringPreenchida(valor) {
    return typeof valor === 'string' && valor.trim().length > 0;
}
