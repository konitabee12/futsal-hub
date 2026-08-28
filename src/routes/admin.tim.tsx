import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, Cell, DataTable, Row } from "@/components/admin/AdminPage";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { contingentById, groupById, players, teams } from "@/data/mock";
import { useRbac } from "@/lib/rbac";

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
  return (
    <AdminPage
      title="Tim"
      description="Daftar tim per kontingen beserta grup, manajer, dan status kelayakan."
      permission="team.view"
      actions={can("team.update") ? <Button size="sm">Tambah Tim</Button> : undefined}
    >
      <DataTable columns={["Tim", "Kontingen", "Kategori", "Grup", "Manajer", "Pelatih", "Skuad", "Status", "Eligibility"]}>
        {teams.map((t) => (
          <Row key={t.id}>
            <Cell className="font-medium">{t.name}</Cell>
            <Cell>{contingentById(t.contingentId)?.name}</Cell>
            <Cell>{t.category}</Cell>
            <Cell>{groupById(t.groupId)?.name}</Cell>
            <Cell>{t.manager}</Cell>
            <Cell>{t.headCoach}</Cell>
            <Cell>{players.filter((p) => p.teamId === t.id).length}</Cell>
            <Cell>
              <StatusBadge status={t.status} />
            </Cell>
            <Cell>
              <StatusBadge status={t.eligibility} />
            </Cell>
          </Row>
        ))}
      </DataTable>
    </AdminPage>
  );
}
