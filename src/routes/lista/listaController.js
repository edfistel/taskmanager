import * as listaService from './listaService.js';
import { responderErro } from '../../tools/responderErro.js';

export async function criarLista(req, res) {
    try {
        const userId = req.user.id;
        const { quadroId } = req.params;
        const { nome } = req.body;

        const lista = await listaService.criarLista({ userId, quadroId, nome });

        if (!lista) {
            return res.status(404).json({ success: false, message: 'Quadro não encontrado' });
        }

        return res.status(201).json({ success: true, body: lista });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function listarListasDoQuadro(req, res) {
    try {
        const userId = req.user.id;
        const { quadroId } = req.params;

        const listas = await listaService.listarListasDoQuadro({ userId, quadroId });

        if (!listas) {
            return res.status(404).json({ success: false, message: 'Quadro não encontrado' });
        }

        return res.status(200).json({ success: true, body: listas });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function renomearLista(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { nome } = req.body;

        const lista = await listaService.renomearLista({ id, userId, nome });

        if (!lista) {
            return res.status(404).json({ success: false, message: 'Lista não encontrada' });
        }

        return res.status(200).json({ success: true, body: lista });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function moverLista(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { posicao } = req.body;

        const lista = await listaService.moverLista({ id, userId, posicao });

        if (!lista) {
            return res.status(404).json({ success: false, message: 'Lista não encontrada' });
        }

        return res.status(200).json({ success: true, body: lista });

    } catch (error) {
        return responderErro(res, error);
    }
}

export async function apagarLista(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const lista = await listaService.apagarLista({ id, userId });

        if (!lista) {
            return res.status(404).json({ success: false, message: 'Lista não encontrada' });
        }

        return res.status(200).json({ success: true, message: 'Lista apagada com sucesso' });

    } catch (error) {
        return responderErro(res, error);
    }
}
