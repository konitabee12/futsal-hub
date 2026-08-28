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
import {
  useCreateRealContingent,
  useRealContingents,
  useTransitionRealContingent,
  useUpdateRealContingent,
} from "@/queries/contingent-hooks";
import type { Contingent } from "@/types/domain";

type FormState = {
  code: string;
  name: string;
  region: string;
  pic: string;
  email: string;
  phone: string;
  status: Contingent["status"];
};

const EMPTY_FORM: FormState = {
  code: "", name: "", region: "", pic: "", email: "", phone: "", status: "DRAFT",
};

const REGISTRATION_STATUSES: Contingent["status"][] = [
  "DRAFT", "SUBMITTED", "UNDER_REVIEW", "NEEDS_CORRECTION", "VERIFIED", "REJECTED", "ACTIVE", "INACTIVE",
];

export const Route = createFileRoute("/admin/kontingen")({
  head: () => ({
    meta: [
      { title: "Manajemen Kontingen — Konsol Futsal PORPROV Sulsel 2026" },
      { name: "description", content: "Daftar dan status registrasi kontingen kabupaten/kota pada cabor futsal PORPROV Sulsel 2026." },
      { property: "og:title", content: "Manajemen Kontingen — Konsol Futsal PORPROV Sulsel 2026" },
      { property: "og:description", content: "Status registrasi dan dokumen kontingen futsal PORPROV Sulsel 2026." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminContingents,
});

function AdminContingents() {
  const { can } = useRbac();
  const { data, isLoading, isError } = useRealContingents();
  const createMutation = useCreateRealContingent();
  const updateMutation = useUpdateRealContingent();
  const transitionMutation = useTransitionRealContingent();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const contingents = data ?? [];
  const isEditing = editingId !== null;
  const isSubmitting = createMutation.isPending || updateMutation.isPending || transitionMutation.isPending;

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSubmitError(null);
    setDialogOpen(true);
  }

  function openEdit(contingent: Contingent) {
    setEditingId(contingent.id);
    setForm({
      code: contingent.code,
      name: contingent.name,
      region: contingent.region,
      pic: contingent.pic,
      email: contingent.email,
      phone: contingent.phone,
      status: contingent.status,
    });
    setSubmitError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    try {
      if (editingId) {
        const current = contingents.find((contingent) => contingent.id === editingId);
        await updateMutation.mutateAsync({
          id: editingId,
          input: {
            name: form.name,
            region: form.region,
            pic: form.pic,
            email: form.email,
            phone: form.phone,
          },
        });
        if (current && current.status !== form.status) {
          await transitionMutation.mutateAsync({ id: editingId, targetStatus: form.status });
        }
      } else {
        await createMutation.mutateAsync({
          code: form.code,
          name: form.name,
          region: form.region,
          pic: form.pic,
          email: form.email,
          phone: form.phone,
        });
      }
      setDialogOpen(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Perubahan tidak dapat disimpan.");
    }
  }

  return (
    <AdminPage
      title="Kontingen"
      description="Kelola data kontingen kabupaten/kota beserta status verifikasi dokumen."
      permission="contingent.view"
      actions={can("contingent.create") ? <Button size="sm" onClick={openCreate}>Tambah Kontingen</Button> : undefined}
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat data kontingen...</p>
      ) : isError ? (
        <p className="text-sm text-destructive">Data kontingen tidak dapat dimuat.</p>
      ) : contingents.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada data kontingen.</p>
      ) : (
        <DataTable columns={["Kode", "Nama Kontingen", "PIC", "Kontak", "Tim", "Dokumen", "Status", "Aksi"]}>
          {contingents.map((c) => (
            <Row key={c.id}>
              <Cell className="font-mono text-xs">{c.code}</Cell>
              <Cell className="font-medium">{c.name}</Cell>
              <Cell>{c.pic}</Cell>
              <Cell className="text-xs text-muted-foreground">
                {c.email}
                <br />
                {c.phone}
              </Cell>
              <Cell>{c.teamCount ?? 0}</Cell>
              <Cell>
                {c.verifiedDocuments}/{c.documents}
              </Cell>
              <Cell>
                <StatusBadge status={c.status} />
              </Cell>
              <Cell>
                <Button size="sm" variant="outline" disabled={!can("contingent.update")} onClick={() => openEdit(c)}>
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
            <DialogTitle>{isEditing ? "Kelola Kontingen" : "Tambah Kontingen"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Perbarui informasi kontingen." : "Tambahkan kontingen pada scope kompetisi aktif."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Kode kontingen" value={form.code} disabled={isEditing} required onChange={(event) => setForm({ ...form, code: event.target.value })} />
              <Input placeholder="Nama kontingen" value={form.name} required onChange={(event) => setForm({ ...form, name: event.target.value })} />
              <Input placeholder="Kabupaten/Kota" value={form.region} required onChange={(event) => setForm({ ...form, region: event.target.value })} />
              <Input placeholder="PIC" value={form.pic} required onChange={(event) => setForm({ ...form, pic: event.target.value })} />
              <Input type="email" placeholder="Email" value={form.email} required onChange={(event) => setForm({ ...form, email: event.target.value })} />
              <Input placeholder="Nomor telepon" value={form.phone} required onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </div>
            {isEditing && (
              <Select value={form.status} onValueChange={(status) => setForm({ ...form, status: status as Contingent["status"] })}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {REGISTRATION_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {submitError && <p className="text-sm text-destructive">Perubahan tidak dapat disimpan.</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Menyimpan..." : "Simpan"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
