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
  officials: {
    all: () => ["officials"] as const,
  },
  documents: {
    all: () => ["documents"] as const,
  },
  verifications: {
    all: () => ["verifications"] as const,
    detail: (id: string) => ["verifications", id] as const,
  },
  eligibility: {
    all: () => ["eligibility"] as const,
    detail: (id: string) => ["eligibility", id] as const,
  },
} as const;
