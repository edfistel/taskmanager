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

export async function provisionarUsuario({ id, nome, email }) {
    return prisma.usuario.upsert({
        where: { id },
        create: { id, nome, email },
        update: { nome, email },
        select: camposPublicos
    });
}

export async function removerUsuarioInterno(id) {
    return prisma.usuario.deleteMany({ where: { id } });
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
