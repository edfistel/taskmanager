// Erro causado por dado inválido enviado pelo cliente (vira status 400)
export class ErroDeValidacao extends Error {}

// rotulo: como o recurso aparece na mensagem, ex.: 'do quadro', 'da lista'
export function validarId(id, rotulo) {
    const idNumerico = Number(id);

    if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
        throw new ErroDeValidacao(`Id ${rotulo} inválido`);
    }

    return idNumerico;
}

// campo: como o campo aparece na mensagem, ex.: 'O nome do quadro'
export function validarTextoObrigatorio(valor, { campo, tamanhoMaximo }) {
    if (typeof valor !== 'string' || valor.trim().length === 0) {
        throw new ErroDeValidacao(`${campo} precisa ser preenchido`);
    }

    const valorNormalizado = valor.trim();

    if (valorNormalizado.length > tamanhoMaximo) {
        throw new ErroDeValidacao(`${campo} pode ter no máximo ${tamanhoMaximo} caracteres`);
    }

    return valorNormalizado;
}

// Texto vazio, null ou ausente vira null
export function normalizarTextoOpcional(valor, { campo }) {
    if (valor === undefined || valor === null) {
        return null;
    }

    if (typeof valor !== 'string') {
        throw new ErroDeValidacao(`${campo} precisa ser um texto`);
    }

    const valorNormalizado = valor.trim();

    return valorNormalizado.length > 0 ? valorNormalizado : null;
}

export function validarPosicao(posicao) {
    if (!Number.isInteger(posicao) || posicao < 0) {
        throw new ErroDeValidacao('A posição precisa ser um número inteiro maior ou igual a zero');
    }

    return posicao;
}
