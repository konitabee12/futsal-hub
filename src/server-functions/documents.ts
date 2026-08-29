import { createServerFn } from "@tanstack/react-start";
import { listDocumentsForRequest } from "@/services/document-read";
export const listDocuments = createServerFn({ method: "GET" }).handler(() => listDocumentsForRequest());
