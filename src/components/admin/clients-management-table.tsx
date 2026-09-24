import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarPlus,
  Layers,
  MoreHorizontal,
  RotateCcw,
  Search,
  Settings2,
  UserX,
} from "lucide-react";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlanoBadge, SegmentoBadge, StatusBadge, VencimentoBadge } from "./badges";
import { TrialDialog } from "./trial-dialog";
import { PlanoDialog } from "./plano-dialog";
import { LgpdDialog } from "./lgpd-dialog";
import { SegmentoDialog } from "./segmento-dialog";
import {
  alterarSegmento,
  desativarUsuario,
  estenderTrial,
  formatarCnpj,
  formatarData,
  formatarTempoMedio,
  gerenciarPlano,
  isPlanoPermanente,
  reativarUsuario,
  type AdminRow,
  type Modalidade,
  type Plano,
} from "@/lib/admin-data";
import { sanitizarMensagemErro } from "@/lib/tratamento-erro";

export function ClientsManagementTable({
  rows,
  categorias,
}: {
  rows: AdminRow[];
  categorias: string[];
}) {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [segmento, setSegmento] = useState("todos");
  const [status, setStatus] = useState("todos");

  // Estado dos diálogos
  const [trialRow, setTrialRow] = useState<AdminRow | null>(null);
  const [planoRow, setPlanoRow] = useState<AdminRow | null>(null);
  const [segmentoRow, setSegmentoRow] = useState<AdminRow | null>(null);
  const [lgpdRow, setLgpdRow] = useState<AdminRow | null>(null);

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const trialMutation = useMutation({
    mutationFn: ({ empresaId, data }: { empresaId: string; data: Date }) =>
      estenderTrial(empresaId, data),
    onSuccess: (_d, vars) => {
      toast.success(`Trial estendido até ${vars.data.toLocaleDateString("pt-BR")}`);
      setTrialRow(null);
      void invalidar();
    },
    onError: (e: Error) =>
      toast.error(`Não foi possível estender o trial: ${sanitizarMensagemErro(e)}`),
  });

  const planoMutation = useMutation({
    mutationFn: ({
      empresaId,
      plano,
      modalidade,
      dataCustom,
    }: {
      empresaId: string;
      plano: Plano;
      modalidade: Modalidade;
      dataCustom?: Date | undefined;
    }) => gerenciarPlano(empresaId, plano, modalidade, dataCustom),
    onSuccess: (_d, vars) => {
      const labels: Record<Modalidade, string> = {
        trial: "trial",
        mensal: "mensal",
        anual: "anual",
        permanente: "permanente",
      };
      toast.success(
        `Plano ${vars.plano} (${labels[vars.modalidade]}) configurado com sucesso.`,
      );
      setPlanoRow(null);
      void invalidar();
    },
    onError: (e: Error) =>
      toast.error(`Não foi possível alterar o plano: ${sanitizarMensagemErro(e)}`),
  });

  const segmentoMutation = useMutation({
    mutationFn: ({ empresaId, categoria }: { empresaId: string; categoria: string }) =>
      alterarSegmento(empresaId, categoria),
    onSuccess: (_d, vars) => {
      const nomeFormatado =
        vars.categoria.charAt(0).toUpperCase() + vars.categoria.slice(1);
      toast.success(`Segmento alterado para "${nomeFormatado}" com sucesso.`);
      setSegmentoRow(null);
      void invalidar();
    },
    onError: (e: Error) =>
      toast.error(`Não foi possível alterar o segmento: ${sanitizarMensagemErro(e)}`),
  });

  const lgpdMutation = useMutation({
    mutationFn: ({ profileId, motivo }: { profileId: string; motivo: string }) =>
      desativarUsuario(profileId, motivo),
    onSuccess: () => {
      toast.success("Conta desativada. Histórico retido por 5 anos (LGPD).");
      setLgpdRow(null);
      void invalidar();
    },
    onError: (e: Error) =>
      toast.error(`Não foi possível desativar: ${sanitizarMensagemErro(e)}`),
  });

  const reativarMutation = useMutation({
    mutationFn: (profileId: string) => reativarUsuario(profileId),
    onSuccess: () => {
      toast.success("Acesso do usuário restaurado com sucesso.");
      void invalidar();
    },
    onError: (e: Error) =>
      toast.error(`Não foi possível reativar: ${sanitizarMensagemErro(e)}`),
  });

  // ── Filtros ────────────────────────────────────────────────────────────────
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
    <>
      <Card className="shadow-card gap-0 overflow-hidden rounded-3xl border-border p-0">
        {/* Barra de Filtros */}
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
          <div className="flex flex-wrap gap-3">
            <Select value={segmento} onValueChange={setSegmento}>
              <SelectTrigger className="w-[180px] rounded-xl">
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

        {/* Tabela de Empresas / Clientes */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Usuário / Responsável</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Tempo médio diário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-14 text-center text-muted-foreground">
                    Nenhum registro encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
              {filtradas.map((row) => {
                const permanente = isPlanoPermanente(row.empresa);
                return (
                  <TableRow key={row.profile.id} className="align-middle">
                    {/* Usuário */}
                    <TableCell>
                      <p className="font-semibold text-foreground">
                        {row.profile.nome ?? "Sem nome"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.profile.email ?? "sem e-mail"}
                      </p>
                    </TableCell>

                    {/* Empresa */}
                    <TableCell>
                      <p className="font-medium text-foreground">
                        {row.empresa?.razao_social ?? row.empresa?.nome_fantasia ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatarCnpj(row.empresa?.cnpj ?? null)}
                      </p>
                    </TableCell>

                    {/* Segmento */}
                    <TableCell>
                      <SegmentoBadge categoria={row.empresa?.categoria ?? null} />
                    </TableCell>

                    {/* Plano */}
                    <TableCell>
                      <div className="space-y-1">
                        <PlanoBadge plano={row.empresa?.plano ?? null} />
                        {row.empresa?.trial_ate && !permanente && (
                          <p className="text-xs text-muted-foreground">
                            até {formatarData(row.empresa.trial_ate)}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Vencimento */}
                    <TableCell>
                      <VencimentoBadge empresa={row.empresa} />
                    </TableCell>

                    {/* Tempo médio */}
                    <TableCell className="font-medium text-foreground">
                      {formatarTempoMedio(row.minutosMediaDia)}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <div className="space-y-1">
                        <StatusBadge status={row.status} />
                        {row.profile.desativado_em && (
                          <p className="text-xs text-muted-foreground">
                            Desde {formatarData(row.profile.desativado_em)}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Ações */}
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
                            onSelect={() => setPlanoRow(row)}
                          >
                            <Settings2 className="size-4" /> Gerenciar plano
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            disabled={!row.empresa}
                            onSelect={() => setTrialRow(row)}
                          >
                            <CalendarPlus className="size-4" /> Estender trial
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            disabled={!row.empresa}
                            onSelect={() => setSegmentoRow(row)}
                          >
                            <Layers className="size-4" /> Alterar segmento
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {row.profile.ativo === false ? (
                            <DropdownMenuItem
                              onSelect={() => reativarMutation.mutate(row.profile.id)}
                            >
                              <RotateCcw className="size-4" /> Reativar usuário
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() => setLgpdRow(row)}
                            >
                              <UserX className="size-4" /> Desativar (LGPD)
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Rodapé da tabela */}
        <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          Exibindo {filtradas.length} de {rows.length} registros
        </div>
      </Card>

      {/* Diálogos Operacionais */}
      <TrialDialog
        row={trialRow}
        saving={trialMutation.isPending}
        onClose={() => setTrialRow(null)}
        onConfirm={(data) =>
          trialRow?.empresa &&
          trialMutation.mutate({ empresaId: trialRow.empresa.id, data })
        }
      />

      <PlanoDialog
        row={planoRow}
        saving={planoMutation.isPending}
        onClose={() => setPlanoRow(null)}
        onConfirm={(plano, modalidade, dataCustom) =>
          planoRow?.empresa &&
          planoMutation.mutate({
            empresaId: planoRow.empresa.id,
            plano,
            modalidade,
            dataCustom,
          })
        }
      />

      <SegmentoDialog
        row={segmentoRow}
        categorias={categorias}
        saving={segmentoMutation.isPending}
        onClose={() => setSegmentoRow(null)}
        onConfirm={(categoria) =>
          segmentoRow?.empresa &&
          segmentoMutation.mutate({ empresaId: segmentoRow.empresa.id, categoria })
        }
      />

      <LgpdDialog
        row={lgpdRow}
        saving={lgpdMutation.isPending}
        onClose={() => setLgpdRow(null)}
        onConfirm={(motivo) =>
          lgpdRow && lgpdMutation.mutate({ profileId: lgpdRow.profile.id, motivo })
        }
      />
    </>
  );
}

/** Exportação para compatibilidade com importações legadas de EmpresasTable */
export { ClientsManagementTable as EmpresasTable };
