import { prisma } from '../../config/database.js';

const camposDaAtribuicao = {
    id: true,
    atribuidoEm: true,
    tarefaId: true,
    usuario: { select: { id: true, nome: true, email: true } }
};

// Códigos de erro do Prisma: registro repetido e registro não encontrado
const REGISTRO_REPETIDO = 'P2002';
const REGISTRO_NAO_ENCONTRADO = 'P2025';

export async function buscarIdDoUsuarioPorEmail(email) {
    return prisma.usuario.findUnique({
        where: { email },
        select: { id: true }
    });
}

// Devolve null se o usuário já estiver atribuído à tarefa
export async function atribuirUsuario({ tarefaId, usuarioId }) {
    try {
        return await prisma.atribuirTarefa.create({
            data: { tarefaId, usuarioId },
            select: camposDaAtribuicao
        });
    } catch (error) {
        if (error.code === REGISTRO_REPETIDO) {
            return null;
        }

        throw error;
    }
}

export async function listarAtribuicoesDaTarefa(tarefaId) {
    return prisma.atribuirTarefa.findMany({
        where: { tarefaId },
        orderBy: { atribuidoEm: 'asc' },
        select: camposDaAtribuicao
    });
}

// Devolve null se o usuário não estiver atribuído à tarefa
export async function removerAtribuicao({ tarefaId, usuarioId }) {
    try {
        return await prisma.atribuirTarefa.delete({
            where: { tarefaId_usuarioId: { tarefaId, usuarioId } },
            select: camposDaAtribuicao
        });
    } catch (error) {
        if (error.code === REGISTRO_NAO_ENCONTRADO) {
            return null;
        }

        throw error;
    }
}

// Tarefas atribuídas ao usuário, com a lista e o quadro de cada uma
export async function listarAtribuicoesDoUsuario(usuarioId) {
    return prisma.atribuirTarefa.findMany({
        where: { usuarioId },
        orderBy: { atribuidoEm: 'desc' },
        select: {
            atribuidoEm: true,
            tarefa: {
                select: {
                    id: true,
                    titulo: true,
                    status: true,
                    prazo: true,
                    lista: {
                        select: {
                            id: true,
                            nome: true,
                            quadro: { select: { id: true, nome: true } }
                        }
                    }
                }
            }
        }
    });
}
