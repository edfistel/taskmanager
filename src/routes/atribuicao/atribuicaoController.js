import * as atribuicaoService from './atribuicaoService.js';
import { responderErro } from '../../tools/responderErro.js';

export async function atribuirUsuario(req, res) {
    try {
        const userId = req.user.id;
        const { tarefaId } = req.params;
        const { email } = req.body;

        const atribuicao = await atribuicaoService.atribuirUsuario({ userId, tarefaId, email });

        if (!atribuicao) {
            return res.status(404).json({ success: false, message: 'Tarefa não encontrada' });
        }

        return res.status(201).json({ success: true, body: atribuicao });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function listarAtribuicoesDaTarefa(req, res) {
    try {
        const userId = req.user.id;
        const { tarefaId } = req.params;

        const atribuicoes = await atribuicaoService.listarAtribuicoesDaTarefa({ userId, tarefaId });

        if (!atribuicoes) {
            return res.status(404).json({ success: false, message: 'Tarefa não encontrada' });
        }

        return res.status(200).json({ success: true, body: atribuicoes });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function removerAtribuicao(req, res) {
    try {
        const userId = req.user.id;
        const { tarefaId, usuarioId } = req.params;

        const atribuicao = await atribuicaoService.removerAtribuicao({ userId, tarefaId, usuarioId });

        if (!atribuicao) {
            return res.status(404).json({ success: false, message: 'Tarefa ou atribuição não encontrada' });
        }

        return res.status(200).json({ success: true, message: 'Atribuição removida com sucesso' });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function listarMinhasAtribuicoes(req, res) {
    try {
        const userId = req.user.id;

        const atribuicoes = await atribuicaoService.listarMinhasAtribuicoes(userId);

        return res.status(200).json({ success: true, body: atribuicoes });

    } catch (error) {
        return responderErro(res, error);
    }
}
