import { describe, expect, it } from "vitest";
import { ApiError } from "../../lib/api/errors";
import { resolveAssignmentAccess } from "./access";

describe("assignment access", () => {
  it("identifies an owner when task details are available", async () => {
    expect(await resolveAssignmentAccess(8, [8], async () => undefined)).toBe("owner");
  });
  it("uses collaborator mode only for a proven assignment returning 404", async () => {
    expect(await resolveAssignmentAccess(8, [8], async () => { throw new ApiError(404, {}); })).toBe("collaborator");
  });
  it("rejects an arbitrary resource without fetching it", async () => {
    let called = false;
    await expect(resolveAssignmentAccess(9, [8], async () => { called = true; })).rejects.toThrow(/permissão/);
    expect(called).toBe(false);
  });
  it("does not turn server failures into collaborator access", async () => {
    await expect(resolveAssignmentAccess(8, [8], async () => { throw new ApiError(500, {}); })).rejects.toMatchObject({ status: 500 });
  });
});
