import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Database, Loader2, RefreshCw, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdminShell } from "@/components/admin/admin-shell";
import { KpiCards } from "@/components/admin/kpi-cards";
import { EmpresasTable } from "@/components/admin/empresas-table";
import { TrialDialog } from "@/components/admin/trial-dialog";
import { LgpdDialog } from "@/components/admin/lgpd-dialog";
import { PlanoDialog } from "@/components/admin/plano-dialog";
import {
  desativarUsuario,
  estenderTrial,
  fetchAdminDashboard,
  gerenciarPlano,
  reativarUsuario,
  type AdminRow,
  type Modalidade,
  type Plano,
} from "@/lib/admin-data";
import { useSessaoAdmin, sairAdmin } from "@/hooks/use-sessao-admin";

export const Route = createFileRoute("/")(  {
  ssr: false,
  head: () => ({
    meta: [
      { title: "Base 01 Admin — Painel Master de Empresas e Licenças" },
      {
        name: "description",
        content:
          "Painel administrativo Base 01: gestão de empresas clientes, controle de licenças, trials e governança de dados LGPD.",
      },
      { property: "og:title", content: "Base 01 Admin — Painel Master" },
      {
        property: "og:description",
        content:
          "Gestão de empresas clientes, licenças, trials e conformidade LGPD na plataforma Base 01.",
      },
    ],
  }),
  component: AdminPage,
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

function AdminPage() {
  const sessao = useSessaoAdmin();
  const queryClient = useQueryClient();
  const [trialRow, setTrialRow] = useState<AdminRow | null>(null);
  const [lgpdRow, setLgpdRow] = useState<AdminRow | null>(null);
  const [planoRow, setPlanoRow] = useState<AdminRow | null>(null);

  const habilitado = sessao.estado === "admin";
  const dashboard = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchAdminDashboard,
    enabled: habilitado,
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });

  const trialMutation = useMutation({
    mutationFn: ({ empresaId, data }: { empresaId: string; data: Date }) =>
      estenderTrial(empresaId, data),
    onSuccess: (_d, vars) => {
      toast.success(`Trial estendido até ${vars.data.toLocaleDateString("pt-BR")}`);
      setTrialRow(null);
      void invalidar();
    },
    onError: (e: Error) => toast.error(`Não foi possível estender o trial: ${e.message}`),
  });

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
      dataCustom?: Date;
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
    onError: (e: Error) => toast.error(`Não foi possível alterar o plano: ${e.message}`),
  });

  // ── Estados de guarda ──────────────────────────────────────────────────────
  if (sessao.estado === "carregando") {
    return (
      <TelaCentral>
        <Loader2 className="mx-auto size-6 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Verificando suas permissões…</p>
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
          O painel está pronto. Para carregar empresas, usuários e métricas, conecte seu
          projeto em Configurações → Conectores → Supabase. Depois disso, os dados aparecem
          aqui automaticamente.
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
        <h1 className="mt-5 text-lg font-bold">Acesso restrito a administradores</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A conta {sessao.email ?? "atual"} autenticou com sucesso, mas não possui permissão
          de administrador no painel Base 01. Solicite a liberação ao administrador master da
          plataforma.
        </p>
        <Button className="mt-6 rounded-xl" onClick={() => void sairAdmin()}>
          Desconectar
        </Button>
      </TelaCentral>
    );
  }

  // ── Conteúdo principal ─────────────────────────────────────────────────────
  return (
    <AdminShell email={sessao.email} onSignOut={() => void sairAdmin()}>
      <div className="mx-auto max-w-[1400px] space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              Painel Master
            </p>
            <h1 className="mt-1 text-3xl font-bold text-foreground">
              Gestão de empresas &amp; licenças
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Controle de contas clientes, períodos de teste e governança de dados.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => void invalidar()}
            disabled={dashboard.isFetching}
          >
            <RefreshCw className={dashboard.isFetching ? "size-4 animate-spin" : "size-4"} />
            Atualizar
          </Button>
        </header>

        {dashboard.isError && (
          <Card className="shadow-card rounded-3xl border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            Não foi possível carregar os dados: {(dashboard.error as Error).message}
          </Card>
        )}

        {dashboard.isLoading && (
          <Card className="shadow-card rounded-3xl border-border p-10 text-center">
            <Loader2 className="mx-auto size-5 animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Carregando indicadores…</p>
          </Card>
        )}

        {dashboard.data && (
          <>
            <KpiCards kpis={dashboard.data.kpis} />
            <EmpresasTable
              rows={dashboard.data.rows}
              categorias={dashboard.data.categorias}
              onEstenderTrial={setTrialRow}
              onGerenciarPlano={setPlanoRow}
              onDesativar={setLgpdRow}
              onReativar={(row) => reativarMutation.mutate(row.profile.id)}
            />
          </>
        )}
      </div>

      <TrialDialog
        row={trialRow}
        saving={trialMutation.isPending}
        onClose={() => setTrialRow(null)}
        onConfirm={(data) =>
          trialRow?.empresa &&
          trialMutation.mutate({ empresaId: trialRow.empresa.id, data })
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
    </AdminShell>
  );
}
