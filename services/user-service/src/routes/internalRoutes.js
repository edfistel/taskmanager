import { Router } from 'express';
import { autenticarServicoInterno } from '../middlewares/internalServiceMiddleware.js';
import * as userService from './users/userService.js';

const router = Router();
router.use(autenticarServicoInterno);

router.post('/users/by-email', async (req, res) => {
    const email = req.body?.email;
    if (typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({ success: false, message: 'E-mail inválido' });
    }

    try {
        const usuario = await userService.buscarUsuarioPorEmail(email);
        if (!usuario) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        return res.status(200).json({ success: true, body: usuario });
    } catch (error) {
        const status = ['O email precisa ser preenchido', 'Digite um email válido'].includes(error.message) ? 400 : 500;
        if (status >= 500) console.error(error);
        return res.status(status).json({ success: false, message: status >= 500 ? 'Falha ao consultar usuário' : error.message });
    }
});

router.post('/users/by-ids', async (req, res) => {
    const ids = req.body?.ids;
    if (!Array.isArray(ids) || ids.some((id) => !Number.isInteger(id) || id < 1)) {
        return res.status(400).json({ success: false, message: 'IDs de usuário inválidos' });
    }

    try {
        const usuarios = await userService.buscarUsuariosPorIds(ids);
        return res.status(200).json({ success: true, body: usuarios });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Falha ao consultar usuários' });
    }
});

router.post('/authenticate', async (req, res) => {
    try {
        const { email, senha } = req.body || {};
        const usuario = await userService.autenticarCredenciais(email, senha);
        return res.status(200).json({ success: true, body: usuario });
    } catch (error) {
        const status = error.status || 500;
        if (status >= 500) console.error(error);
        return res.status(status).json({ success: false, message: status >= 500 ? 'Falha ao autenticar usuário' : error.message });
    }
});

router.get('/users/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ success: false, message: 'ID de usuário inválido' });

    try {
        const usuario = await userService.buscarUsuarioPorId(id);
        if (!usuario) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        return res.status(200).json({ success: true, body: usuario });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Falha ao consultar usuário' });
    }
});

export default router;
