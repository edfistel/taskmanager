import { useQuery } from "@tanstack/react-query";
import { AccountApi } from "./accountApi";
import styles from "./settings.module.css";

export function AccountSettings() {
  const profile = useQuery({ queryKey: ["account", "profile"], queryFn: AccountApi.profile });
  return <section className={styles.section} aria-labelledby="account-title">
    <h3 id="account-title">Sua conta</h3>
    <p>Informações somente para leitura.</p>
    {profile.isPending && <p role="status">Carregando perfil…</p>}
    {profile.isError && <div role="alert"><p>Não foi possível carregar seu perfil.</p><button className={styles.secondary} type="button" onClick={() => void profile.refetch()}>Tentar novamente</button></div>}
    {profile.data && <>
      <p>ID da conta: {profile.data.id}</p>
      <label className={styles.field}>Nome<input readOnly value={profile.data.nome} /></label>
      <label className={styles.field}>E-mail<input readOnly value={profile.data.email} /></label>
    </>}
  </section>;
}
