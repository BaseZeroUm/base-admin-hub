import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Database,
  Loader2,
  RotateCcw,
  Search,
  ShieldX,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminShell } from "@/components/admin/admin-shell";
import { LgpdDialog } from "@/components/admin/lgpd-dialog";
import { StatusBadge } from "@/components/admin/badges";
import {
  desativarUsuario,
  fetchAdminDashboard,
  formatarData,
  formatarTempoMedio,
  reativarUsuario,
  type AdminRow,
} from "@/lib/admin-data";
import { useSessaoAdmin, sairAdmin } from "@/hooks/use-sessao-admin";

export const Route = createFileRoute("/usuarios")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Base 01 Admin — Usuários" },
      {
        name: "description",
        content:
          "Lista de usuários da plataforma Base 01: status, empresa e gestão de acesso.",
      },
    ],
  }),
  component: UsuariosPage,
});

function TelaCentral({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="shadow-card w-full max-w-md rounded-3xl border-border p-8 text-center">
        {children}
      </Card>
    </div>
  );
}

function TabelaUsuarios({
  rows,
  onDesativar,
  onReativar,
}: {
  rows: AdminRow[];
  onDesativar: (row: AdminRow) => void;
  onReativar: (row: AdminRow) => void;
}) {
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return rows.filter((r) => {
      const alvo = [r.profile.nome, r.profile.email, r.empresa?.razao_social]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (termo && !alvo.includes(termo)) return false;
      if (statusFiltro !== "todos" && r.status !== statusFiltro) return false;
      return true;
    });
  }, [rows, busca, statusFiltro]);

  return (
    <Card className="shadow-card gap-0 overflow-hidden rounded-3xl border-border p-0">
      {/* Filtros */}
      <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="busca-usuarios"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail ou empresa"
            className="rounded-xl pl-9"
          />
        </div>
        <Select value={statusFiltro} onValueChange={setStatusFiltro}>
          <SelectTrigger id="filtro-status-usuarios" className="w-[180px] rounded-xl">
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

      {/* Tabela */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Usuário</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tempo médio diário</TableHead>
              <TableHead>Desde</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-14 text-center text-muted-foreground"
                >
                  Nenhum usuário encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            )}
            {filtrados.map((row) => (
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
                    {row.empresa?.nome_fantasia ??
                      row.empresa?.razao_social ??
                      "—"}
                  </p>
                  {row.empresa?.plano && (
                    <p className="text-xs capitalize text-muted-foreground">
                      {row.empresa.plano}
                    </p>
                  )}
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    <StatusBadge status={row.status} />
                    {row.profile.desativado_em && (
                      <p className="text-xs text-muted-foreground">
                        Desativado em {formatarData(row.profile.desativado_em)}
                      </p>
                    )}
                    {row.profile.exclusao_programada_para && (
                      <p className="text-xs text-muted-foreground">
                        Expurgo em {formatarData(row.profile.exclusao_programada_para)}
                      </p>
                    )}
                  </div>
                </TableCell>

                <TableCell className="font-medium text-foreground">
                  {formatarTempoMedio(row.minutosMediaDia)}
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  {formatarData(row.empresa?.created_at ?? null)}
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl"
                        id={`acoes-usuario-${row.profile.id}`}
                      >
                        Ações
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 rounded-2xl">
                      <DropdownMenuLabel>Gestão de acesso</DropdownMenuLabel>
                      {row.profile.ativo === false ? (
                        <DropdownMenuItem onSelect={() => onReativar(row)}>
                          <RotateCcw className="size-4" /> Reativar acesso
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => onDesativar(row)}
                        >
                          <UserX className="size-4" /> Desativar (LGPD)
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
        Exibindo {filtrados.length} de {rows.length} usuários
      </div>
    </Card>
  );
}

function UsuariosPage() {
  const sessao = useSessaoAdmin();
  const queryClient = useQueryClient();
  const [lgpdRow, setLgpdRow] = useState<AdminRow | null>(null);

  const habilitado = sessao.estado === "admin";
  const dashboard = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchAdminDashboard,
    enabled: habilitado,
  });

  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });

  const lgpdMutation = useMutation({
    mutationFn: ({ profileId, motivo }: { profileId: string; motivo: string }) =>
      desativarUsuario(profileId, motivo),
    onSuccess: () => {
      toast.success("Conta desativada. Histórico retido por 5 anos (LGPD).");
      setLgpdRow(null);
      void invalidar();
    },
    onError: (e: Error) => toast.error(`Não foi possível desativar: ${e.message}`),
  });

  const reativarMutation = useMutation({
    mutationFn: (profileId: string) => reativarUsuario(profileId),
    onSuccess: () => {
      toast.success("Acesso do usuário restaurado.");
      void invalidar();
    },
    onError: (e: Error) => toast.error(`Não foi possível reativar: ${e.message}`),
  });

  // ── Estados de guarda ──────────────────────────────────────────────────────
  if (sessao.estado === "carregando") {
    return (
      <TelaCentral>
        <Loader2 className="mx-auto size-6 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">
          Verificando suas permissões…
        </p>
      </TelaCentral>
    );
  }

  if (sessao.estado === "sem_banco") {
    return (
      <TelaCentral>
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Database className="size-5" />
        </div>
        <h1 className="mt-5 text-lg font-bold">Conecte seu banco de dados</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Configure as variáveis de ambiente para carregar os usuários.
        </p>
      </TelaCentral>
    );
  }

  if (sessao.estado === "sem_admin") {
    return (
      <TelaCentral>
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldX className="size-5" />
        </div>
        <h1 className="mt-5 text-lg font-bold">
          Acesso restrito a administradores
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A conta {sessao.email ?? "atual"} não possui permissão de
          administrador.
        </p>
        <Button
          className="mt-6 rounded-xl"
          onClick={() => void sairAdmin()}
        >
          Desconectar
        </Button>
      </TelaCentral>
    );
  }

  // ── Conteúdo principal ─────────────────────────────────────────────────────
  return (
    <AdminShell email={sessao.email} onSignOut={() => void sairAdmin()}>
      <div className="mx-auto max-w-[1400px] space-y-8">
        <header>
          <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            Gestão de acesso
          </p>
          <h1 className="mt-1 text-3xl font-bold text-foreground">Usuários</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lista de todos os usuários cadastrados, status de conta e
            conformidade LGPD.
          </p>
        </header>

        {dashboard.isError && (
          <Card className="shadow-card rounded-3xl border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            Não foi possível carregar os dados:{" "}
            {(dashboard.error as Error).message}
          </Card>
        )}

        {dashboard.isLoading && (
          <Card className="shadow-card rounded-3xl border-border p-10 text-center">
            <Loader2 className="mx-auto size-5 animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">
              Carregando usuários…
            </p>
          </Card>
        )}

        {dashboard.data && (
          <TabelaUsuarios
            rows={dashboard.data.rows}
            onDesativar={setLgpdRow}
            onReativar={(row) => reativarMutation.mutate(row.profile.id)}
          />
        )}
      </div>

      <LgpdDialog
        row={lgpdRow}
        saving={lgpdMutation.isPending}
        onClose={() => setLgpdRow(null)}
        onConfirm={(motivo) =>
          lgpdRow &&
          lgpdMutation.mutate({ profileId: lgpdRow.profile.id, motivo })
        }
      />
    </AdminShell>
  );
}
