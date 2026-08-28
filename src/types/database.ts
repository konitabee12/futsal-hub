export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: TableDefinition<{
        id: string;
        display_name: string;
        created_at: string;
        updated_at: string;
      }>;
      sports: TableDefinition<{
        id: string;
        event_id: string;
        name: string;
        code: string;
      }>;
      roles: TableDefinition<{ id: string; code: string; name: string; created_at: string }>;
      permissions: TableDefinition<{ id: string; code: string; name: string; created_at: string }>;
      role_permissions: TableDefinition<{ role_id: string; permission_id: string }>;
      user_roles: TableDefinition<{
        id: string;
        user_id: string;
        role_id: string;
        event_id: string | null;
        sport_id: string | null;
        contingent_id: string | null;
        team_id: string | null;
        created_at: string;
      }>;
      contingents: TableDefinition<{
        id: string;
        event_id: string;
        sport_id: string;
        code: string;
        name: string;
        region: string;
        logo_path: string | null;
        pic: string;
        email: string;
        phone: string;
        status: string;
        created_at: string;
        updated_at: string;
      }>;
      teams: TableDefinition<{
        id: string;
        contingent_id: string;
        category: string;
        name: string;
        short_name: string;
        manager: string;
        head_coach: string;
        status: string;
        eligibility: string;
      }>;
      groups: TableDefinition<{ id: string; name: string }>;
      group_teams: TableDefinition<{ group_id: string; team_id: string }>;
      team_player_counts: TableDefinition<{ team_id: string; player_count: number }>;
      documents: TableDefinition<{
        id: string;
        owner_type: string;
        owner_id: string;
        status: string;
      }>;
      audit_logs: TableDefinition<{
        id: string;
        actor: string | null;
        action: string;
        resource: string;
        resource_id: string;
        before_data: Json | null;
        after_data: Json | null;
        ip: string | null;
        user_agent: string | null;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export interface TableDefinition<Row> {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
}
