import { createServerFn } from "@tanstack/react-start";
import { listTeamsForRequest } from "@/services/team-read";

export const listTeams = createServerFn({ method: "GET" })
  .handler(() => listTeamsForRequest());