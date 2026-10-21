import * as quadroService from './quadroService.js';
import { responderErro } from '../../tools/responderErro.js';

export async function criarQuadro(req, res) {
    try {
        const userId = req.user.id;
        const { nome, descricao } = req.body;

        const quadro = await quadroService.criarQuadro({ userId, nome, descricao });

        return res.status(201).json({ success: true, body: quadro });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function listarMeusQuadros(req, res) {
    try {
        const userId = req.user.id;

        const quadros = await quadroService.listarMeusQuadros(userId);

        return res.status(200).json({ success: true, body: quadros });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function buscarQuadro(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const quadro = await quadroService.buscarQuadro({ id, userId });

        if (!quadro) {
            return res.status(404).json({ success: false, message: 'Quadro não encontrado' });
        }

        return res.status(200).json({ success: true, body: quadro });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function atualizarQuadro(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { nome, descricao } = req.body;

        const quadro = await quadroService.atualizarQuadro({ id, userId, nome, descricao });

        if (!quadro) {
            return res.status(404).json({ success: false, message: 'Quadro não encontrado' });
        }

        return res.status(200).json({ success: true, body: quadro });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function apagarQuadro(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const quadro = await quadroService.apagarQuadro({ id, userId });

        if (!quadro) {
            return res.status(404).json({ success: false, message: 'Quadro não encontrado' });
        }

        return res.status(200).json({ success: true, message: 'Quadro apagado com sucesso' });

    } catch (error) {
        return responderErro(res, error);
    }
}
