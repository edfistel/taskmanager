import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { EmptyState } from "../../components/feedback/EmptyState";
import { ErrorState } from "../../components/feedback/ErrorState";
import { queryKeys } from "../../lib/api/queryKeys";
import { formatApiDate, normalizeApiDate } from "../../lib/date";
import { TaskDetailsDrawer } from "../tasks/TaskDetailsDrawer";
import { TasksApi } from "../tasks/tasksApi";
import { AssignmentsApi } from "./assignmentsApi";
import { resolveAssignmentAccess } from "./access";
import styles from "./assignments.module.css";

const statusLabels = { A_FAZER: "A fazer", EM_ANDAMENTO: "Em andamento", CONCLUIDO: "Concluído" };

export function AssignmentsPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.assignments, queryFn: AssignmentsApi.mine });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [board, setBoard] = useState("");
  const [due, setDue] = useState("");
  const [selected, setSelected] = useState<{ id: number; mode: "owner" | "collaborator" } | null>(null);
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState("");
  const items = query.data ?? [];
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const groupFor = (date: string | null) => {
    const value = normalizeApiDate(date);
    return !value ? "Sem prazo" : value < todayKey ? "Atrasadas" : value === todayKey ? "Hoje" : "Próximas";
  };
  const boards = [...new Map(items.map(({ tarefa }) => [tarefa.lista.quadro.id, tarefa.lista.quadro])).values()];
  const filtered = items.filter(({ tarefa }) =>
    `${tarefa.titulo} ${tarefa.lista.nome} ${tarefa.lista.quadro.nome}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) &&
    (!status || tarefa.status === status) && (!board || String(tarefa.lista.quadro.id) === board) &&
    (!due || groupFor(tarefa.prazo) === due),
  );
  async function open(id: number) {
    setOpening(true);
    setOpenError("");
    try {
      const mode = await resolveAssignmentAccess(id, items.map(({ tarefa }) => tarefa.id), async (taskId) => {
        const task = await TasksApi.get(taskId);
        client.setQueryData(queryKeys.task(taskId), task);
      });
      setSelected({ id, mode });
    } catch {
      setOpenError("Não foi possível abrir a tarefa. Ela pode não existir ou você não possui permissão. Tente novamente.");
    } finally { setOpening(false); }
  }
  function close() {
    setSelected(null);
    void client.invalidateQueries({ queryKey: queryKeys.assignments });
  }
  return <section className={styles.page} aria-label="Tarefas atribuídas a mim">
    <p>Acompanhe as tarefas atribuídas a você, com seus prazos e quadros de origem.</p>
    {query.isPending ? <p role="status">Carregando atribuições…</p> : query.isError ?
      <ErrorState title="Não foi possível carregar as atribuições" description="Confira a conexão e tente novamente." onRetry={() => void query.refetch()} /> :
      items.length === 0 ? <EmptyState title="Nenhuma tarefa atribuída" description="As tarefas aparecerão aqui quando você for adicionado como responsável." /> : <>
        <p role="status">{items.length} tarefa(s) · {items.filter(({ tarefa }) => tarefa.status === "CONCLUIDO").length} concluída(s)</p>
        <div className={styles.filters}>
          <label>Buscar tarefas<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todos os status</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Quadro<select value={board} onChange={(event) => setBoard(event.target.value)}><option value="">Todos os quadros</option>{boards.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
          <label>Prazo<select value={due} onChange={(event) => setDue(event.target.value)}><option value="">Todos os prazos</option>{["Atrasadas", "Hoje", "Próximas", "Sem prazo"].map((value) => <option key={value}>{value}</option>)}</select></label>
        </div>
        {openError && <p role="alert">{openError}</p>}
        {opening && <p role="status">Verificando acesso à tarefa…</p>}
        {filtered.length === 0 ? <EmptyState title="Nenhuma tarefa encontrada" description="Altere os filtros para ver outras tarefas." /> :
          ["Atrasadas", "Hoje", "Próximas", "Sem prazo"].map((group) => {
            const members = filtered.filter(({ tarefa }) => groupFor(tarefa.prazo) === group);
            return members.length ? <section key={group} aria-label={group}><h2>{group}</h2><ul className={styles.list}>{members.map(({ tarefa }) => <li key={tarefa.id}>
              <button disabled={opening} onClick={() => void open(tarefa.id)} type="button" className={styles.row}>
                <span><strong>{tarefa.titulo}</strong><small>{tarefa.lista.quadro.nome} · {tarefa.lista.nome}</small></span>
                <span>{statusLabels[tarefa.status]}<small>{tarefa.prazo ? formatApiDate(tarefa.prazo) : "Sem prazo"}</small></span>
              </button>
            </li>)}</ul></section> : null;
          })}
      </>}
    {selected && <TaskDetailsDrawer taskId={selected.id} mode={selected.mode} summary={items.find(({ tarefa }) => tarefa.id === selected.id)?.tarefa} onClose={close} />}
  </section>;
}
