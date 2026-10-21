import * as tarefaService from './tarefaService.js';
import { responderErro } from '../../tools/responderErro.js';

export async function criarTarefa(req, res) {
    try {
        const userId = req.user.id;
        const { listaId } = req.params;
        const { titulo, descricao, prazo, status } = req.body;

        const tarefa = await tarefaService.criarTarefa({ userId, listaId, titulo, descricao, prazo, status });

        if (!tarefa) {
            return res.status(404).json({ success: false, message: 'Lista não encontrada' });
        }

        return res.status(201).json({ success: true, body: tarefa });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function listarTarefasDaLista(req, res) {
    try {
        const userId = req.user.id;
        const { listaId } = req.params;

        const tarefas = await tarefaService.listarTarefasDaLista({ userId, listaId });

        if (!tarefas) {
            return res.status(404).json({ success: false, message: 'Lista não encontrada' });
        }

        return res.status(200).json({ success: true, body: tarefas });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function buscarTarefa(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const tarefa = await tarefaService.buscarTarefa({ id, userId });

        if (!tarefa) {
            return res.status(404).json({ success: false, message: 'Tarefa não encontrada' });
        }

        return res.status(200).json({ success: true, body: tarefa });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function atualizarTarefa(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { titulo, descricao, prazo, status } = req.body;

        const tarefa = await tarefaService.atualizarTarefa({ id, userId, titulo, descricao, prazo, status });

        if (!tarefa) {
            return res.status(404).json({ success: false, message: 'Tarefa não encontrada' });
        }

        return res.status(200).json({ success: true, body: tarefa });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function moverTarefa(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { listaId, posicao } = req.body;

        const tarefa = await tarefaService.moverTarefa({ id, userId, listaId, posicao });

        if (!tarefa) {
            return res.status(404).json({ success: false, message: 'Tarefa não encontrada' });
        }

        return res.status(200).json({ success: true, body: tarefa });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function apagarTarefa(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const tarefa = await tarefaService.apagarTarefa({ id, userId });

        if (!tarefa) {
            return res.status(404).json({ success: false, message: 'Tarefa não encontrada' });
        }

        return res.status(200).json({ success: true, message: 'Tarefa apagada com sucesso' });

    } catch (error) {
        return responderErro(res, error);
    }
}
