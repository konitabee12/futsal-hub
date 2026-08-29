import { createServerFn } from "@tanstack/react-start";
import { listOfficialsForRequest } from "@/services/official-read";

export const listOfficials = createServerFn({ method: "GET" }).handler(() => listOfficialsForRequest());
