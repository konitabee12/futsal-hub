import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useCategory } from "@/lib/category";
import { EVENT_NAME, SPORT_NAME } from "@/data/mock";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Beranda" },
  { to: "/tim", label: "Tim" },
  { to: "/pemain", label: "Pemain" },
  { to: "/jadwal", label: "Jadwal" },
  { to: "/hasil", label: "Hasil" },
  { to: "/klasemen", label: "Klasemen" },
  { to: "/statistik", label: "Statistik" },
  { to: "/pengumuman", label: "Pengumuman" },
] as const;

export function CategorySwitch() {
  const { category, setCategory } = useCategory();
  return (
    <div className="inline-flex overflow-hidden rounded border border-border bg-card">
      {(["PUTRA", "PUTRI"] as const).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setCategory(c)}
          className={cn(
            "px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors",
            category === c
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent",
          )}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="bg-secondary text-secondary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs">
          <span className="label-caps">Pekan Olahraga Provinsi Sulawesi Selatan 2026</span>
          <Link to="/admin" className="label-caps text-gold hover:underline">
            Masuk Panel Admin
          </Link>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded bg-primary font-display text-lg font-bold text-primary-foreground">
              PS
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg font-bold tracking-tight">{EVENT_NAME}</span>
              <span className="label-caps block text-primary">{SPORT_NAME}</span>
            </span>
          </Link>
          <CategorySwitch />
        </div>
        <nav className="border-t border-border bg-card">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "border-primary text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>

      <footer className="mt-8 border-t border-border bg-secondary text-secondary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-8 text-sm">
          <p className="font-display text-lg font-bold">{EVENT_NAME} — {SPORT_NAME}</p>
          <p className="mt-1 text-secondary-foreground/70">
            Sistem manajemen kompetisi futsal. Data pribadi peserta tidak ditampilkan pada halaman publik.
          </p>
          <p className="mt-4 text-xs text-secondary-foreground/60">
            © 2026 Panitia Besar PORPROV Sulawesi Selatan.
          </p>
        </div>
      </footer>
    </div>
  );
}
