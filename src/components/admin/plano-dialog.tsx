import { useState } from "react";
import { CalendarIcon, CreditCard, Infinity, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  calcularVencimento,
  formatarData,
  PLANOS,
  type AdminRow,
  type Modalidade,
  type Plano,
} from "@/lib/admin-data";

const MODALIDADE_CONFIG: {
  value: Modalidade;
  label: string;
  descricao: string;
  icon: typeof CreditCard;
}[] = [
  {
    value: "trial",
    label: "Trial",
    descricao: "Acesso por tempo limitado (grátis)",
    icon: CalendarIcon,
  },
  {
    value: "mensal",
    label: "Mensal",
    descricao: "Assinatura renovável todo mês",
    icon: RefreshCw,
  },
  {
    value: "anual",
    label: "Anual",
    descricao: "Assinatura renovável todo ano",
    icon: CreditCard,
  },
  {
    value: "permanente",
    label: "Permanente",
    descricao: "Acesso sem data de vencimento",
    icon: Infinity,
  },
];

export function PlanoDialog({
  row,
  onClose,
  onConfirm,
  saving,
}: {
  row: AdminRow | null;
  onClose: () => void;
  onConfirm: (plano: Plano, modalidade: Modalidade, dataCustom?: Date) => void;
  saving: boolean;
}) {
  const planoAtual = (row?.empresa?.plano ?? "trial") as Plano;
  const [plano, setPlano] = useState<Plano>(planoAtual === "trial" ? "starter" : planoAtual);
  const [modalidade, setModalidade] = useState<Modalidade>("mensal");
  const [dataCustom, setDataCustom] = useState<Date | undefined>(undefined);

  const previsao =
    modalidade === "permanente"
      ? null
      : modalidade === "trial"
        ? (dataCustom ?? calcularVencimento("trial"))
        : calcularVencimento(modalidade);

  function handleClose() {
    onClose();
    setPlano("starter");
    setModalidade("mensal");
    setDataCustom(undefined);
  }

  return (
    <Dialog
      open={row != null}
      onOpenChange={(o) => { if (!o) handleClose(); }}
    >
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerenciar plano</DialogTitle>
          <DialogDescription>
            {row?.empresa?.razao_social ?? row?.empresa?.nome_fantasia ?? "Empresa"} —{" "}
            plano atual:{" "}
            <strong>{row?.empresa?.plano ?? "sem plano"}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Seletor de plano */}
          <div className="space-y-2">
            <Label htmlFor="select-plano">Plano</Label>
            <Select
              value={plano}
              onValueChange={(v) => setPlano(v as Plano)}
            >
              <SelectTrigger id="select-plano" className="rounded-xl">
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                {PLANOS.filter((p) => p !== "trial").map((p) => (
                  <SelectItem key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seletor de modalidade */}
          <div className="space-y-2">
            <Label>Modalidade de acesso</Label>
            <div className="grid grid-cols-2 gap-2">
              {MODALIDADE_CONFIG.map(({ value, label, descricao, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  id={`modalidade-${value}`}
                  onClick={() => {
                    setModalidade(value);
                    if (value !== "trial") setDataCustom(undefined);
                  }}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-2xl border p-3 text-left text-sm transition-colors",
                    modalidade === value
                      ? "border-primary/40 bg-primary/8 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/20 hover:bg-muted/40",
                  )}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Icon className="size-4 shrink-0" />
                    {label}
                  </span>
                  <span className="text-xs leading-relaxed opacity-80">{descricao}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date picker para trial */}
          {modalidade === "trial" && (
            <div className="space-y-2">
              <Label>Data de fim do trial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start gap-2 rounded-xl",
                      dataCustom && "border-primary/40",
                    )}
                  >
                    <CalendarIcon className="size-4" />
                    {dataCustom
                      ? dataCustom.toLocaleDateString("pt-BR")
                      : "Escolher data (padrão: +7 dias)"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto rounded-2xl p-0">
                  <Calendar
                    mode="single"
                    selected={dataCustom}
                    onSelect={(d) => setDataCustom(d ?? undefined)}
                    disabled={{ before: new Date() }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Preview do vencimento */}
          <div
            className={cn(
              "rounded-2xl px-4 py-3 text-sm",
              modalidade === "permanente"
                ? "bg-success/8 text-success"
                : "bg-muted/60 text-muted-foreground",
            )}
          >
            {modalidade === "permanente" ? (
              <span className="font-semibold">Acesso permanente — sem data de vencimento</span>
            ) : (
              <>
                Novo vencimento:{" "}
                <span className="font-semibold text-foreground">
                  {previsao ? formatarData(previsao.toISOString()) : "—"}
                </span>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" className="rounded-xl" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            className="rounded-xl"
            disabled={saving}
            onClick={() => onConfirm(plano, modalidade, dataCustom)}
          >
            {saving ? "Salvando..." : "Confirmar plano"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
