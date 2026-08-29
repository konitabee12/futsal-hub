import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AdminPage, Cell, DataTable, Row } from "@/components/admin/AdminPage";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRbac } from "@/lib/rbac";
import type { AdminPlayerListDto } from "@/lib/dto";
import type { Player } from "@/types/domain";
import { useCreateRealPlayer, useRealPlayers, useTransitionRealPlayer, useUpdateRealPlayer } from "@/queries/player-hooks";
import { useRealTeams } from "@/queries/team-hooks";

type FormState = { teamId: string; name: string; number: string; position: Player["position"]; birthDate: string; identityType: "NIK" | "PASSPORT"; identityNumber: string; status: Player["status"] };
const EMPTY_FORM: FormState = { teamId: "", name: "", number: "", position: "ANCHOR", birthDate: "", identityType: "NIK", identityNumber: "", status: "DRAFT" };
const POSITIONS: Player["position"][] = ["PENJAGA GAWANG", "ANCHOR", "FLANK", "PIVOT"];
const STATUSES: Player["status"][] = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "NEEDS_CORRECTION", "VERIFIED", "REJECTED", "ACTIVE", "INACTIVE"];

export const Route = createFileRoute("/admin/pemain")({
  head: () => ({ meta: [{ title: "Manajemen Pemain â€” Konsol Futsal PORPROV Sulsel 2026" }, { name: "description", content: "Kelola data pemain futsal PORPROV Sulsel 2026." }, { name: "robots", content: "noindex" }] }),
  component: AdminPlayers,
});

function AdminPlayers() {
  const { can } = useRbac(); const [q, setQ] = useState(""); const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPlayerListDto | null>(null); const [form, setForm] = useState<FormState>(EMPTY_FORM); const [submitError, setSubmitError] = useState<string | null>(null);
  const { data, isLoading, isError } = useRealPlayers(); const { data: teamData } = useRealTeams(); const create = useCreateRealPlayer(); const update = useUpdateRealPlayer(); const transition = useTransitionRealPlayer();
  const players = data ?? []; const teams = teamData ?? []; const list = players.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.identityDisplay.includes(q)).slice(0, 60); const submitting = create.isPending || update.isPending || transition.isPending;
  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setSubmitError(null); setDialogOpen(true); }
  function openEdit(player: AdminPlayerListDto) { setEditing(player); setForm({ ...EMPTY_FORM, teamId: player.teamId, name: player.name, number: String(player.number), position: player.position, status: player.status }); setSubmitError(null); setDialogOpen(true); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitError(null);
    try { const number = Number(form.number); if (editing) { await update.mutateAsync({ id: editing.id, input: { name: form.name, number, position: form.position } }); if (editing.status !== form.status) await transition.mutateAsync({ id: editing.id, targetStatus: form.status }); } else await create.mutateAsync({ teamId: form.teamId, name: form.name, number, position: form.position, birthDate: form.birthDate, identityType: form.identityType, identityNumber: form.identityNumber }); setDialogOpen(false); } catch (error) { setSubmitError(error instanceof Error ? error.message : "Perubahan tidak dapat disimpan."); }
  }
  return <AdminPage title="Pemain" description="Data pemain terdaftar. Identitas ditampilkan sebagian sesuai kebijakan perlindungan data." permission="player.view" actions={can("player.create") ? <Button size="sm" onClick={openCreate}>Tambah Pemain</Button> : undefined}>
    <div className="mb-4 max-w-sm"><Input placeholder="Cari nama atau nomor identitasâ€¦" value={q} onChange={(e) => setQ(e.target.value)} /></div>
    {isLoading ? <p className="text-sm text-muted-foreground">Memuat data pemain...</p> : isError ? <p className="text-sm text-destructive">Data pemain tidak dapat dimuat.</p> : players.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada data pemain.</p> : <DataTable columns={["No", "Nama", "Tim", "Posisi", "Lahir", "Identitas", "Status", "Eligibility", "Aksi"]}>{list.map((p) => <Row key={p.id}><Cell className="font-bold">{p.number}</Cell><Cell className="font-medium">{p.name}</Cell><Cell>{p.teamName}</Cell><Cell className="text-xs">{p.position}</Cell><Cell className="text-xs">{p.birthYear}</Cell><Cell className="font-mono text-xs">{p.identityDisplay}</Cell><Cell><StatusBadge status={p.status} /></Cell><Cell><StatusBadge status={p.eligibility} /></Cell><Cell><Button size="sm" variant="outline" disabled={!can("player.update")} onClick={() => openEdit(p)}>Kelola</Button></Cell></Row>)}</DataTable>}
    <p className="mt-3 text-xs text-muted-foreground">Menampilkan {list.length} dari {players.length} pemain.</p>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? "Kelola Pemain" : "Tambah Pemain"}</DialogTitle><DialogDescription>{editing ? "Perbarui informasi pemain dan status registrasinya." : "Tambahkan pemain ke tim yang dapat Anda kelola."}</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2">
      <Select value={form.teamId} disabled={Boolean(editing)} onValueChange={(teamId) => setForm({ ...form, teamId })}><SelectTrigger><SelectValue placeholder="Pilih tim" /></SelectTrigger><SelectContent>{teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
      <Select value={form.position} onValueChange={(position) => setForm({ ...form, position: position as Player["position"] })}><SelectTrigger><SelectValue placeholder="Posisi" /></SelectTrigger><SelectContent>{POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
      <Input placeholder="Nama pemain" value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} /><Input type="number" min="1" max="99" placeholder="Nomor punggung" value={form.number} required onChange={(e) => setForm({ ...form, number: e.target.value })} />
      {!editing && <><Input type="date" value={form.birthDate} required onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /><Select value={form.identityType} onValueChange={(identityType) => setForm({ ...form, identityType: identityType as FormState["identityType"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NIK">NIK</SelectItem><SelectItem value="PASSPORT">PASSPORT</SelectItem></SelectContent></Select><Input className="sm:col-span-2" placeholder="Nomor identitas" value={form.identityNumber} required onChange={(e) => setForm({ ...form, identityNumber: e.target.value })} /></>}
      {editing && <Select value={form.status} onValueChange={(status) => setForm({ ...form, status: status as Player["status"] })}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>}
    </div>{submitError && <p className="text-sm text-destructive">{submitError}</p>}<DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button><Button type="submit" disabled={submitting || (!editing && !form.teamId)}>{submitting ? "Menyimpan..." : "Simpan"}</Button></DialogFooter></form></DialogContent></Dialog>
  </AdminPage>;
}
