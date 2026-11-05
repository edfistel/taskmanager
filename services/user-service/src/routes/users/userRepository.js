import { prisma } from '../../config/database.js';

// Campos seguros para devolver na API (nunca inclui a senha)
const camposPublicos = {
    id: true,
    nome: true,
    email: true
};

// O banco apaga em cascata os quadros (com tudo dentro), comentários, atribuições e tokens
export async function apagarUsuario(id) {
    return prisma.usuario.delete({
        where: { id },
        select: camposPublicos
    });
}

export async function alterarNome({ id, nome }) {
    return prisma.usuario.update({
        where: { id },
        data: { nome },
        select: camposPublicos
    });
}

export async function criarUsuario({ nome, email, senha }) {
    return prisma.usuario.create({
        data: { nome, email, senha },
        select: camposPublicos
    });
}

export async function alterarSenha({ id, senha }) {
    return prisma.usuario.update({
        where: { id },
        data: { senha },
        select: { id: true }
    });
}

export async function buscarUsuarioPorId(id) {
    return prisma.usuario.findUnique({
        where: { id },
        select: camposPublicos
    });
}

export async function buscarUsuarioPorEmail(email) {
    return prisma.usuario.findUnique({
        where: { email },
        select: camposPublicos
    });
}

export async function buscarCredenciaisPorEmail(email) {
    return prisma.usuario.findUnique({
        where: { email },
        select: { id: true, nome: true, email: true, senha: true }
    });
}

export async function buscarCredenciaisPorId(id) {
    return prisma.usuario.findUnique({
        where: { id },
        select: { id: true, senha: true }
    });
}

export async function buscarUsuariosPorIds(ids) {
    return prisma.usuario.findMany({
        where: { id: { in: ids } },
        select: camposPublicos
    });
}
