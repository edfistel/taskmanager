import * as listaRepository from './listaRepository.js';
import * as quadroRepository from '../quadro/quadroRepository.js';
import {
    ErroDeValidacao,
    validarId,
    validarTextoObrigatorio,
    validarPosicao
} from '../../tools/validacao.js';

const TAMANHO_MAXIMO_DO_NOME = 100;

export async function criarLista({ userId, quadroId, nome }) {
    const nomeValidado = validarNome(nome);
    const quadro = await buscarQuadroDoUsuario({ quadroId, userId });

    if (!quadro) {
        return null;
    }

    return listaRepository.criarLista({ quadroId: quadro.id, nome: nomeValidado });
}

export async function listarListasDoQuadro({ userId, quadroId }) {
    const quadro = await buscarQuadroDoUsuario({ quadroId, userId });

    if (!quadro) {
        return null;
    }

    return listaRepository.listarListasDoQuadro(quadro.id);
}

export async function buscarLista({ id, userId }) {
    const idDaLista = validarId(id, 'da lista');

    return listaRepository.buscarListaDoUsuario({ id: idDaLista, userId });
}

export async function renomearLista({ id, userId, nome }) {
    const nomeValidado = validarNome(nome);
    const lista = await buscarLista({ id, userId });

    if (!lista) {
        return null;
    }

    return listaRepository.renomearLista({ id: lista.id, nome: nomeValidado });
}

export async function moverLista({ id, userId, posicao }) {
    const posicaoValidada = validarPosicao(posicao);
    const lista = await buscarLista({ id, userId });

    if (!lista) {
        return null;
    }

    return listaRepository.moverLista({
        id: lista.id,
        quadroId: lista.quadroId,
        posicao: posicaoValidada
    });
}

export async function apagarLista({ id, userId }) {
    const lista = await buscarLista({ id, userId });

    if (!lista) {
        return null;
    }

    // O desenho exige que todo quadro tenha ao menos uma lista
    const totalDeListas = await listaRepository.contarListasDoQuadro(lista.quadroId);

    if (totalDeListas <= 1) {
        throw new ErroDeValidacao('O quadro precisa ter ao menos uma lista');
    }

    return listaRepository.apagarLista(lista.id);
}

async function buscarQuadroDoUsuario({ quadroId, userId }) {
    const idDoQuadro = validarId(quadroId, 'do quadro');

    return quadroRepository.buscarQuadroDoUsuario({ id: idDoQuadro, userId });
}

function validarNome(nome) {
    return validarTextoObrigatorio(nome, {
        campo: 'O nome da lista',
        tamanhoMaximo: TAMANHO_MAXIMO_DO_NOME
    });
}
