import { describe, expect, it } from "vitest";

import config from "./vite.config";

describe("Vite local address", () => {
  it("listens on the local network while keeping development and preview on port 3000", () => {
    expect(config).toMatchObject({
      server: { host: "0.0.0.0", port: 3000, strictPort: true },
      preview: { host: "0.0.0.0", port: 3000, strictPort: true },
    });
  });
});
