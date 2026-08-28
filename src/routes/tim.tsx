import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { PageHeader } from "@/components/PageHeader";
import { useCategory } from "@/lib/category";
import { contingentById, groupById, teams } from "@/data/mock";

export const Route = createFileRoute("/tim")({
  head: () => ({
    meta: [
      { title: "Daftar Tim Futsal — PORPROV Sulsel 2026" },
      {
        name: "description",
        content:
          "Daftar tim futsal putra dan putri peserta PORPROV Sulawesi Selatan 2026 beserta kontingen dan grup masing-masing.",
      },
      { property: "og:title", content: "Daftar Tim Futsal — PORPROV Sulsel 2026" },
      {
        property: "og:description",
        content: "Tim peserta futsal PORPROV Sulsel 2026 per kontingen dan grup.",
      },
    ],
  }),
  component: TeamsPage,
});

function TeamsPage() {
  const { category } = useCategory();
  const list = teams.filter((t) => t.category === category);

  return (
    <PublicLayout>
      <PageHeader
        title={`Tim Futsal ${category}`}
        description="Tim peserta yang terdaftar pada cabang olahraga futsal."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => {
          const contingent = contingentById(t.contingentId);
          return (
            <Link
              key={t.id}
              to="/tim/$teamId"
              params={{ teamId: t.id }}
              className="rounded-md border border-border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded bg-secondary font-display text-lg font-bold text-secondary-foreground">
                  {t.shortName}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{contingent?.name}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{groupById(t.groupId)?.name}</span>
                <span>Pelatih: {t.headCoach}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </PublicLayout>
  );
}
