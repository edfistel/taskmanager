import { prisma } from '../../config/database.js';

const camposDaSubtarefa = {
    id: true,
    titulo: true,
    concluida: true,
    tarefaId: true
};

export async function criarSubtarefa({ tarefaId, titulo }) {
    return prisma.subtarefa.create({
        data: { tarefaId, titulo },
        select: camposDaSubtarefa
    });
}

export async function listarSubtarefasDaTarefa(tarefaId) {
    return prisma.subtarefa.findMany({
        where: { tarefaId },
        orderBy: { id: 'asc' },
        select: camposDaSubtarefa
    });
}

export async function buscarSubtarefa(id) {
    return prisma.subtarefa.findUnique({
        where: { id },
        select: camposDaSubtarefa
    });
}

export async function atualizarSubtarefa({ id, dados }) {
    return prisma.subtarefa.update({
        where: { id },
        data: dados,
        select: camposDaSubtarefa
    });
}

export async function apagarSubtarefa(id) {
    return prisma.subtarefa.delete({
        where: { id },
        select: camposDaSubtarefa
    });
}
