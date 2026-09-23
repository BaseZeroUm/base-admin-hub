import { useState, useEffect } from "react";
import { Layers, Store, Recycle, Check, Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AdminRow } from "@/lib/admin-data";
import { SegmentoBadge } from "./badges";

const DESCRICOES_SEGMENTO: Record<string, { label: string; desc: string; icon: typeof Store }> = {
  reciclagem: {
    label: "Reciclagem",
    desc: "Gestão operacional de triagem, pesagens, estoque de fardos e materiais.",
    icon: Recycle,
  },
  adega: {
    label: "Adega",
    desc: "Controle especializado de vinhos, safras, garrafas, barris e degustações.",
    icon: Store,
  },
};

export function SegmentoDialog({
  row,
  categorias,
  onClose,
  onConfirm,
  saving,
}: {
  row: AdminRow | null;
  categorias: string[];
  onClose: () => void;
  onConfirm: (categoria: string) => void;
  saving: boolean;
}) {
  const categoriaAtual = row?.empresa?.categoria?.toLowerCase() ?? "reciclagem";
  const [segmento, setSegmento] = useState<string>(categoriaAtual);
  const [customSegmento, setCustomSegmento] = useState<string>("");
  const [usarCustom, setUsarCustom] = useState(false);

  useEffect(() => {
    if (row) {
      const cat = row.empresa?.categoria?.toLowerCase() ?? "reciclagem";
      setSegmento(cat);
      setCustomSegmento("");
      setUsarCustom(false);
    }
  }, [row]);

  function handleClose() {
    onClose();
    setUsarCustom(false);
    setCustomSegmento("");
  }

  function handleSalvar() {
    const finalSegmento = usarCustom
      ? customSegmento.trim().toLowerCase()
      : segmento.trim().toLowerCase();

    if (!finalSegmento) return;
    onConfirm(finalSegmento);
  }

  const segmentoFinal = usarCustom ? customSegmento : segmento;
  const mudou = segmentoFinal.trim().toLowerCase() !== categoriaAtual;

  return (
    <Dialog open={row != null} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers className="size-5" />
            </div>
            <div>
              <DialogTitle>Alterar segmento</DialogTitle>
              <DialogDescription className="mt-0.5">
                Defina o segmento de atuação da empresa para determinar seu dashboard e módulos.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Informações da empresa */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 p-3.5 text-sm">
            <div>
              <p className="font-semibold text-foreground">
                {row?.empresa?.razao_social ?? row?.empresa?.nome_fantasia ?? "Empresa"}
              </p>
              <p className="text-xs text-muted-foreground">{row?.profile?.email ?? "Sem e-mail"}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Segmento atual</p>
              <SegmentoBadge categoria={row?.empresa?.categoria ?? null} />
            </div>
          </div>

          {/* Seleção de Segmento */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="select-segmento">Novo segmento</Label>
              <button
                type="button"
                onClick={() => setUsarCustom(!usarCustom)}
                className="text-xs font-medium text-primary hover:underline"
              >
                {usarCustom ? "Escolher da lista existente" : "+ Criar outro segmento"}
              </button>
            </div>

            {usarCustom ? (
              <div className="space-y-1.5">
                <Input
                  id="custom-segmento"
                  placeholder="Nome do segmento (ex: farmacia, logistica)"
                  value={customSegmento}
                  onChange={(e) => setCustomSegmento(e.target.value)}
                  className="rounded-xl"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  O novo segmento será registrado e adicionado aos filtros dinâmicos.
                </p>
              </div>
            ) : (
              <Select value={segmento} onValueChange={setSegmento}>
                <SelectTrigger id="select-segmento" className="rounded-xl">
                  <SelectValue placeholder="Selecione o segmento" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => {
                    const info = DESCRICOES_SEGMENTO[c.toLowerCase()];
                    return (
                      <SelectItem key={c} value={c.toLowerCase()}>
                        {info?.label ?? c.charAt(0).toUpperCase() + c.slice(1)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Cards de visualização rápida dos segmentos principais */}
          {!usarCustom && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              {(["reciclagem", "adega"] as const).map((key) => {
                const info = DESCRICOES_SEGMENTO[key] ?? {
                  label: key,
                  desc: "",
                  icon: Store,
                };
                const Icon = info.icon;
                const isSelected = segmento === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSegmento(key)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-colors",
                      isSelected
                        ? "border-primary/40 bg-primary/10 text-foreground ring-1 ring-primary/20"
                        : "border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-muted/40",
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Icon className="size-3.5 text-primary" />
                        {info.label}
                      </span>
                      {isSelected && <Check className="size-3.5 text-primary" />}
                    </div>
                    <p className="text-[11px] leading-tight text-muted-foreground mt-0.5">
                      {info.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Aviso se for Adega */}
          {(segmentoFinal === "adega" || (!usarCustom && segmento === "adega")) && (
            <div className="rounded-2xl border border-purple-500/25 bg-purple-500/10 p-3 text-xs text-purple-900 dark:text-purple-300">
              <p className="font-semibold flex items-center gap-1.5">
                <Store className="size-4" /> Módulo Adega em preparação
              </p>
              <p className="mt-1 leading-relaxed opacity-90">
                Ao selecionar o segmento Adega, o cliente visualizará a tela personalizada de
                apresentação do módulo em desenvolvimento.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" className="rounded-xl" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            className="rounded-xl"
            disabled={saving || (usarCustom && !customSegmento.trim()) || !mudou}
            onClick={handleSalvar}
          >
            {saving ? "Salvando..." : "Salvar segmento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
