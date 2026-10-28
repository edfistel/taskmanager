import { useState } from "react";
import { CheckCircle2, MoonStar, ShieldCheck, SunMedium } from "lucide-react";
import { Navigate, useNavigate } from "react-router";

import { TaskFlowLogo } from "../../components/brand/TaskFlowLogo";
import { useAuth } from "../../lib/auth/useAuth";
import { PostRegistrationLoginError } from "../../lib/auth/sessionManager";
import { usePreferences } from "../../lib/preferences/PreferencesProvider";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import styles from "./auth.module.css";

type AuthTab = "login" | "register";

export function AuthPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { resolvedTheme, updatePreferences } = usePreferences();
  const [tab, setTab] = useState<AuthTab>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginMessage, setLoginMessage] = useState<string | undefined>();

  if (auth.status === "authenticated") return <Navigate replace to="/" />;

  const handleRegister = async (input: Parameters<typeof auth.register>[0]) => {
    try {
      await auth.register(input);
      navigate("/", { replace: true });
    } catch (error) {
      if (error instanceof PostRegistrationLoginError) {
        setLoginEmail(error.email);
        setLoginMessage(error.message);
        setTab("login");
        return;
      }
      throw error;
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.story}>
        <div className={styles.storyInner}>
          <TaskFlowLogo inverse />
          <div className={styles.heroCopy}>
            <h1>Organize o fluxo. Entregue com clareza.</h1>
            <p>
              Um espaço visual para transformar prioridades em progresso, sem
              perder contexto no caminho.
            </p>
          </div>
          <div className={styles.proofList}>
            <span><CheckCircle2 size={18} /> Quadros flexíveis para cada equipe</span>
            <span><ShieldCheck size={18} /> Permissões claras e seguras</span>
          </div>
        </div>
        <div aria-hidden="true" className={styles.orbitOne} />
        <div aria-hidden="true" className={styles.orbitTwo} />
      </section>

      <section className={styles.authSide}>
        <button
          aria-label={`Usar tema ${resolvedTheme === "dark" ? "claro" : "escuro"}`}
          className={styles.themeToggle}
          onClick={() =>
            updatePreferences({ theme: resolvedTheme === "dark" ? "light" : "dark" })
          }
          type="button"
        >
          {resolvedTheme === "dark" ? <SunMedium size={19} /> : <MoonStar size={19} />}
        </button>
        <div className={styles.card}>
          <header className={styles.cardHeader}>
            <div className={styles.mobileLogo}><TaskFlowLogo /></div>
            <h2>Bem-vindo ao seu fluxo</h2>
            <p>Entre para continuar ou crie uma conta em poucos segundos.</p>
          </header>
          <div aria-label="Acesso" className={styles.tabs} role="tablist">
            <button
              aria-selected={tab === "login"}
              className={tab === "login" ? styles.activeTab : ""}
              onClick={() => setTab("login")}
              role="tab"
              type="button"
            >
              Entrar
            </button>
            <button
              aria-selected={tab === "register"}
              className={tab === "register" ? styles.activeTab : ""}
              onClick={() => setTab("register")}
              role="tab"
              type="button"
            >
              Criar conta
            </button>
          </div>
          {tab === "login" ? (
            <LoginForm
              initialEmail={loginEmail}
              initialMessage={loginMessage}
              onSubmit={async (input) => {
                await auth.login(input);
                navigate("/", { replace: true });
              }}
            />
          ) : (
            <RegisterForm onSubmit={handleRegister} />
          )}
          <p className={styles.privacy}>
            Ao continuar, seus dados permanecem vinculados somente ao seu espaço de trabalho.
          </p>
        </div>
      </section>
    </main>
  );
}
