import { prisma } from '../../config/database.js';

const camposDoComentario = {
    id: true,
    texto: true,
    criadoEm: true,
    tarefaId: true,
    usuarioId: true,
    usuario: { select: { id: true, nome: true } }
};

export async function criarComentario({ tarefaId, usuarioId, texto }) {
    return prisma.comentario.create({
        data: { tarefaId, usuarioId, texto },
        select: camposDoComentario
    });
}

export async function listarComentariosDaTarefa(tarefaId) {
    return prisma.comentario.findMany({
        where: { tarefaId },
        orderBy: { criadoEm: 'asc' },
        select: camposDoComentario
    });
}

export async function buscarComentario(id) {
    return prisma.comentario.findUnique({
        where: { id },
        select: camposDoComentario
    });
}

export async function editarComentario({ id, texto }) {
    return prisma.comentario.update({
        where: { id },
        data: { texto },
        select: camposDoComentario
    });
}

export async function excluirComentario(id) {
    return prisma.comentario.delete({
        where: { id },
        select: camposDoComentario
    });
}
