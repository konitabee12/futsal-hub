import type { Contingent, Player, Team } from "@/types/domain";

export interface ContingentCreateInput {
  eventId: string;
  sportId: string;
  code: string;
  name: string;
  region: string;
  pic: string;
  email: string;
  phone: string;
  logoPath?: string;
}

export interface ContingentUpdateInput {
  name?: string;
  region?: string;
  pic?: string;
  email?: string;
  phone?: string;
  logoPath?: string;
}

export interface ContingentStatusTransitionInput {
  targetStatus: Contingent["status"];
}

export interface Repository<T, CreateInput, UpdateInput> {
  list(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(input: CreateInput): Promise<T>;
  update(id: string, input: UpdateInput): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface ContingentReadRepository {
  list(): Promise<Contingent[]>;
  getById(id: string): Promise<Contingent | null>;
}

export interface TeamReadRepository {
  list(): Promise<Team[]>;
  getById(id: string): Promise<Team | null>;
}

export type ContingentRepository = Repository<Contingent, ContingentCreateInput, ContingentUpdateInput> & {
  transitionStatus(id: string, targetStatus: Contingent["status"]): Promise<Contingent>;
};
export type TeamRepository = Repository<Team, Omit<Team, "id">, Partial<Omit<Team, "id">>>;
export type PlayerRepository = Repository<Player, Omit<Player, "id">, Partial<Omit<Player, "id">>>;