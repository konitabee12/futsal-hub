import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, Cell, DataTable, Row } from "@/components/admin/AdminPage";
import { StatusBadge } from "@/components/StatusBadge";
import { officials, teamName } from "@/data/mock";
import { POSITION_LABEL } from "@/lib/labels";

export const Route = createFileRoute("/admin/official")({
  head: () => ({
    meta: [
      { title: "Manajemen Official — Konsol Futsal PORPROV Sulsel 2026" },
      { name: "description", content: "Kelola data official tim: manajer, pelatih, dan tenaga medis pada cabor futsal PORPROV Sulsel 2026." },
      { property: "og:title", content: "Manajemen Official — Konsol Futsal PORPROV Sulsel 2026" },
      { property: "og:description", content: "Daftar official tim futsal PORPROV Sulsel 2026." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOfficials,
});

function AdminOfficials() {
  return (
    <AdminPage
      title="Official"
      description="Official tim yang terdaftar dan berhak berada di area bangku cadangan."
      permission="official.view"
    >
      <DataTable columns={["Nama", "Tim", "Posisi", "Identitas", "Telepon", "Status", "Eligibility"]}>
        {officials.slice(0, 60).map((o) => (
          <Row key={o.id}>
            <Cell className="font-medium">{o.name}</Cell>
            <Cell>{teamName(o.teamId)}</Cell>
            <Cell>{POSITION_LABEL[o.position]}</Cell>
            <Cell className="font-mono text-xs">••••{o.identityNumber.slice(-4)}</Cell>
            <Cell className="text-xs">{o.phone}</Cell>
            <Cell>
              <StatusBadge status={o.status} />
            </Cell>
            <Cell>
              <StatusBadge status={o.eligibility} />
            </Cell>
          </Row>
        ))}
      </DataTable>
    </AdminPage>
  );
}
