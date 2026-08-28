export const queryKeys = {
  contingents: {
    all: () => ["contingents"] as const,
    detail: (id: string) => ["contingents", id] as const,
  },
  teams: {
    all: () => ["teams"] as const,
    detail: (id: string) => ["teams", id] as const,
  },
  players: {
    all: () => ["players"] as const,
    detail: (id: string) => ["players", id] as const,
  },
} as const;