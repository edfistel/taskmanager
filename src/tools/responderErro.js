import { ErroDeValidacao, ErroDePermissao } from './validacao.js';

// Dado inválido vira 400, ação não permitida vira 403; qualquer outro erro vira 500 sem expor detalhes
export function responderErro(res, error) {
    if (error instanceof ErroDeValidacao) {
        return res.status(400).json({ success: false, message: error.message });
    }

    if (error instanceof ErroDePermissao) {
        return res.status(403).json({ success: false, message: error.message });
    }

    console.error(error);

    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
}
