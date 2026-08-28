import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditRecord, AuditRepository } from "@/lib/audit";
import type { Database, Json } from "@/types/database";

function toJson(value: unknown): Json | null {
  if (value === undefined) return null;
  return JSON.parse(JSON.stringify(value)) as Json;
}

export class SupabaseAuditRepository implements AuditRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async append(record: AuditRecord): Promise<void> {
    const insert: Database["public"]["Tables"]["audit_logs"]["Insert"] = {
      actor: record.actor,
      action: record.action,
      resource: record.resource,
      resource_id: record.resourceId,
      before_data: toJson(record.before),
      after_data: toJson(record.after),
      created_at: record.timestamp,
    };
    if (record.ip !== undefined) insert.ip = record.ip;
    if (record.userAgent !== undefined) insert.user_agent = record.userAgent;
    const { error } = await this.supabase.from("audit_logs").insert(insert);
    if (error) throw new Error("Unable to write audit record");
  }
}