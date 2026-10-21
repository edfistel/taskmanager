import * as quadroRepository from './quadroRepository.js';
import {
    ErroDeValidacao,
    validarId,
    validarTextoObrigatorio,
    normalizarTextoOpcional
} from '../../tools/validacao.js';

const TAMANHO_MAXIMO_DO_NOME = 100;

// Todo quadro nasce com esta lista (o desenho exige ao menos uma lista por quadro)
const NOME_DA_LISTA_PADRAO = 'A Fazer';

export async function criarQuadro({ userId, nome, descricao }) {
    const nomeValidado = validarNome(nome);
    const descricaoNormalizada = normalizarDescricao(descricao);

    return quadroRepository.criarQuadro({
        userId,
        nome: nomeValidado,
        descricao: descricaoNormalizada,
        nomeDaListaPadrao: NOME_DA_LISTA_PADRAO
    });
}

export async function listarMeusQuadros(userId) {
    return quadroRepository.listarQuadrosDoUsuario(userId);
}

export async function buscarQuadro({ id, userId }) {
    const idDoQuadro = validarId(id, 'do quadro');

    return quadroRepository.buscarQuadroDoUsuario({ id: idDoQuadro, userId });
}

export async function atualizarQuadro({ id, userId, nome, descricao }) {
    const dados = {};

    if (nome !== undefined) {
        dados.nome = validarNome(nome);
    }

    if (descricao !== undefined) {
        dados.descricao = normalizarDescricao(descricao);
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

function validarNome(nome) {
    return validarTextoObrigatorio(nome, {
        campo: 'O nome do quadro',
        tamanhoMaximo: TAMANHO_MAXIMO_DO_NOME
    });
}

function normalizarDescricao(descricao) {
    return normalizarTextoOpcional(descricao, { campo: 'A descrição' });
}
