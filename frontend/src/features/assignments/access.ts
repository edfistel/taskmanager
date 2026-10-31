import { isApiError } from "../../lib/api/errors";

export async function resolveAssignmentAccess(id: number, assigned: number[], get: (id: number) => Promise<unknown>): Promise<"owner" | "collaborator"> {
  if (!assigned.includes(id)) throw new Error("Esta tarefa pode não existir ou você não possui permissão.");
  try {
    await get(id);
    return "owner";
  } catch (error) {
    if (isApiError(error) && error.status === 404) return "collaborator";
    throw error;
  }
}
