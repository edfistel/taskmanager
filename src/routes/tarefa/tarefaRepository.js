import { prisma } from '../../config/database.js';
import { inserirNaPosicao } from '../../tools/posicao.js';

const camposDaTarefa = {
    id: true,
    titulo: true,
    descricao: true,
    prazo: true,
    posicao: true,
    status: true,
    listaId: true
};

// A nova tarefa entra no final da lista
export async function criarTarefa({ listaId, dados }) {
    return prisma.$transaction(async (tx) => {
        const { _max } = await tx.tarefa.aggregate({
            where: { listaId },
            _max: { posicao: true }
        });

        return tx.tarefa.create({
            data: { ...dados, listaId, posicao: (_max.posicao ?? -1) + 1 },
            select: camposDaTarefa
        });
    });
}

export async function listarTarefasDaLista(listaId) {
    return prisma.tarefa.findMany({
        where: { listaId },
        orderBy: { posicao: 'asc' },
        select: camposDaTarefa
    });
}

// Só encontra a tarefa se o quadro dela pertencer ao usuário
export async function buscarTarefaDoUsuario({ id, userId }) {
    return prisma.tarefa.findFirst({
        where: { id, lista: { quadro: { usuarioId: userId } } },
        select: {
            ...camposDaTarefa,
            lista: { select: { quadroId: true } }
        }
    });
}

export async function atualizarTarefa({ id, dados }) {
    return prisma.tarefa.update({
        where: { id },
        data: dados,
        select: camposDaTarefa
    });
}

// Move a tarefa para outra posição, na mesma lista ou em outra lista,
// reordenando as tarefas das listas envolvidas
export async function moverTarefa({ id, listaDeOrigemId, listaDeDestinoId, posicao }) {
    return prisma.$transaction(async (tx) => {
        if (listaDeOrigemId !== listaDeDestinoId) {
            await renumerarTarefas(tx, listaDeOrigemId, (ids) => ids.filter((idDaTarefa) => idDaTarefa !== id));
        }

        await renumerarTarefas(tx, listaDeDestinoId, (ids) => inserirNaPosicao(ids, id, posicao));

        return tx.tarefa.findUnique({ where: { id }, select: camposDaTarefa });
    });
}

// O banco apaga em cascata as subtarefas, comentários e atribuições
export async function apagarTarefa(id) {
    return prisma.tarefa.delete({
        where: { id },
        select: camposDaTarefa
    });
}

async function renumerarTarefas(tx, listaId, definirNovaOrdem) {
    const tarefas = await tx.tarefa.findMany({
        where: { listaId },
        orderBy: { posicao: 'asc' },
        select: { id: true }
    });

    const novaOrdem = definirNovaOrdem(tarefas.map((tarefa) => tarefa.id));

    for (const [indice, idDaTarefa] of novaOrdem.entries()) {
        await tx.tarefa.update({
            where: { id: idDaTarefa },
            data: { listaId, posicao: indice }
        });
    }
}
