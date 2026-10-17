
import argon2 from 'argon2';
import * as userRepository from './userRepository.js';

export async function criarUsuario({ nome, email, senha }) {
    if (
        !isValidarStringPreenchida(nome) ||
        !isValidarStringPreenchida(email) ||
        !isValidarStringPreenchida(senha)
    ) {
        throw new Error('Dados de cadastro inválidos');
    }

    const nomeNormalizado = normalizarNome(nome);
    const emailNormalizado = normalizarEmail(email);

    if (!isValidarEmail(emailNormalizado)) {
        throw new Error('E-mail inválido');
    }

    // Validar a senha
    if (!isValidarSenha(senha)) {
        throw new Error('A senha deve ter pelo menos 8 caracteres');
    }

    if (await verificarEmailCadastrado(emailNormalizado)) {
        throw new Error('E-mail já cadastrado');
    }

    const senhaHash = await gerarHashSenha(senha);

    return await userRepository.criarUsuario({
        nome: nomeNormalizado,
        email: emailNormalizado,
        senhaHash
    });
}

async function verificarEmailCadastrado(email) {
    const usuario = await userRepository.buscarUsuarioPorEmail({
        email
    });

    return usuario !== null;
}

async function gerarHashSenha(senha) {
    return await argon2.hash(senha, {
        type: argon2.argon2id
    });
}

function isValidarSenha(senha) {
    return isValidarStringPreenchida(senha) &&
           senha.length >= 8;
}

function isValidarString(valor) {
    return typeof valor === 'string';
}

function normalizarNome(nome) {
    return nome.trim();
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