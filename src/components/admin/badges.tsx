import { cn } from "@/lib/utils";
import type { StatusConta } from "@/lib/admin-data";

function Pill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        className,
      )}
    >
      {children}
    </span>
  );
}

const SEGMENTO_ESTILOS: Record<string, string> = {
  reciclagem: "border-success/25 bg-success/10 text-success",
  adega: "border-chart-5/30 bg-chart-5/10 text-chart-5",
  mercado: "border-chart-4/30 bg-chart-4/10 text-warning-foreground",
  transporte: "border-chart-3/30 bg-chart-3/10 text-chart-3",
};

export function SegmentoBadge({ categoria }: { categoria: string | null }) {
  if (!categoria) return <span className="text-xs text-muted-foreground">—</span>;
  const chave = categoria.toLowerCase();
  return (
    <Pill className={SEGMENTO_ESTILOS[chave] ?? "border-primary/25 bg-primary/10 text-primary"}>
      {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
    </Pill>
  );
}

const PLANO_ESTILOS: Record<string, string> = {
  trial: "border-warning/35 bg-warning/15 text-warning-foreground",
  starter: "border-border bg-muted text-muted-foreground",
  pro: "border-primary/30 bg-primary/10 text-primary",
  enterprise: "border-chart-3/30 bg-chart-3/10 text-chart-3",
};

export function PlanoBadge({ plano }: { plano: string | null }) {
  const chave = (plano ?? "trial").toLowerCase();
  return (
    <Pill className={PLANO_ESTILOS[chave] ?? "border-border bg-muted text-muted-foreground"}>
      {chave.charAt(0).toUpperCase() + chave.slice(1)}
    </Pill>
  );
}

const STATUS_TEXTO: Record<StatusConta, string> = {
  ativo: "Ativo",
  trial_expirado: "Trial Expirado",
  desativado_lgpd: "Desativado LGPD",
};

const STATUS_ESTILOS: Record<StatusConta, string> = {
  ativo: "border-success/25 bg-success/10 text-success",
  trial_expirado: "border-warning/35 bg-warning/15 text-warning-foreground",
  desativado_lgpd: "border-destructive/25 bg-destructive/10 text-destructive",
};

export function StatusBadge({ status }: { status: StatusConta }) {
  return <Pill className={STATUS_ESTILOS[status]}>{STATUS_TEXTO[status]}</Pill>;
}
