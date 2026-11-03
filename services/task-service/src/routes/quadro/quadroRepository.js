import { prisma } from '../../config/database.js';

const camposDoQuadro = {
    id: true,
    nome: true,
    descricao: true,
    criadoEm: true
};

// Cria o quadro e a lista padrão juntos: se um falhar, nenhum é gravado
export async function criarQuadro({ userId, nome, descricao, nomeDaListaPadrao }) {
    return prisma.quadro.create({
        data: {
            usuarioId: userId,
            nome,
            descricao,
            listas: {
                create: { nome: nomeDaListaPadrao, posicao: 0 }
            }
        },
        select: {
            ...camposDoQuadro,
            listas: {
                select: { id: true, nome: true, posicao: true },
                orderBy: { posicao: 'asc' }
            }
        }
    });
}

export async function listarQuadrosDoUsuario(userId) {
    return prisma.quadro.findMany({
        where: { usuarioId: userId },
        orderBy: { criadoEm: 'asc' },
        select: camposDoQuadro
    });
}

export async function buscarQuadroDoUsuario({ id, userId }) {
    return prisma.quadro.findFirst({
        where: { id, usuarioId: userId },
        select: camposDoQuadro
    });
}

export async function atualizarQuadro({ id, dados }) {
    return prisma.quadro.update({
        where: { id },
        data: dados,
        select: camposDoQuadro
    });
}

// O banco apaga em cascata as listas, tarefas, subtarefas, comentários e atribuições
export async function apagarQuadro(id) {
    return prisma.quadro.delete({
        where: { id },
        select: camposDoQuadro
    });
}
