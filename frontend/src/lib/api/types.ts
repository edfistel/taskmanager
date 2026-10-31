export type StatusTarefa = "A_FAZER" | "EM_ANDAMENTO" | "CONCLUIDO";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
}

export interface Quadro {
  id: number;
  nome: string;
  descricao: string | null;
  criadoEm: string;
}

export interface Lista {
  id: number;
  nome: string;
  posicao: number;
  quadroId: number;
}

export interface QuadroCriado extends Quadro {
  listas: Array<Pick<Lista, "id" | "nome" | "posicao">>;
}

export interface TarefaResumo {
  id: number;
  titulo: string;
  prazo: string | null;
  posicao: number;
  status: StatusTarefa;
}

export interface ListaComTarefas extends Lista {
  tarefas: TarefaResumo[];
}

export interface TarefaDetalhe extends TarefaResumo {
  descricao: string | null;
  listaId: number;
  lista?: {
    quadroId: number;
  };
}

export interface Subtarefa {
  id: number;
  titulo: string;
  concluida: boolean;
  tarefaId: number;
}

export interface Comentario {
  id: number;
  texto: string;
  criadoEm: string;
  tarefaId: number;
  usuarioId: number;
  usuario: Pick<Usuario, "id" | "nome">;
}

export interface Atribuicao {
  id: number;
  atribuidoEm: string;
  tarefaId: number;
  usuario: Usuario;
}

export interface MinhaAtribuicao {
  atribuidoEm: string;
  tarefa: Pick<TarefaResumo, "id" | "titulo" | "status" | "prazo"> & {
    lista: Pick<Lista, "id" | "nome"> & {
      quadro: Pick<Quadro, "id" | "nome">;
    };
  };
}

export interface AuthResponse {
  usuario: Usuario;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface CriarTarefaInput {
  titulo: string;
  descricao?: string | null;
  prazo?: string | null;
  status?: StatusTarefa;
}

export type AtualizarTarefaInput = Partial<CriarTarefaInput>;
