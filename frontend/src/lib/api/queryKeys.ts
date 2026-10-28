export const queryKeys = {
  profile: ["profile"] as const,
  boards: {
    all: ["boards"] as const,
    detail: (boardId: number) => ["boards", boardId] as const,
  },
  lists: (boardId: number) => ["boards", boardId, "lists"] as const,
  task: (taskId: number) => ["tasks", taskId] as const,
  subtasks: (taskId: number) => ["tasks", taskId, "subtasks"] as const,
  comments: (taskId: number) => ["tasks", taskId, "comments"] as const,
  assignees: (taskId: number) => ["tasks", taskId, "assignees"] as const,
  assignments: ["assignments", "mine"] as const,
};
