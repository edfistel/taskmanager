import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";

import { App } from "./app/App";
import { queryClient } from "./app/queryClient";
import { ToastProvider } from "./components/feedback/ToastProvider";
import { AuthProvider } from "./lib/auth/AuthProvider";
import { PreferencesProvider } from "./lib/preferences/PreferencesProvider";
import "./styles/global.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Elemento raiz do TaskFlow não encontrado.");
}

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </PreferencesProvider>
    </QueryClientProvider>
  </StrictMode>,
);
