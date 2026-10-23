import * as subtarefaRepository from './subtarefaRepository.js';
import * as tarefaService from '../tarefa/tarefaService.js';
import {
    ErroDePermissao,
    validarId,
    validarTextoObrigatorio,
    validarBooleano
} from '../../tools/validacao.js';

const TAMANHO_MAXIMO_DO_TITULO = 200;

export async function criarSubtarefa({ userId, tarefaId, titulo }) {
    const tituloValidado = validarTitulo(titulo);
    const tarefa = await tarefaService.buscarTarefaComAcesso({ tarefaId, userId });

    if (!tarefa) {
        return null;
    }

    exigirDono(tarefa, 'Só o dono do quadro pode criar subtarefas');

    return subtarefaRepository.criarSubtarefa({ tarefaId: tarefa.id, titulo: tituloValidado });
}

export async function listarSubtarefasDaTarefa({ userId, tarefaId }) {
    const tarefa = await tarefaService.buscarTarefaComAcesso({ tarefaId, userId });

    if (!tarefa) {
        return null;
    }

    return subtarefaRepository.listarSubtarefasDaTarefa(tarefa.id);
}

export async function renomearSubtarefa({ id, userId, titulo }) {
    const tituloValidado = validarTitulo(titulo);
    const encontrada = await buscarSubtarefaComAcesso({ id, userId });

    if (!encontrada) {
        return null;
    }

    exigirDono(encontrada.tarefa, 'Só o dono do quadro pode renomear subtarefas');

    return subtarefaRepository.atualizarSubtarefa({
        id: encontrada.subtarefa.id,
        dados: { titulo: tituloValidado }
    });
}

// marcarConcluida() do diagrama: o dono e quem está atribuído à tarefa podem marcar.
// Sem "concluida" no corpo, marca como concluída; com false, reabre.
export async function marcarConcluida({ id, userId, concluida }) {
    const valor = concluida === undefined ? true : validarBooleano(concluida, { campo: 'O campo concluida' });
    const encontrada = await buscarSubtarefaComAcesso({ id, userId });

    if (!encontrada) {
        return null;
    }

    return subtarefaRepository.atualizarSubtarefa({
        id: encontrada.subtarefa.id,
        dados: { concluida: valor }
    });
}

export async function apagarSubtarefa({ id, userId }) {
    const encontrada = await buscarSubtarefaComAcesso({ id, userId });

    if (!encontrada) {
        return null;
    }

    exigirDono(encontrada.tarefa, 'Só o dono do quadro pode apagar subtarefas');

    return subtarefaRepository.apagarSubtarefa(encontrada.subtarefa.id);
}

// Quem não tem acesso à tarefa recebe null (404), sem saber que a subtarefa existe
async function buscarSubtarefaComAcesso({ id, userId }) {
    const idDaSubtarefa = validarId(id, 'da subtarefa');
    const subtarefa = await subtarefaRepository.buscarSubtarefa(idDaSubtarefa);

    if (!subtarefa) {
        return null;
    }

    const tarefa = await tarefaService.buscarTarefaComAcesso({ tarefaId: subtarefa.tarefaId, userId });

    if (!tarefa) {
        return null;
    }

    return { subtarefa, tarefa };
}

function exigirDono(tarefa, mensagem) {
    if (!tarefa.ehDono) {
        throw new ErroDePermissao(mensagem);
    }
}

function validarTitulo(titulo) {
    return validarTextoObrigatorio(titulo, {
        campo: 'O título da subtarefa',
        tamanhoMaximo: TAMANHO_MAXIMO_DO_TITULO
    });
}
