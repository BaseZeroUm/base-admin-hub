import { AlarmClock, BellRing, Clock, Building2, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatarTempoMedio, type AdminDashboardData } from "@/lib/admin-data";
import { cn } from "@/lib/utils";

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  tone: string;
}) {
  return (
    <Card className="shadow-card gap-0 rounded-3xl border-border p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("flex size-9 items-center justify-center rounded-2xl", tone)}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}

export function KpiCards({ kpis }: { kpis: AdminDashboardData["kpis"] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Kpi
        icon={Building2}
        label="Empresas ativas"
        value={String(kpis.empresasAtivas)}
        hint="Contas habilitadas na plataforma"
        tone="bg-primary/10 text-primary"
      />
      <Kpi
        icon={Sparkles}
        label="Em período de teste"
        value={String(kpis.emTrial)}
        hint="Trials vigentes sem assinatura"
        tone="bg-accent text-accent-foreground"
      />
      <Kpi
        icon={AlarmClock}
        label="Trials expirando (7 dias)"
        value={String(kpis.expirando7Dias)}
        hint="Requer contato comercial urgente"
        tone="bg-warning/15 text-warning-foreground"
      />
      <Kpi
        icon={BellRing}
        label="Assinaturas vencendo (30d)"
        value={String(kpis.assinaturasVencendo30)}
        hint="Renovações a confirmar no mês"
        tone={
          kpis.assinaturasVencendo30 > 0
            ? "bg-warning/15 text-warning-foreground"
            : "bg-success/10 text-success"
        }
      />
      <Kpi
        icon={Clock}
        label="Tempo médio de uso"
        value={formatarTempoMedio(kpis.tempoMedioGeral)}
        hint="Média geral por usuário/dia"
        tone="bg-success/10 text-success"
      />
    </div>
  );
}
