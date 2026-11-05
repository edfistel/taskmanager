import * as comentarioService from './comentarioService.js';
import { responderErro } from '../../tools/responderErro.js';

export async function escreverComentario(req, res) {
    try {
        const userId = req.user.id;
        const { tarefaId } = req.params;
        const { texto } = req.body;

        const comentario = await comentarioService.escreverComentario({ userId, tarefaId, texto });

        if (!comentario) {
            return res.status(404).json({ success: false, message: 'Tarefa não encontrada' });
        }

        return res.status(201).json({ success: true, body: comentario });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function listarComentariosDaTarefa(req, res) {
    try {
        const userId = req.user.id;
        const { tarefaId } = req.params;

        const comentarios = await comentarioService.listarComentariosDaTarefa({ userId, tarefaId });

        if (!comentarios) {
            return res.status(404).json({ success: false, message: 'Tarefa não encontrada' });
        }

        return res.status(200).json({ success: true, body: comentarios });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function editarComentario(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { texto } = req.body;

        const comentario = await comentarioService.editarComentario({ id, userId, texto });

        if (!comentario) {
            return res.status(404).json({ success: false, message: 'Comentário não encontrado' });
        }

        return res.status(200).json({ success: true, body: comentario });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function excluirComentario(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const comentario = await comentarioService.excluirComentario({ id, userId });

        if (!comentario) {
            return res.status(404).json({ success: false, message: 'Comentário não encontrado' });
        }

        return res.status(200).json({ success: true, message: 'Comentário excluído com sucesso' });

    } catch (error) {
        return responderErro(res, error);
    }
}
