import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Database, Loader2, RefreshCw, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdminShell } from "@/components/admin/admin-shell";
import { KpiCards } from "@/components/admin/kpi-cards";
import { EmpresasTable } from "@/components/admin/empresas-table";
import { TrialDialog } from "@/components/admin/trial-dialog";
import { LgpdDialog } from "@/components/admin/lgpd-dialog";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  alterarPlano,
  desativarUsuario,
  estenderTrial,
  fetchAdminDashboard,
  reativarUsuario,
  type AdminRow,
} from "@/lib/admin-data";

// Login interno do painel (rota /auth). Sessões existentes entram direto.
const AUTH_URL = "/auth";

export const Route = createFileRoute("/")({
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

type Sessao =
  | { estado: "carregando" }
  | { estado: "sem_banco" }
  | { estado: "sem_admin"; email: string | null }
  | { estado: "admin"; email: string | null };

function useSessaoAdmin() {
  const [sessao, setSessao] = useState<Sessao>({ estado: "carregando" });

  useEffect(() => {
    let cancelado = false;

    async function verificar() {
      if (!isSupabaseConfigured) {
        setSessao({ estado: "sem_banco" });
        return;
      }
      const supabase = getSupabase();
      if (!supabase) return;

      const { data, error } = await supabase.auth.getUser();
      if (cancelado) return;
      if (error || !data.user) {
        window.location.href = AUTH_URL;
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin");

      if (cancelado) return;
      const email = data.user.email ?? null;
      setSessao(
        roles && roles.length > 0 ? { estado: "admin", email } : { estado: "sem_admin", email },
      );
    }

    void verificar();
    return () => {
      cancelado = true;
    };
  }, []);

  return sessao;
}

async function sair() {
  await getSupabase()?.auth.signOut();
  window.location.href = AUTH_URL;
}

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
    mutationFn: ({ empresaId, plano }: { empresaId: string; plano: string }) =>
      alterarPlano(empresaId, plano),
    onSuccess: (_d, vars) => {
      toast.success(`Plano alterado para ${vars.plano}.`);
      void invalidar();
    },
    onError: (e: Error) => toast.error(`Não foi possível alterar o plano: ${e.message}`),
  });

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
          A conta {sessao.email ?? "atual"} não possui permissão de administrador no painel
          Base 01.
        </p>
        <Button className="mt-6 rounded-xl" onClick={() => void sair()}>
          Desconectar
        </Button>
      </TelaCentral>
    );
  }

  return (
    <AdminShell email={sessao.email} onSignOut={() => void sair()}>
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
              onDesativar={setLgpdRow}
              onReativar={(row) => reativarMutation.mutate(row.profile.id)}
              onAlterarPlano={(row, plano) =>
                row.empresa && planoMutation.mutate({ empresaId: row.empresa.id, plano })
              }
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
    </AdminShell>
  );
}
