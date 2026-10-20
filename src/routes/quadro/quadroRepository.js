import { prisma } from '../../config/database.js';

const camposDoQuadro = {
    id: true,
    name: true,
    description: true,
    createdAt: true,
    updatedAt: true
};

export async function criarQuadro({ userId, nome, descricao }) {
    return prisma.frame.create({
        data: { userId, name: nome, description: descricao },
        select: camposDoQuadro
    });
}

export async function listarQuadrosDoUsuario(userId) {
    return prisma.frame.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: camposDoQuadro
    });
}

export async function buscarQuadroDoUsuario({ id, userId }) {
    return prisma.frame.findFirst({
        where: { id, userId },
        select: camposDoQuadro
    });
}

export async function atualizarQuadro({ id, dados }) {
    return prisma.frame.update({
        where: { id },
        data: dados,
        select: camposDoQuadro
    });
}

export async function apagarQuadro(id) {
    return prisma.frame.delete({
        where: { id },
        select: camposDoQuadro
    });
}
