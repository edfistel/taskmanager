import { useQuery } from "@tanstack/react-query";
import { CheckSquare2 } from "lucide-react";
import { Link } from "react-router";
import { queryKeys } from "../../lib/api/queryKeys";
import dashboard from "../dashboard/dashboard.module.css";
import { AssignmentsApi } from "./assignmentsApi";
import styles from "./summary.module.css";

export function AssignmentsSummary() {
  const query = useQuery({ queryKey: queryKeys.assignments, queryFn: AssignmentsApi.mine });
  const items = query.data ?? [];
  const completed = items.filter(({ tarefa }) => tarefa.status === "CONCLUIDO").length;
  const recent = [...items].sort((a, b) => Date.parse(b.atribuidoEm) - Date.parse(a.atribuidoEm)).slice(0, 3);

  return <section aria-labelledby="assigned-title" className={dashboard.assignmentsBoundary}>
    <span className={dashboard.assignmentIcon}><CheckSquare2 aria-hidden="true" size={22} /></span>
    <div className={styles.content}>
      <h2 id="assigned-title">Atribuídas a mim</h2>
      {query.isPending ? <p role="status">Carregando atribuições…</p>
        : query.isError ? <div role="alert">
          <p>Não foi possível carregar suas atribuições.</p>
          <button className={styles.retry} type="button" onClick={() => void query.refetch()}>Recarregar atribuições</button>
        </div>
        : items.length === 0 ? <p>Nenhuma tarefa atribuída por enquanto.</p>
        : <>
          <p>{items.length} {items.length === 1 ? "tarefa atribuída" : "tarefas atribuídas"}</p>
          <p>Pendentes: {items.length - completed} · Concluídas: {completed}</p>
          <ul className={styles.preview} aria-label="Atribuições recentes">{recent.map(({ tarefa }) => <li key={tarefa.id}>{tarefa.titulo}</li>)}</ul>
        </>}
    </div>
    <Link className={dashboard.soonPill} to="/atribuicoes">Ver minhas tarefas</Link>
  </section>;
}
