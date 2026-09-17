import { useMemo, useState } from "react";
import { CalendarPlus, MoreHorizontal, RotateCcw, Search, UserX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlanoBadge, SegmentoBadge, StatusBadge } from "./badges";
import {
  formatarCnpj,
  formatarData,
  formatarTempoMedio,
  PLANOS,
  type AdminRow,
} from "@/lib/admin-data";

export function EmpresasTable({
  rows,
  categorias,
  onEstenderTrial,
  onDesativar,
  onReativar,
  onAlterarPlano,
}: {
  rows: AdminRow[];
  categorias: string[];
  onEstenderTrial: (row: AdminRow) => void;
  onDesativar: (row: AdminRow) => void;
  onReativar: (row: AdminRow) => void;
  onAlterarPlano: (row: AdminRow, plano: string) => void;
}) {
  const [busca, setBusca] = useState("");
  const [segmento, setSegmento] = useState("todos");
  const [status, setStatus] = useState("todos");

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return rows.filter((r) => {
      const alvo = [
        r.profile.nome,
        r.profile.email,
        r.empresa?.razao_social,
        r.empresa?.nome_fantasia,
        r.empresa?.cnpj,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (termo && !alvo.includes(termo)) return false;
      if (segmento !== "todos" && (r.empresa?.categoria ?? "").toLowerCase() !== segmento)
        return false;
      if (status !== "todos" && r.status !== status) return false;
      return true;
    });
  }, [rows, busca, segmento, status]);

  return (
    <Card className="shadow-card gap-0 overflow-hidden rounded-3xl border-border p-0">
      <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, razão social, CNPJ ou e-mail"
            className="rounded-xl pl-9"
          />
        </div>
        <div className="flex gap-3">
          <Select value={segmento} onValueChange={setSegmento}>
            <SelectTrigger className="w-[170px] rounded-xl">
              <SelectValue placeholder="Segmento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os segmentos</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c} value={c.toLowerCase()}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="trial_expirado">Trial expirado</SelectItem>
              <SelectItem value="desativado_lgpd">Desativado LGPD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Usuário / Responsável</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Segmento</TableHead>
              <TableHead>Plano &amp; Trial</TableHead>
              <TableHead>Tempo médio diário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-14 text-center text-muted-foreground">
                  Nenhum registro encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            )}
            {filtradas.map((row) => (
              <TableRow key={row.profile.id} className="align-middle">
                <TableCell>
                  <p className="font-semibold text-foreground">
                    {row.profile.nome ?? "Sem nome"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.profile.email ?? "sem e-mail"}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-foreground">
                    {row.empresa?.razao_social ?? row.empresa?.nome_fantasia ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatarCnpj(row.empresa?.cnpj ?? null)}
                  </p>
                </TableCell>
                <TableCell>
                  <SegmentoBadge categoria={row.empresa?.categoria ?? null} />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <PlanoBadge plano={row.empresa?.plano ?? null} />
                    <p className="text-xs text-muted-foreground">
                      {row.empresa?.trial_ate
                        ? `até ${formatarData(row.empresa.trial_ate)} · ${
                            (row.diasRestantesTrial ?? 0) >= 0
                              ? `${row.diasRestantesTrial} dias restantes`
                              : `expirado há ${Math.abs(row.diasRestantesTrial ?? 0)} dias`
                          }`
                        : "sem trial"}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {formatarTempoMedio(row.minutosMediaDia)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Ações</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                      <DropdownMenuLabel>Gestão da conta</DropdownMenuLabel>
                      <DropdownMenuItem
                        disabled={!row.empresa}
                        onSelect={() => onEstenderTrial(row)}
                      >
                        <CalendarPlus className="size-4" /> Estender teste grátis
                      </DropdownMenuItem>
                      {row.profile.ativo === false ? (
                        <DropdownMenuItem onSelect={() => onReativar(row)}>
                          <RotateCcw className="size-4" /> Reativar usuário
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => onDesativar(row)}
                        >
                          <UserX className="size-4" /> Desativar (LGPD)
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Alterar plano</DropdownMenuLabel>
                      <DropdownMenuRadioGroup
                        value={(row.empresa?.plano ?? "").toLowerCase()}
                        onValueChange={(v) => onAlterarPlano(row, v)}
                      >
                        {PLANOS.map((p) => (
                          <DropdownMenuRadioItem key={p} value={p} disabled={!row.empresa}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
        Exibindo {filtradas.length} de {rows.length} registros
      </div>
    </Card>
  );
}
