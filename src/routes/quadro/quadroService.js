import * as quadroRepository from './quadroRepository.js';

const TAMANHO_MAXIMO_DO_NOME = 100;

// Erro causado por dado inválido enviado pelo cliente (vira status 400)
export class ErroDeValidacao extends Error {}

export async function criarQuadro({ userId, nome, descricao }) {
    const nomeValidado = validarNome(nome);
    const descricaoNormalizada = normalizarDescricao(descricao);

    return quadroRepository.criarQuadro({
        userId,
        nome: nomeValidado,
        descricao: descricaoNormalizada
    });
}

export async function listarMeusQuadros(userId) {
    return quadroRepository.listarQuadrosDoUsuario(userId);
}

export async function buscarQuadro({ id, userId }) {
    const idDoQuadro = validarId(id);

    return quadroRepository.buscarQuadroDoUsuario({ id: idDoQuadro, userId });
}

export async function atualizarQuadro({ id, userId, nome, descricao }) {
    const dados = {};

    if (nome !== undefined) {
        dados.name = validarNome(nome);
    }

    if (descricao !== undefined) {
        dados.description = normalizarDescricao(descricao);
    }

    if (Object.keys(dados).length === 0) {
        throw new ErroDeValidacao('Informe o nome ou a descrição para atualizar');
    }

    // Só altera se o quadro existir e pertencer ao usuário
    const quadro = await buscarQuadro({ id, userId });

    if (!quadro) {
        return null;
    }

    return quadroRepository.atualizarQuadro({ id: quadro.id, dados });
}

export async function apagarQuadro({ id, userId }) {
    const quadro = await buscarQuadro({ id, userId });

    if (!quadro) {
        return null;
    }

    return quadroRepository.apagarQuadro(quadro.id);
}

function validarId(id) {
    const idNumerico = Number(id);

    if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
        throw new ErroDeValidacao('Id do quadro inválido');
    }

    return idNumerico;
}

function validarNome(nome) {
    if (typeof nome !== 'string' || nome.trim().length === 0) {
        throw new ErroDeValidacao('O nome do quadro precisa ser preenchido');
    }

    const nomeNormalizado = nome.trim();

    if (nomeNormalizado.length > TAMANHO_MAXIMO_DO_NOME) {
        throw new ErroDeValidacao(`O nome do quadro pode ter no máximo ${TAMANHO_MAXIMO_DO_NOME} caracteres`);
    }

    return nomeNormalizado;
}

function normalizarDescricao(descricao) {
    if (descricao === undefined || descricao === null) {
        return null;
    }

    if (typeof descricao !== 'string') {
        throw new ErroDeValidacao('A descrição precisa ser um texto');
    }

    const descricaoNormalizada = descricao.trim();

    return descricaoNormalizada.length > 0 ? descricaoNormalizada : null;
}
