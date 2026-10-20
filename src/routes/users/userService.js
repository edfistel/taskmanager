
import argon2 from 'argon2';
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

export async function login({ email, senha }) {
    if (
        !isValidarStringPreenchida(email) ||
        !isValidarStringPreenchida(senha)
    ) {
        throw new Error('O usuário e a senha precisam ser preenchidos');
    }

    const emailNormalizado = normalizarEmail(email);

    if (!isValidarEmail(emailNormalizado)) {
        throw new Error('Digite um e-mail válido');
    }
    
    const usuario = await userRepository.buscarUsuarioPorEmail(
        emailNormalizado
    );
    
    if (!usuario || !usuario.ativo) {
        throw new Error('E-mail ou senha inválidos');
    }

    const senhaCorreta = await argon2.verify(
        usuario.senha_hash,
        senha
    );

    if (!senhaCorreta) {
        throw new Error('E-mail ou senha inválidos');
    }

    // Autenticação das credenciais realizada com sucesso
    return {
        id_usuario: usuario.id_usuario,
        nome: usuario.nome,
        email: usuario.email
    };
}


export async function alterarSenhaDoUsuario({id, novaSenha, senhaAtual}) {
    if(!isValidarStringPreenchida(novaSenha) || !isValidarStringPreenchida(senhaAtual)){
        throw new Error('A senha precisa ser preenchida');
    }
    if(!isValidarSenha(novaSenha)){
        throw new Error('A senha precisa ter no mínimo 8 caracteres');
    }
    
    const usuario = await userRepository.buscarUsuarioPorId(id);
    
    if(!usuario || !usuario.ativo) {
        throw new Error('Usuário não encontrado, ou inativo');
    }

    const senhaMatch = await argon2.verify(usuario.senha_hash, senhaAtual);

    if(!senhaMatch) {
        throw new Error('Senha atual incorreta');
    }

    const senhaHash = await gerarHashSenha(novaSenha);

    return userRepository.alterarSenha({id, senhaHash});

}

export async function apagarUsuario(id) {
    return userRepository.apagarUsuario(id);
}

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
    const usuario = await userRepository.buscarUsuarioPorEmail(email);

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