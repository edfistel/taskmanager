import * as tarefaRepository from './tarefaRepository.js';
import * as listaRepository from '../lista/listaRepository.js';
import { Status } from '../../../prisma/generated/client/enums.ts';
import {
    ErroDeValidacao,
    validarId,
    validarTextoObrigatorio,
    normalizarTextoOpcional,
    validarPosicao
} from '../../tools/validacao.js';

const TAMANHO_MAXIMO_DO_TITULO = 200;

// Valores aceitos vêm do enum Status do schema do Prisma
const STATUS_VALIDOS = Object.values(Status);

export async function criarTarefa({ userId, listaId, titulo, descricao, prazo, status }) {
    const dados = {
        titulo: validarTitulo(titulo),
        descricao: normalizarDescricao(descricao),
        prazo: validarPrazo(prazo)
    };

    // Sem status informado, o banco usa o padrão A_FAZER
    if (status !== undefined) {
        dados.status = validarStatus(status);
    }

    const lista = await buscarListaDoUsuario({ listaId, userId });

    if (!lista) {
        return null;
    }

    return tarefaRepository.criarTarefa({ listaId: lista.id, dados });
}

export async function listarTarefasDaLista({ userId, listaId }) {
    const lista = await buscarListaDoUsuario({ listaId, userId });

    if (!lista) {
        return null;
    }

    return tarefaRepository.listarTarefasDaLista(lista.id);
}

export async function buscarTarefa({ id, userId }) {
    const idDaTarefa = validarId(id, 'da tarefa');
    const tarefa = await tarefaRepository.buscarTarefaDoUsuario({ id: idDaTarefa, userId });

    if (!tarefa) {
        return null;
    }

    const { lista, ...dadosDaTarefa } = tarefa;

    return { ...dadosDaTarefa, quadroId: lista.quadroId };
}

// Usado por subtarefas, comentários e atribuições: devolve a tarefa e se o usuário é o dono do quadro
export async function buscarTarefaComAcesso({ tarefaId, userId }) {
    const idDaTarefa = validarId(tarefaId, 'da tarefa');
    const tarefa = await tarefaRepository.buscarTarefaAcessivel({ id: idDaTarefa, userId });

    if (!tarefa) {
        return null;
    }

    return { id: tarefa.id, ehDono: tarefa.lista.quadro.usuarioId === userId };
}

export async function atualizarTarefa({ id, userId, titulo, descricao, prazo, status }) {
    const dados = {};

    if (titulo !== undefined) {
        dados.titulo = validarTitulo(titulo);
    }

    if (descricao !== undefined) {
        dados.descricao = normalizarDescricao(descricao);
    }

    if (prazo !== undefined) {
        dados.prazo = validarPrazo(prazo);
    }

    if (status !== undefined) {
        dados.status = validarStatus(status);
    }

    if (Object.keys(dados).length === 0) {
        throw new ErroDeValidacao('Informe o título, a descrição, o prazo ou o status para atualizar');
    }

    const tarefa = await buscarTarefa({ id, userId });

    if (!tarefa) {
        return null;
    }

    return tarefaRepository.atualizarTarefa({ id: tarefa.id, dados });
}

// Sem listaId, a tarefa muda de posição dentro da própria lista
export async function moverTarefa({ id, userId, listaId, posicao }) {
    const posicaoValidada = validarPosicao(posicao);
    const tarefa = await buscarTarefa({ id, userId });

    if (!tarefa) {
        return null;
    }

    let listaDeDestinoId = tarefa.listaId;

    if (listaId !== undefined) {
        const listaDeDestino = await buscarListaDoUsuario({ listaId, userId });

        if (!listaDeDestino) {
            throw new ErroDeValidacao('Lista de destino não encontrada');
        }

        if (listaDeDestino.quadroId !== tarefa.quadroId) {
            throw new ErroDeValidacao('A tarefa só pode ser movida para uma lista do mesmo quadro');
        }

        listaDeDestinoId = listaDeDestino.id;
    }

    return tarefaRepository.moverTarefa({
        id: tarefa.id,
        listaDeOrigemId: tarefa.listaId,
        listaDeDestinoId,
        posicao: posicaoValidada
    });
}

export async function apagarTarefa({ id, userId }) {
    const tarefa = await buscarTarefa({ id, userId });

    if (!tarefa) {
        return null;
    }

    return tarefaRepository.apagarTarefa(tarefa.id);
}

async function buscarListaDoUsuario({ listaId, userId }) {
    const idDaLista = validarId(listaId, 'da lista');

    return listaRepository.buscarListaDoUsuario({ id: idDaLista, userId });
}

function validarTitulo(titulo) {
    return validarTextoObrigatorio(titulo, {
        campo: 'O título da tarefa',
        tamanhoMaximo: TAMANHO_MAXIMO_DO_TITULO
    });
}

function normalizarDescricao(descricao) {
    return normalizarTextoOpcional(descricao, { campo: 'A descrição' });
}

// O prazo é só a data (AAAA-MM-DD); vazio ou null remove o prazo
function validarPrazo(prazo) {
    if (prazo === undefined || prazo === null || prazo === '') {
        return null;
    }

    if (typeof prazo !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(prazo)) {
        throw new ErroDeValidacao('O prazo precisa estar no formato AAAA-MM-DD');
    }

    const data = new Date(`${prazo}T00:00:00Z`);

    // Recusa datas que não existem, como 2026-02-30
    if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== prazo) {
        throw new ErroDeValidacao('O prazo informado não é uma data válida');
    }

    return data;
}

function validarStatus(status) {
    if (!STATUS_VALIDOS.includes(status)) {
        throw new ErroDeValidacao(`O status precisa ser um destes: ${STATUS_VALIDOS.join(', ')}`);
    }

    return status;
}
