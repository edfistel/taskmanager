import express from 'express';
import { prisma } from '../config/database.js';
import { autenticarServicoInterno } from '../middlewares/internalServiceMiddleware.js';

const router = express.Router();
router.use(autenticarServicoInterno);

router.delete('/users/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ erro: 'ID de usuário inválido' });

    await prisma.$transaction([
        prisma.quadro.deleteMany({ where: { usuarioId: id } }),
        prisma.comentario.deleteMany({ where: { usuarioId: id } }),
        prisma.atribuirTarefa.deleteMany({ where: { usuarioId: id } }),
    ]);
    return res.status(204).end();
});

export default router;
