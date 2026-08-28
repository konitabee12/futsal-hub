import type { SupabaseClient } from "@supabase/supabase-js";
import type { Contingent } from "@/types/domain";
import type { Database } from "@/types/database";
import type {
  ContingentCreateInput,
  ContingentReadRepository,
  ContingentRepository,
  ContingentUpdateInput,
} from "@/repositories/contracts";

type ContingentRow = Database["public"]["Tables"]["contingents"]["Row"];

function mapContingent(row: ContingentRow, teamCount: number, documentCount: number, verifiedDocumentCount: number): Contingent {
  return {
    id: row.id,
    eventId: row.event_id,
    sportId: row.sport_id,
    code: row.code,
    name: row.name,
    region: row.region,
    pic: row.pic,
    email: row.email,
    phone: row.phone,
    status: row.status as Contingent["status"],
    documents: documentCount,
    verifiedDocuments: verifiedDocumentCount,
    teamCount,
  };
}

const contingentColumns = "id, event_id, sport_id, code, name, region, logo_path, pic, email, phone, status, created_at, updated_at";

export class SupabaseContingentRepository implements ContingentReadRepository, ContingentRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async list(): Promise<Contingent[]> {
    const { data, error } = await this.supabase
      .from("contingents")
      .select(contingentColumns)
      .order("name");
    if (error) throw new Error("Unable to load contingents");

    return Promise.all(data.map(async (row) => {
      const [teamCounts, documentCounts, verifiedDocumentCounts] = await Promise.all([
        this.supabase.from("teams").select("id", { count: "exact", head: true }).eq("contingent_id", row.id),
        this.supabase.from("documents").select("id", { count: "exact", head: true }).eq("owner_type", "CONTINGENT").eq("owner_id", row.id),
        this.supabase.from("documents").select("id", { count: "exact", head: true }).eq("owner_type", "CONTINGENT").eq("owner_id", row.id).eq("status", "VERIFIED"),
      ]);
      if (teamCounts.error || documentCounts.error || verifiedDocumentCounts.error) {
        throw new Error("Unable to load contingent summaries");
      }
      return mapContingent(row, teamCounts.count ?? 0, documentCounts.count ?? 0, verifiedDocumentCounts.count ?? 0);
    }));
  }

  async getById(id: string): Promise<Contingent | null> {
    const { data, error } = await this.supabase
      .from("contingents")
      .select(contingentColumns)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error("Unable to load contingent");
    if (!data) return null;

    const [teamCounts, documentCounts, verifiedDocumentCounts] = await Promise.all([
      this.supabase.from("teams").select("id", { count: "exact", head: true }).eq("contingent_id", id),
      this.supabase.from("documents").select("id", { count: "exact", head: true }).eq("owner_type", "CONTINGENT").eq("owner_id", id),
      this.supabase.from("documents").select("id", { count: "exact", head: true }).eq("owner_type", "CONTINGENT").eq("owner_id", id).eq("status", "VERIFIED"),
    ]);
    if (teamCounts.error || documentCounts.error || verifiedDocumentCounts.error) {
      throw new Error("Unable to load contingent summaries");
    }
    return mapContingent(data, teamCounts.count ?? 0, documentCounts.count ?? 0, verifiedDocumentCounts.count ?? 0);
  }

  async create(input: ContingentCreateInput): Promise<Contingent> {
    const insert: Database["public"]["Tables"]["contingents"]["Insert"] = {
      event_id: input.eventId,
      sport_id: input.sportId,
      code: input.code,
      name: input.name,
      region: input.region,
      pic: input.pic,
      email: input.email,
      phone: input.phone,
      status: "DRAFT",
    };
    if (input.logoPath !== undefined) insert.logo_path = input.logoPath;
    const { data, error } = await this.supabase
      .from("contingents")
      .insert(insert)
      .select(contingentColumns)
      .single();
    if (error) throw new Error("Unable to create contingent");
    return this.getById(data.id).then((contingent) => {
      if (!contingent) throw new Error("Created contingent could not be loaded");
      return contingent;
    });
  }

  async update(id: string, input: ContingentUpdateInput): Promise<Contingent> {
    const update: Database["public"]["Tables"]["contingents"]["Update"] = {};
    if (input.name !== undefined) update.name = input.name;
    if (input.region !== undefined) update.region = input.region;
    if (input.pic !== undefined) update.pic = input.pic;
    if (input.email !== undefined) update.email = input.email;
    if (input.phone !== undefined) update.phone = input.phone;
    if (input.logoPath !== undefined) update.logo_path = input.logoPath;
    const { error } = await this.supabase.from("contingents").update(update).eq("id", id);
    if (error) throw new Error("Unable to update contingent");
    const updated = await this.getById(id);
    if (!updated) throw new Error("Updated contingent could not be loaded");
    return updated;
  }

  async transitionStatus(id: string, targetStatus: Contingent["status"]): Promise<Contingent> {
    const { error } = await this.supabase
      .from("contingents")
      .update({ status: targetStatus })
      .eq("id", id);
    if (error) throw new Error("Unable to transition contingent status");
    const updated = await this.getById(id);
    if (!updated) throw new Error("Transitioned contingent could not be loaded");
    return updated;
  }

  delete(_id: string): Promise<void> {
    return Promise.reject(new Error("Contingent delete is not available in Batch 2.5"));
  }
}