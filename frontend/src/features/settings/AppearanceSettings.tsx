import { usePreferences } from "../../lib/preferences/PreferencesProvider";
import type { DensityPreference, ThemePreference } from "../../lib/preferences/preferences";
import styles from "./settings.module.css";

export function AppearanceSettings() {
  const { preferences, updatePreferences } = usePreferences();
  return <section className={styles.section} aria-labelledby="appearance-title">
    <h3 id="appearance-title">Aparência e movimento</h3>
    <p>Preferências salvas neste navegador.</p>
    <label className={styles.field}>Tema
      <select value={preferences.theme} onChange={(event) => updatePreferences({ theme: event.target.value as ThemePreference })}>
        <option value="system">Sistema</option><option value="light">Claro</option><option value="dark">Escuro</option>
      </select>
    </label>
    <label className={styles.field}>Densidade
      <select value={preferences.density} onChange={(event) => updatePreferences({ density: event.target.value as DensityPreference })}>
        <option value="comfortable">Confortável</option><option value="compact">Compacta</option>
      </select>
    </label>
    <label className={styles.check}><input type="checkbox" checked={preferences.reduceMotion} onChange={(event) => updatePreferences({ reduceMotion: event.target.checked })} />Reduzir movimentos</label>
  </section>;
}
