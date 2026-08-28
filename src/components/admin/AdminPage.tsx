import type { ReactNode } from "react";
import { AdminLayout, NoAccess } from "@/components/AdminLayout";
import { PageHeader } from "@/components/PageHeader";
import { useRbac, type Permission } from "@/lib/rbac";

export function AdminPage({
  title,
  description,
  permission,
  actions,
  children,
}: {
  title: string;
  description?: string;
  permission: Permission;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { can } = useRbac();
  return (
    <AdminLayout>
      <PageHeader title={title} description={description} actions={can(permission) ? actions : undefined} />
      {can(permission) ? children : <NoAccess />}
    </AdminLayout>
  );
}

export function DataTable({
  columns,
  children,
  caption,
}: {
  columns: string[];
  children: ReactNode;
  caption?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      {caption && <p className="label-caps border-b border-border bg-muted px-3 py-2">{caption}</p>}
      <table className="w-full min-w-[640px] text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b border-border">
            {columns.map((c) => (
              <th key={c} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <tr className="border-b border-border last:border-0 hover:bg-accent/50">{children}</tr>;
}

export function Cell({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={`px-3 py-2 align-middle ${className ?? ""}`}>{children}</td>;
}
