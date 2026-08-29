import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AdminPage, Cell, DataTable, Row } from "@/components/admin/AdminPage";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useRbac } from "@/lib/rbac";
import { useRealContingents } from "@/queries/contingent-hooks";
import {
  useCreateRealTeam, useRealTeams, useTransitionRealTeam, useUpdateRealTeam,
} from "@/queries/team-hooks";
import type { Team } from "@/types/domain";

type FormState = {
  contingentId: string;
  category: Team["category"];
  name: string;
  shortName: string;
  manager: string;
  headCoach: string;
  status: Team["status"];
};

const EMPTY_FORM: FormState = {
  contingentId: "", category: "PUTRA", name: "", shortName: "", manager: "", headCoach: "", status: "DRAFT",
};

const REGISTRATION_STATUSES: Team["status"][] = [
  "DRAFT", "SUBMITTED", "UNDER_REVIEW", "NEEDS_CORRECTION", "VERIFIED", "REJECTED", "ACTIVE", "INACTIVE",
];

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
  const { data: contingentData } = useRealContingents();
  const createMutation = useCreateRealTeam();
  const updateMutation = useUpdateRealTeam();
  const transitionMutation = useTransitionRealTeam();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const teams = data ?? [];
  const contingents = contingentData ?? [];
  const isEditing = editingId !== null;
  const isSubmitting = createMutation.isPending || updateMutation.isPending || transitionMutation.isPending;

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSubmitError(null);
    setDialogOpen(true);
  }

  function openEdit(team: Team) {
    setEditingId(team.id);
    setForm({
      contingentId: team.contingentId,
      category: team.category,
      name: team.name,
      shortName: team.shortName,
      manager: team.manager,
      headCoach: team.headCoach,
      status: team.status,
    });
    setSubmitError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    try {
      if (editingId) {
        const current = teams.find((team) => team.id === editingId);
        await updateMutation.mutateAsync({
          id: editingId,
          input: {
            name: form.name,
            shortName: form.shortName,
            manager: form.manager,
            headCoach: form.headCoach,
          },
        });
        if (current && current.status !== form.status) {
          await transitionMutation.mutateAsync({ id: editingId, targetStatus: form.status });
        }
      } else {
        await createMutation.mutateAsync({
          contingentId: form.contingentId,
          category: form.category,
          name: form.name,
          shortName: form.shortName,
          manager: form.manager,
          headCoach: form.headCoach,
        });
      }
      setDialogOpen(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Perubahan tidak dapat disimpan.");
    }
  }

  return (
    <AdminPage
      title="Tim"
      description="Daftar tim per kontingen beserta grup, manajer, dan status kelayakan."
      permission="team.view"
      actions={can("team.create") ? <Button size="sm" onClick={openCreate}>Tambah Tim</Button> : undefined}
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat data tim...</p>
      ) : isError ? (
        <p className="text-sm text-destructive">Data tim tidak dapat dimuat.</p>
      ) : teams.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada data tim.</p>
      ) : (
        <DataTable columns={["Tim", "Kontingen", "Kategori", "Grup", "Manajer", "Pelatih", "Skuad", "Status", "Eligibility", "Aksi"]}>
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
              <Cell>
                <Button size="sm" variant="outline" disabled={!can("team.update")} onClick={() => openEdit(t)}>
                  Kelola
                </Button>
              </Cell>
            </Row>
          ))}
        </DataTable>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Kelola Tim" : "Tambah Tim"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Perbarui informasi tim." : "Tambahkan tim ke kontingen yang dapat Anda kelola."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Select value={form.contingentId} disabled={isEditing} onValueChange={(contingentId) => setForm({ ...form, contingentId })}>
                <SelectTrigger><SelectValue placeholder="Pilih kontingen" /></SelectTrigger>
                <SelectContent>
                  {contingents.map((contingent) => <SelectItem key={contingent.id} value={contingent.id}>{contingent.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.category} disabled={isEditing} onValueChange={(category) => setForm({ ...form, category: category as Team["category"] })}>
                <SelectTrigger><SelectValue placeholder="Kategori" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUTRA">PUTRA</SelectItem>
                  <SelectItem value="PUTRI">PUTRI</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Nama tim" value={form.name} required onChange={(event) => setForm({ ...form, name: event.target.value })} />
              <Input placeholder="Nama singkat" value={form.shortName} required onChange={(event) => setForm({ ...form, shortName: event.target.value })} />
              <Input placeholder="Manajer" value={form.manager} required onChange={(event) => setForm({ ...form, manager: event.target.value })} />
              <Input placeholder="Pelatih kepala" value={form.headCoach} required onChange={(event) => setForm({ ...form, headCoach: event.target.value })} />
            </div>
            {isEditing && (
              <Select value={form.status} onValueChange={(status) => setForm({ ...form, status: status as Team["status"] })}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {REGISTRATION_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting || (!isEditing && !form.contingentId)}>{isSubmitting ? "Menyimpan..." : "Simpan"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
