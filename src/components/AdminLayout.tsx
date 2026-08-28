import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Bell, Building2, CalendarDays, ClipboardCheck, FileText, Gauge, LayoutGrid,
  ListOrdered, MapPin, ScrollText, ShieldCheck, Trophy, UserCog, Users, Volleyball,
} from "lucide-react";
import { ROLE_LABEL, ROLE_SCOPE, useRbac, type Permission } from "@/lib/rbac";
import type { Role } from "@/types/domain";
import { notifications } from "@/data/mock";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Gauge;
  permission: Permission;
}

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Umum",
    items: [{ to: "/admin", label: "Dashboard", icon: Gauge, permission: "dashboard.view" }],
  },
  {
    title: "Administrasi",
    items: [
      { to: "/admin/kontingen", label: "Kontingen", icon: Building2, permission: "contingent.view" },
      { to: "/admin/tim", label: "Tim", icon: Users, permission: "team.view" },
      { to: "/admin/pemain", label: "Pemain", icon: UserCog, permission: "player.view" },
      { to: "/admin/official", label: "Official", icon: UserCog, permission: "official.view" },
      { to: "/admin/dokumen", label: "Dokumen", icon: FileText, permission: "document.view" },
      { to: "/admin/verifikasi", label: "Verifikasi", icon: ClipboardCheck, permission: "verification.view" },
      { to: "/admin/eligibility", label: "Eligibility", icon: ShieldCheck, permission: "eligibility.view" },
    ],
  },
  {
    title: "Kompetisi",
    items: [
      { to: "/admin/kompetisi", label: "Kategori & Grup", icon: LayoutGrid, permission: "competition.view" },
      { to: "/admin/venue", label: "Venue", icon: MapPin, permission: "venue.view" },
      { to: "/admin/jadwal", label: "Jadwal", icon: CalendarDays, permission: "schedule.view" },
      { to: "/admin/pertandingan", label: "Match Center", icon: Volleyball, permission: "match.view" },
      { to: "/admin/hasil", label: "Hasil", icon: Trophy, permission: "result.view" },
      { to: "/admin/klasemen", label: "Klasemen", icon: ListOrdered, permission: "standings.view" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { to: "/admin/notifikasi", label: "Notifikasi", icon: Bell, permission: "notification.view" },
      { to: "/admin/audit", label: "Audit Log", icon: ScrollText, permission: "audit.view" },
    ],
  },
];

const ROLES: Role[] = [
  "SUPER_ADMIN", "EVENT_ADMIN", "FUTSAL_ADMIN", "VERIFIER", "COMPETITION_OPERATOR",
  "MATCH_OPERATOR", "MATCH_OFFICIAL", "CONTINGENT_ADMIN", "TEAM_MANAGER",
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { role, setRole, can } = useRbac();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <Link to="/admin" className="flex items-center gap-3 border-b border-sidebar-border px-4 py-4">
          <span className="grid size-9 place-items-center rounded bg-sidebar-primary font-display font-bold text-sidebar-primary-foreground">
            PS
          </span>
          <span className="leading-tight">
            <span className="block font-display text-sm font-bold">PORPROV FUTSAL</span>
            <span className="label-caps block text-sidebar-foreground/60">Console</span>
          </span>
        </Link>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {SECTIONS.map((section) => {
            const items = section.items.filter((i) => can(i.permission));
            if (!items.length) return null;
            return (
              <div key={section.title} className="mb-5">
                <p className="label-caps px-3 pb-2 text-sidebar-foreground/50">{section.title}</p>
                {items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{ exact: item.to === "/admin" }}
                    className="flex items-center gap-2.5 rounded px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary" }}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                    {item.to === "/admin/notifikasi" && unread > 0 && (
                      <span className="ml-auto rounded bg-sidebar-primary px-1.5 text-[10px] font-bold text-sidebar-primary-foreground">
                        {unread}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border px-4 py-3 text-xs text-sidebar-foreground/60">
          <Link to="/" className="hover:underline">
            ← Lihat portal publik
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
          <div>
            <p className="label-caps text-muted-foreground">Peran aktif · scope {ROLE_SCOPE[role]}</p>
            <p className="font-display text-lg font-bold">{ROLE_LABEL[role]}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">Simulasi peran</span>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className="flex-1 px-4 py-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}

export function NoAccess() {
  return (
    <div className="rounded-md border border-dashed border-border bg-card px-6 py-16 text-center">
      <p className="font-display text-xl font-bold">Akses ditolak</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Peran yang sedang aktif tidak memiliki izin untuk membuka halaman ini.
      </p>
    </div>
  );
}
