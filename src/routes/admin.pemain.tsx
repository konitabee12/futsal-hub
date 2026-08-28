import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminPage, Cell, DataTable, Row } from "@/components/admin/AdminPage";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { players, teamName } from "@/data/mock";
import { useRbac } from "@/lib/rbac";

export const Route = createFileRoute("/admin/pemain")({
  head: () => ({
    meta: [
      { title: "Manajemen Pemain — Konsol Futsal PORPROV Sulsel 2026" },
      { name: "description", content: "Kelola data pemain, identitas, dan status kelayakan pada cabor futsal PORPROV Sulsel 2026." },
      { property: "og:title", content: "Manajemen Pemain — Konsol Futsal PORPROV Sulsel 2026" },
      { property: "og:description", content: "Data registrasi pemain futsal PORPROV Sulsel 2026." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPlayers,
});

function AdminPlayers() {
  const { can } = useRbac();
  const [q, setQ] = useState("");
  const list = players
    .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.identityNumber.includes(q))
    .slice(0, 60);

  return (
    <AdminPage
      title="Pemain"
      description="Data pemain terdaftar. Identitas ditampilkan sebagian sesuai kebijakan perlindungan data."
      permission="player.view"
      actions={can("player.update") ? <Button size="sm">Tambah Pemain</Button> : undefined}
    >
      <div className="mb-4 max-w-sm">
        <Input placeholder="Cari nama atau nomor identitas…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <DataTable columns={["No", "Nama", "Tim", "Posisi", "Lahir", "Identitas", "Status", "Eligibility"]}>
        {list.map((p) => (
          <Row key={p.id}>
            <Cell className="font-bold">{p.number}</Cell>
            <Cell className="font-medium">{p.name}</Cell>
            <Cell>{teamName(p.teamId)}</Cell>
            <Cell className="text-xs">{p.position}</Cell>
            <Cell className="text-xs">{p.birthDate}</Cell>
            <Cell className="font-mono text-xs">
              {p.identityType} ••••{p.identityNumber.slice(-4)}
            </Cell>
            <Cell>
              <StatusBadge status={p.status} />
            </Cell>
            <Cell>
              <StatusBadge status={p.eligibility} />
            </Cell>
          </Row>
        ))}
      </DataTable>
      <p className="mt-3 text-xs text-muted-foreground">Menampilkan {list.length} dari {players.length} pemain.</p>
    </AdminPage>
  );
}
