import { cn } from "@/lib/utils";
import type { Empresa, StatusConta, StatusVencimento } from "@/lib/admin-data";
import { statusVencimento } from "@/lib/admin-data";

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

// ── Segmento ──────────────────────────────────────────────────────────────────

const SEGMENTO_ESTILOS: Record<string, string> = {
  reciclagem: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  adega: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400",
  mercado: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  transporte: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  varejo: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  servicos: "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  industria: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
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

// ── Plano ─────────────────────────────────────────────────────────────────────

const PLANO_ESTILOS: Record<string, string> = {
  trial:      "border-warning/35 bg-warning/15 text-warning-foreground",
  starter:    "border-border bg-muted text-muted-foreground",
  pro:        "border-primary/30 bg-primary/10 text-primary",
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

// ── Status da conta ───────────────────────────────────────────────────────────

const STATUS_TEXTO: Record<StatusConta, string> = {
  ativo:           "Ativo",
  trial_expirado:  "Trial Expirado",
  desativado_lgpd: "Desativado LGPD",
};

const STATUS_ESTILOS: Record<StatusConta, string> = {
  ativo:           "border-success/25 bg-success/10 text-success",
  trial_expirado:  "border-warning/35 bg-warning/15 text-warning-foreground",
  desativado_lgpd: "border-destructive/25 bg-destructive/10 text-destructive",
};

export function StatusBadge({ status }: { status: StatusConta }) {
  return <Pill className={STATUS_ESTILOS[status]}>{STATUS_TEXTO[status]}</Pill>;
}

// ── Vencimento ────────────────────────────────────────────────────────────────

const VENCIMENTO_ESTILOS: Record<StatusVencimento, string> = {
  permanente: "border-success/25 bg-success/10 text-success",
  ok:         "border-primary/25 bg-primary/10 text-primary",
  alerta:     "border-warning/35 bg-warning/15 text-warning-foreground",
  critico:    "border-destructive/25 bg-destructive/10 text-destructive",
  vencido:    "border-destructive/40 bg-destructive/15 text-destructive",
  sem_plano:  "border-border bg-muted text-muted-foreground",
};

function diasRestantesNum(trial_ate: string | null): number | null {
  if (!trial_ate) return null;
  return Math.round(
    (new Date(trial_ate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86_400_000,
  );
}

export function VencimentoBadge({ empresa }: { empresa: Empresa | null }) {
  const sv = statusVencimento(empresa);

  if (sv === "permanente") {
    return <Pill className={VENCIMENTO_ESTILOS.permanente}>Permanente ∞</Pill>;
  }
  if (sv === "sem_plano") {
    return <Pill className={VENCIMENTO_ESTILOS.sem_plano}>Sem plano</Pill>;
  }

  const dias = diasRestantesNum(empresa?.trial_ate ?? null);

  if (sv === "vencido") {
    return (
      <Pill className={VENCIMENTO_ESTILOS.vencido}>
        Vencido há {Math.abs(dias ?? 0)} dias
      </Pill>
    );
  }

  return (
    <Pill className={VENCIMENTO_ESTILOS[sv]}>
      {dias === 0 ? "Vence hoje" : `Vence em ${dias} dias`}
    </Pill>
  );
}
