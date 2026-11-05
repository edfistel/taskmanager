import * as comentarioRepository from './comentarioRepository.js';
import * as tarefaService from '../tarefa/tarefaService.js';
import { buscarUsuariosPorIds } from '../../clients/userServiceClient.js';
import { ErroDePermissao, validarId, validarTextoObrigatorio } from '../../tools/validacao.js';

const TAMANHO_MAXIMO_DO_TEXTO = 2000;

// O dono do quadro e quem está atribuído à tarefa podem comentar
export async function escreverComentario({ userId, tarefaId, texto }) {
    const textoValidado = validarTexto(texto);
    const tarefa = await tarefaService.buscarTarefaComAcesso({ tarefaId, userId });

    if (!tarefa) {
        return null;
    }

    const comentario = await comentarioRepository.criarComentario({
        tarefaId: tarefa.id,
        usuarioId: userId,
        texto: textoValidado
    });
    return (await incluirUsuarios([comentario]))[0];
}

export async function listarComentariosDaTarefa({ userId, tarefaId }) {
    const tarefa = await tarefaService.buscarTarefaComAcesso({ tarefaId, userId });

    if (!tarefa) {
        return null;
    }

    const comentarios = await comentarioRepository.listarComentariosDaTarefa(tarefa.id);
    return incluirUsuarios(comentarios);
}

// editar() do diagrama: só o autor pode alterar o próprio comentário
export async function editarComentario({ id, userId, texto }) {
    const textoValidado = validarTexto(texto);
    const encontrado = await buscarComentarioComAcesso({ id, userId });

    if (!encontrado) {
        return null;
    }

    if (encontrado.comentario.usuarioId !== userId) {
        throw new ErroDePermissao('Só o autor pode editar o comentário');
    }

    const comentario = await comentarioRepository.editarComentario({ id: encontrado.comentario.id, texto: textoValidado });
    return (await incluirUsuarios([comentario]))[0];
}

// excluir() do diagrama: o autor ou o dono do quadro podem excluir
export async function excluirComentario({ id, userId }) {
    const encontrado = await buscarComentarioComAcesso({ id, userId });

    if (!encontrado) {
        return null;
    }

    const ehAutor = encontrado.comentario.usuarioId === userId;

    if (!ehAutor && !encontrado.tarefa.ehDono) {
        throw new ErroDePermissao('Só o autor ou o dono do quadro podem excluir o comentário');
    }

    const comentario = await comentarioRepository.excluirComentario(encontrado.comentario.id);
    return (await incluirUsuarios([comentario]))[0];
}

// Quem não tem acesso à tarefa recebe null (404), sem saber que o comentário existe
async function buscarComentarioComAcesso({ id, userId }) {
    const idDoComentario = validarId(id, 'do comentário');
    const comentario = await comentarioRepository.buscarComentario(idDoComentario);

    if (!comentario) {
        return null;
    }

    const tarefa = await tarefaService.buscarTarefaComAcesso({ tarefaId: comentario.tarefaId, userId });

    if (!tarefa) {
        return null;
    }

    return { comentario, tarefa };
}

function validarTexto(texto) {
    return validarTextoObrigatorio(texto, {
        campo: 'O texto do comentário',
        tamanhoMaximo: TAMANHO_MAXIMO_DO_TEXTO
    });
}

async function incluirUsuarios(comentarios) {
    if (comentarios.length === 0) return comentarios;

    const ids = [...new Set(comentarios.map(({ usuarioId }) => usuarioId))];
    const usuarios = await buscarUsuariosPorIds(ids);
    const usuariosPorId = new Map(usuarios.map((usuario) => [usuario.id, usuario]));

    return comentarios.map((comentario) => {
        const usuario = usuariosPorId.get(comentario.usuarioId);
        return {
            ...comentario,
            usuario: usuario ? { id: usuario.id, nome: usuario.nome } : null,
        };
    });
}
