import * as atribuicaoRepository from './atribuicaoRepository.js';
import * as tarefaService from '../tarefa/tarefaService.js';
import { buscarUsuarioPorEmail, buscarUsuariosPorIds } from '../../clients/userServiceClient.js';
import {
    ErroDeValidacao,
    ErroDePermissao,
    validarId,
    validarEmail
} from '../../tools/validacao.js';

// Só o dono do quadro atribui; o usuário é encontrado pelo e-mail
export async function atribuirUsuario({ userId, tarefaId, email }) {
    const emailValidado = validarEmail(email);
    const tarefa = await tarefaService.buscarTarefaComAcesso({ tarefaId, userId });

    if (!tarefa) {
        return null;
    }

    exigirDono(tarefa, 'Só o dono do quadro pode atribuir a tarefa');

    const usuario = await buscarUsuarioPorEmail(emailValidado);

    if (!usuario) {
        throw new ErroDeValidacao('Nenhum usuário cadastrado com este e-mail');
    }

    const atribuicao = await atribuicaoRepository.atribuirUsuario({ tarefaId: tarefa.id, usuarioId: usuario.id });

    if (!atribuicao) {
        throw new ErroDeValidacao('Este usuário já está atribuído à tarefa');
    }

    const { usuarioId, ...dadosDaAtribuicao } = atribuicao;
    return { ...dadosDaAtribuicao, usuario };
}

export async function listarAtribuicoesDaTarefa({ userId, tarefaId }) {
    const tarefa = await tarefaService.buscarTarefaComAcesso({ tarefaId, userId });

    if (!tarefa) {
        return null;
    }

    const atribuicoes = await atribuicaoRepository.listarAtribuicoesDaTarefa(tarefa.id);
    return incluirUsuarios(atribuicoes);
}

export async function removerAtribuicao({ userId, tarefaId, usuarioId }) {
    const idDoUsuario = validarId(usuarioId, 'do usuário');
    const tarefa = await tarefaService.buscarTarefaComAcesso({ tarefaId, userId });

    if (!tarefa) {
        return null;
    }

    exigirDono(tarefa, 'Só o dono do quadro pode remover a atribuição');

    return atribuicaoRepository.removerAtribuicao({ tarefaId: tarefa.id, usuarioId: idDoUsuario });
}

export async function listarMinhasAtribuicoes(userId) {
    return atribuicaoRepository.listarAtribuicoesDoUsuario(userId);
}

function exigirDono(tarefa, mensagem) {
    if (!tarefa.ehDono) {
        throw new ErroDePermissao(mensagem);
    }
}

async function incluirUsuarios(atribuicoes) {
    if (atribuicoes.length === 0) return atribuicoes;

    const ids = [...new Set(atribuicoes.map(({ usuarioId }) => usuarioId))];
    const usuarios = await buscarUsuariosPorIds(ids);
    const usuariosPorId = new Map(usuarios.map((usuario) => [usuario.id, usuario]));

    return atribuicoes.map(({ usuarioId, ...atribuicao }) => ({
        ...atribuicao,
        usuario: usuariosPorId.get(usuarioId) || null,
    }));
}
