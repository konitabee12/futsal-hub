import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, Cell, DataTable, Row } from "@/components/admin/AdminPage";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useRbac } from "@/lib/rbac";
import { useRealTeams } from "@/queries/team-hooks";

export const Route = createFileRoute("/admin/tim")({
  head: () => ({
    meta: [
      { title: "Manajemen Tim — Konsol Futsal PORPROV Sulsel 2026" },
      { name: "description", content: "Kelola tim putra dan putri, grup, serta status eligibility pada cabor futsal PORPROV Sulsel 2026." },
      { property: "og:title", content: "Manajemen Tim — Konsol Futsal PORPROV Sulsel 2026" },
      { property: "og:description", content: "Daftar tim futsal PORPROV Sulsel 2026 beserta status registrasinya." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminTeams,
});

function AdminTeams() {
  const { can } = useRbac();
  const { data, isLoading, isError } = useRealTeams();
  const teams = data ?? [];
  return (
    <AdminPage
      title="Tim"
      description="Daftar tim per kontingen beserta grup, manajer, dan status kelayakan."
      permission="team.view"
      actions={can("team.update") ? <Button size="sm">Tambah Tim</Button> : undefined}
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat data tim...</p>
      ) : isError ? (
        <p className="text-sm text-destructive">Data tim tidak dapat dimuat.</p>
      ) : teams.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada data tim.</p>
      ) : (
        <DataTable columns={["Tim", "Kontingen", "Kategori", "Grup", "Manajer", "Pelatih", "Skuad", "Status", "Eligibility"]}>
          {teams.map((t) => (
            <Row key={t.id}>
              <Cell className="font-medium">{t.name}</Cell>
              <Cell>{t.contingentName ?? t.contingentId}</Cell>
              <Cell>{t.category}</Cell>
              <Cell>{t.groupName ?? t.groupId}</Cell>
              <Cell>{t.manager}</Cell>
              <Cell>{t.headCoach}</Cell>
              <Cell>{t.playerCount ?? 0}</Cell>
              <Cell>
                <StatusBadge status={t.status} />
              </Cell>
              <Cell>
                <StatusBadge status={t.eligibility} />
              </Cell>
            </Row>
          ))}
        </DataTable>
      )}
    </AdminPage>
  );
}
