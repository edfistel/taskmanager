import { createDemoFetch } from "./demoApi";

/** Invoked only by main.tsx's DEV + demo-mode guard, before AuthProvider mounts. */
export function installDemo(): void {
  window.fetch = createDemoFetch(window.fetch.bind(window), window.location.origin);
  window.sessionStorage.setItem("taskflow.refresh-token", "taskflow-demo-refresh");

  const banner = document.createElement("aside");
  banner.setAttribute("aria-label", "Modo de demonstração");
  banner.dataset.taskflowDemo = "true";
  Object.assign(banner.style, {
    position: "sticky", top: "0", zIndex: "50", padding: "9px 20px", background: "#fff3cd",
    color: "#533f03", font: "500 13px/1.5 system-ui, sans-serif", textAlign: "center",
    borderBottom: "1px solid #e6cc80", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexWrap: "wrap",
  });
  const message = document.createElement("span");
  message.textContent = "Demonstração · dados fictícios. Alterações ficam na memória e são restauradas ao recarregar. Login fictício: e-mail válido e senha com 8+ caracteres.";
  const reset = document.createElement("button");
  reset.type = "button";
  reset.textContent = "Restaurar demonstração";
  Object.assign(reset.style, {background: "transparent", border: "1px solid #9c7a20", borderRadius: "6px", padding: "4px 9px", color: "inherit", cursor: "pointer", font: "inherit"});
  reset.addEventListener("click", () => window.location.reload());
  banner.append(message, reset);
  document.body.prepend(banner);
  const measure = () => document.documentElement.style.setProperty("--demo-banner-height", `${banner.getBoundingClientRect().height}px`);
  measure();
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(measure).observe(banner);
}

