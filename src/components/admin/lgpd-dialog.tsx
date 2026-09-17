import { useState } from "react";
import { ShieldAlert } from "lucide-react";
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
import { MOTIVOS_DESATIVACAO, type AdminRow } from "@/lib/admin-data";

export function LgpdDialog({
  row,
  onClose,
  onConfirm,
  saving,
}: {
  row: AdminRow | null;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
  saving: boolean;
}) {
  const [motivo, setMotivo] = useState<string>(MOTIVOS_DESATIVACAO[0]);
  const expurgo = new Date();
  expurgo.setFullYear(expurgo.getFullYear() + 5);

  return (
    <Dialog
      open={row != null}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setMotivo(MOTIVOS_DESATIVACAO[0]);
        }
      }}
    >
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Desativar usuário (suspensão LGPD)</DialogTitle>
          <DialogDescription>
            {row?.profile.nome ?? "Usuário"} — {row?.profile.email ?? "sem e-mail"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-3 rounded-2xl border border-warning/35 bg-warning/10 px-4 py-3">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning-foreground" />
            <p className="text-sm leading-relaxed text-warning-foreground">
              Conformidade LGPD: o acesso é bloqueado imediatamente para login, mas os
              registros históricos permanecem retidos pelo período de carência legal de 5
              anos antes do expurgo definitivo (previsto para{" "}
              <span className="font-semibold">
                {expurgo.toLocaleDateString("pt-BR")}
              </span>
              ).
            </p>
          </div>

          <div className="space-y-2">
            <Label>Motivo da desativação</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS_DESATIVACAO.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" className="rounded-xl" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="rounded-xl"
            disabled={saving}
            onClick={() => onConfirm(motivo)}
          >
            {saving ? "Desativando..." : "Desativar conta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
