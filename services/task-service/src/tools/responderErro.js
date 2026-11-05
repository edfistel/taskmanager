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
    const status = Number.isInteger(error.status) && error.status >= 500 && error.status < 600 ? error.status : 500;
    return res.status(status).json({ success: false, message: status === 503 ? 'Serviço dependente indisponível' : 'Erro interno do servidor' });
}
