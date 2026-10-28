import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthContext } from "../lib/auth/AuthProvider";
import { PreferencesProvider } from "../lib/preferences/PreferencesProvider";
import { App } from "./App";

describe("TaskFlow application", () => {
  it("identifies the product on the public entry screen", async () => {
    render(
      <PreferencesProvider>
        <AuthContext.Provider
          value={{
            status: "anonymous",
            user: null,
            login: async () => {
              throw new Error("unused");
            },
            register: async () => {
              throw new Error("unused");
            },
            logout: async () => undefined,
          }}
        >
          <App />
        </AuthContext.Provider>
      </PreferencesProvider>,
    );

    expect(await screen.findByRole("heading", { name: /bem-vindo/i })).toBeVisible();
    expect(screen.getAllByLabelText("TaskFlow").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TaskFlow").length).toBeGreaterThan(0);
    expect(screen.getAllByText("T").length).toBeGreaterThan(0);
  });
});
