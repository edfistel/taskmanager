import * as subtarefaService from './subtarefaService.js';
import { responderErro } from '../../tools/responderErro.js';

export async function criarSubtarefa(req, res) {
    try {
        const userId = req.user.id;
        const { tarefaId } = req.params;
        const { titulo } = req.body;

        const subtarefa = await subtarefaService.criarSubtarefa({ userId, tarefaId, titulo });

        if (!subtarefa) {
            return res.status(404).json({ success: false, message: 'Tarefa não encontrada' });
        }

        return res.status(201).json({ success: true, body: subtarefa });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function listarSubtarefasDaTarefa(req, res) {
    try {
        const userId = req.user.id;
        const { tarefaId } = req.params;

        const subtarefas = await subtarefaService.listarSubtarefasDaTarefa({ userId, tarefaId });

        if (!subtarefas) {
            return res.status(404).json({ success: false, message: 'Tarefa não encontrada' });
        }

        return res.status(200).json({ success: true, body: subtarefas });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function renomearSubtarefa(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { titulo } = req.body;

        const subtarefa = await subtarefaService.renomearSubtarefa({ id, userId, titulo });

        if (!subtarefa) {
            return res.status(404).json({ success: false, message: 'Subtarefa não encontrada' });
        }

        return res.status(200).json({ success: true, body: subtarefa });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function marcarConcluida(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { concluida } = req.body ?? {};

        const subtarefa = await subtarefaService.marcarConcluida({ id, userId, concluida });

        if (!subtarefa) {
            return res.status(404).json({ success: false, message: 'Subtarefa não encontrada' });
        }

        return res.status(200).json({ success: true, body: subtarefa });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function apagarSubtarefa(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const subtarefa = await subtarefaService.apagarSubtarefa({ id, userId });

        if (!subtarefa) {
            return res.status(404).json({ success: false, message: 'Subtarefa não encontrada' });
        }

        return res.status(200).json({ success: true, message: 'Subtarefa apagada com sucesso' });

    } catch (error) {
        return responderErro(res, error);
    }
}
