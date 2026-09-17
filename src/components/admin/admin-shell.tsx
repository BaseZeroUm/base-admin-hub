import { useState, type ReactNode } from "react";
import {
  Building2,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { label: "Visão geral", icon: LayoutDashboard, active: true },
  { label: "Empresas", icon: Building2, active: false },
  { label: "Usuários", icon: Users, active: false },
  { label: "Governança LGPD", icon: ShieldCheck, active: false },
];

export function AdminShell({
  children,
  email,
  onSignOut,
}: {
  children: ReactNode;
  email?: string | null;
  onSignOut?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside
        className={cn(
          "sticky top-0 flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300",
          collapsed ? "w-[76px]" : "w-[268px]",
        )}
      >
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="bg-brand-gradient flex size-10 shrink-0 items-center justify-center rounded-2xl text-base font-extrabold text-sidebar-primary-foreground">
            01
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight">Base 01 Admin</p>
              <p className="truncate text-xs text-sidebar-foreground/60">Painel Master</p>
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map(({ label, icon: Icon, active }) => (
            <button
              key={label}
              type="button"
              title={label}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </button>
          ))}
        </nav>

        <div className="space-y-2 border-t border-sidebar-border p-3">
          {!collapsed && email && (
            <p className="truncate px-2 text-xs text-sidebar-foreground/60">{email}</p>
          )}
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              title="Sair"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            >
              <LogOut className="size-[18px] shrink-0" />
              {!collapsed && "Sair"}
            </button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed((v) => !v)}
            className="w-full justify-start gap-3 rounded-xl px-3 text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          >
            <ChevronLeft
              className={cn("size-[18px] transition-transform", collapsed && "rotate-180")}
            />
            {!collapsed && "Recolher"}
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">{children}</main>
    </div>
  );
}
