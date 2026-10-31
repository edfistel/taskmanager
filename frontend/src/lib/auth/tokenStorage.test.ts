import { beforeEach, describe, expect, it } from "vitest";

import { TokenStorage } from "./tokenStorage";

describe("TokenStorage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("stores refresh tokens in the session by default", () => {
    const storage = new TokenStorage();

    storage.write("refresh-session", "session");

    expect(storage.read()).toBe("refresh-session");
    expect(storage.getPersistence()).toBe("session");
    expect(localStorage.length).toBe(0);
  });

  it("uses local storage only when remember is requested", () => {
    const storage = new TokenStorage();

    storage.write("refresh-local", "local");

    expect(storage.read()).toBe("refresh-local");
    expect(storage.getPersistence()).toBe("local");
    expect(sessionStorage.length).toBe(0);
  });

  it("clears both possible token locations", () => {
    sessionStorage.setItem("taskflow.refresh-token", "old-session");
    localStorage.setItem("taskflow.refresh-token", "old-local");
    const storage = new TokenStorage();

    storage.clear();

    expect(sessionStorage.length).toBe(0);
    expect(localStorage.length).toBe(0);
  });
});
