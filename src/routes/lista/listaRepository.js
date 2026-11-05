import { prisma } from '../../config/database.js';
import { inserirNaPosicao } from '../../tools/posicao.js';

const camposDaLista = {
    id: true,
    nome: true,
    posicao: true,
    quadroId: true
};

const camposDaTarefaNaLista = {
    id: true,
    titulo: true,
    prazo: true,
    posicao: true,
    status: true
};

// A nova lista entra no final do quadro
export async function criarLista({ quadroId, nome }) {
    return prisma.$transaction(async (tx) => {
        const { _max } = await tx.lista.aggregate({
            where: { quadroId },
            _max: { posicao: true }
        });

        return tx.lista.create({
            data: { quadroId, nome, posicao: (_max.posicao ?? -1) + 1 },
            select: camposDaLista
        });
    });
}

// Devolve as listas do quadro em ordem, cada uma com as suas tarefas em ordem
export async function listarListasDoQuadro(quadroId) {
    return prisma.lista.findMany({
        where: { quadroId },
        orderBy: { posicao: 'asc' },
        select: {
            ...camposDaLista,
            tarefas: {
                select: camposDaTarefaNaLista,
                orderBy: { posicao: 'asc' }
            }
        }
    });
}

// Só encontra a lista se o quadro dela pertencer ao usuário
export async function buscarListaDoUsuario({ id, userId }) {
    return prisma.lista.findFirst({
        where: { id, quadro: { usuarioId: userId } },
        select: camposDaLista
    });
}

export async function contarListasDoQuadro(quadroId) {
    return prisma.lista.count({ where: { quadroId } });
}

export async function renomearLista({ id, nome }) {
    return prisma.lista.update({
        where: { id },
        data: { nome },
        select: camposDaLista
    });
}

// Reordena todas as listas do quadro para encaixar a lista na nova posição
export async function moverLista({ id, quadroId, posicao }) {
    return prisma.$transaction(async (tx) => {
        const listas = await tx.lista.findMany({
            where: { quadroId },
            orderBy: { posicao: 'asc' },
            select: { id: true }
        });

        const novaOrdem = inserirNaPosicao(listas.map((lista) => lista.id), id, posicao);

        for (const [indice, idDaLista] of novaOrdem.entries()) {
            await tx.lista.update({ where: { id: idDaLista }, data: { posicao: indice } });
        }

        return tx.lista.findUnique({ where: { id }, select: camposDaLista });
    });
}

// O banco apaga em cascata as tarefas da lista
export async function apagarLista(id) {
    return prisma.lista.delete({
        where: { id },
        select: camposDaLista
    });
}
