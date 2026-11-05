import { describe, expect, it } from "vitest";

import config from "./vite.config";

describe("Vite local address", () => {
  it("keeps development and preview separate from the API service ports", () => {
    expect(config).toMatchObject({
      server: { host: "0.0.0.0", port: 5173, strictPort: true },
      preview: { host: "0.0.0.0", port: 4173, strictPort: true },
    });
  });
});
