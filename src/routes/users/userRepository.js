import { prisma } from '../../config/database.js';

// Campos seguros para devolver na API (nunca inclui a senha)
const camposPublicos = {
    id: true,
    nome: true,
    email: true
};

// Campos usados internamente para autenticar (inclui o hash da senha)
const camposParaAutenticar = {
    ...camposPublicos,
    senha: true
};

export async function criarUsuario({ nome, email, senhaHash }) {
    return prisma.usuario.create({
        data: { nome, email, senha: senhaHash },
        select: camposPublicos
    });
}

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

export async function alterarSenha({ id, senhaHash }) {
    return prisma.usuario.update({
        where: { id },
        data: { senha: senhaHash },
        select: { id: true }
    });
}

export async function buscarUsuarioPorId(id) {
    return prisma.usuario.findUnique({
        where: { id },
        select: camposParaAutenticar
    });
}

export async function buscarUsuarioPorEmail(email) {
    return prisma.usuario.findUnique({
        where: { email },
        select: camposParaAutenticar
    });
}
