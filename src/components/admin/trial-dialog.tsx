import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatarData, type AdminRow } from "@/lib/admin-data";

export function TrialDialog({
  row,
  onClose,
  onConfirm,
  saving,
}: {
  row: AdminRow | null;
  onClose: () => void;
  onConfirm: (novaData: Date) => void;
  saving: boolean;
}) {
  const [dias, setDias] = useState<number | null>(7);
  const [dataEspecifica, setDataEspecifica] = useState<Date | undefined>(undefined);

  const base = row?.empresa?.trial_ate ? new Date(row.empresa.trial_ate) : new Date();
  const inicio = base.getTime() > Date.now() ? base : new Date();
  const previsao =
    dataEspecifica ??
    (dias != null ? new Date(inicio.getTime() + dias * 86_400_000) : undefined);

  return (
    <Dialog
      open={row != null}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setDias(7);
          setDataEspecifica(undefined);
        }
      }}
    >
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Estender teste grátis</DialogTitle>
          <DialogDescription>
            {row?.empresa?.razao_social ?? "Empresa"} — trial atual até{" "}
            {formatarData(row?.empresa?.trial_ate ?? null)}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[7, 15, 30].map((d) => (
              <Button
                key={d}
                type="button"
                variant={dias === d && !dataEspecifica ? "default" : "outline"}
                className="rounded-xl"
                onClick={() => {
                  setDias(d);
                  setDataEspecifica(undefined);
                }}
              >
                +{d} dias
              </Button>
            ))}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full justify-start gap-2 rounded-xl",
                  dataEspecifica && "border-primary/40",
                )}
              >
                <CalendarIcon className="size-4" />
                {dataEspecifica
                  ? `Data escolhida: ${dataEspecifica.toLocaleDateString("pt-BR")}`
                  : "Escolher data específica"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto rounded-2xl p-0">
              <Calendar
                mode="single"
                selected={dataEspecifica}
                onSelect={(d) => {
                  setDataEspecifica(d ?? undefined);
                  if (d) setDias(null);
                }}
                disabled={{ before: new Date() }}
              />
            </PopoverContent>
          </Popover>

          <div className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
            Novo limite do trial:{" "}
            <span className="font-semibold text-foreground">
              {previsao ? previsao.toLocaleDateString("pt-BR") : "—"}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" className="rounded-xl" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="rounded-xl"
            disabled={!previsao || saving}
            onClick={() => previsao && onConfirm(previsao)}
          >
            {saving ? "Salvando..." : "Confirmar extensão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
