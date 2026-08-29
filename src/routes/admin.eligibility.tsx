import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminPage } from "@/components/admin/AdminPage";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useRbac } from "@/lib/rbac";
import { usePlayersEligibility, useEligibilityDecision } from "@/queries/eligibility-hooks";

export const Route = createFileRoute("/admin/eligibility")({
  head: () => ({
    meta: [
      { title: "Kelayakan Pemain — Konsol Futsal PORPROV Sulsel 2026" },
      { name: "description", content: "Kelayakan pemain futsal PORPROV Sulsel 2026 untuk mengikuti pertandingan." },
      { property: "og:title", content: "Kelayakan Pemain — Konsol Futsal PORPROV Sulsel 2026" },
      { property: "og:description", content: "Proses penentuan kelayakan pemain futsal PORPROV Sulsel 2026." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminEligibility,
});

// Eligibility evaluation logic
function evaluatePlayerEligibility(player: any) {
  const reasons: string[] = [];
  let eligible = true;

  // Rule 1: Team must exist
  if (!player.teamId || !player.teamName) {
    reasons.push("TEAM_MISSING");
    eligible = false;
  }

  // Rule 2: Registration status must be VERIFIED
  if (player.status !== "VERIFIED" && eligible) {
    reasons.push("REGISTRATION_INCOMPLETE");
    eligible = false;
  }

  // Rule 3: Required data must be present
  if (eligible && (!player.name || !player.number || !player.position || player.birthYear === "")) {
    reasons.push("REQUIRED_DATA_MISSING");
    eligible = false;
  }

  // If all rules pass, player is eligible
  if (eligible && reasons.length === 0) {
    reasons.push("VERIFIED_AND_ELIGIBLE");
  }

  return { eligible, reasons };
}

function AdminEligibility() {
  const { can } = useRbac();
  const { data: players, isLoading, isError } = usePlayersEligibility();
  const { mutate: decide, isPending: isDeciding } = useEligibilityDecision();
  const playerList = players ?? [];
  const [selected, setSelected] = useState(playerList[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const current = playerList.find((p) => p.id === selected);

  // Evaluate eligibility for current player
  const evaluation = current ? evaluatePlayerEligibility(current) : null;

  const handleDecision = async (targetStatus: "ELIGIBLE" | "NOT_ELIGIBLE") => {
    if (!current) return;
    setError(null);
    decide(
      { playerId: current.id, targetStatus },
      {
        onError: (err) => {
          const message = err instanceof Error ? err.message : "Decision failed";
          setError(message);
        },
      },
    );
  };

  // Create reason messages in Indonesian
  const reasonMessages: Record<string, string> = {
    TEAM_MISSING: "Tim tidak ditemukan",
    CONTINGENT_MISSING: "Kontingen tidak ditemukan",
    REGISTRATION_INCOMPLETE: "Data pendaftaran tidak lengkap atau belum diverifikasi",
    REQUIRED_DATA_MISSING: "Data wajib pemain tidak lengkap",
    VERIFIED_AND_ELIGIBLE: "Semua persyaratan terpenuhi",
  };

  return (
    <AdminPage
      title="Kelayakan Pemain"
      description="Periksa kelayakan pemain untuk mengikuti pertandingan."
      permission="eligibility.view"
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat data kelayakan pemain...</p>
      ) : isError ? (
        <p className="text-sm text-destructive">Data kelayakan pemain tidak dapat dimuat.</p>
      ) : playerList.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada data pemain.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <ul className="max-h-[70vh] divide-y divide-border overflow-y-auto rounded-md border border-border bg-card">
            {playerList.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => {
                    setSelected(p.id);
                    setError(null);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-accent ${p.id === selected ? "bg-accent" : ""}`}
                >
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.teamName} · #{p.number}
                  </p>
                  <StatusBadge status={p.eligibility} className="mt-1" />
                </button>
              </li>
            ))}
          </ul>

          {current && evaluation && (
            <div className="rounded-md border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div>
                  <h2 className="font-display text-xl font-bold">{current.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {current.teamName} · Posisi {current.position} · #{current.number}
                  </p>
                </div>
                <StatusBadge status={current.eligibility} />
              </div>

              <h3 className="label-caps mt-4 text-muted-foreground">Persyaratan Kelayakan</h3>
              <ol className="mt-2 space-y-2 text-sm">
                {evaluation.reasons.map((reason, i) => (
                  <li key={i} className="rounded border border-border px-3 py-2">
                    <p className="text-sm">{reasonMessages[reason] || reason}</p>
                  </li>
                ))}
              </ol>

              <h3 className="label-caps mt-4 text-muted-foreground">Data Pemain</h3>
              <dl className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status Pendaftaran:</dt>
                  <dd className="font-medium">{current.status}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tahun Lahir:</dt>
                  <dd className="font-medium">{current.birthYear}</dd>
                </div>
              </dl>

              {error && (
                <div className="mt-4 rounded border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={!can("eligibility.decide") || isDeciding}
                  onClick={() => handleDecision("ELIGIBLE")}
                >
                  Layak
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!can("eligibility.decide") || isDeciding}
                  onClick={() => handleDecision("NOT_ELIGIBLE")}
                >
                  Tidak Layak
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminPage>
  );
}
