import { getSupabase } from "./supabase";

export type Empresa = {
  id: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  cnpj: string | null;
  categoria: string | null;
  plano: string | null;
  trial_ate: string | null;
  assinatura_ativa: boolean | null;
  ativa: boolean | null;
  created_at: string | null;
};

export type Profile = {
  id: string;
  empresa_id: string | null;
  nome: string | null;
  email: string | null;
  ativo: boolean | null;
  desativado_em: string | null;
  exclusao_programada_para: string | null;
  motivo_desativacao: string | null;
};

export type StatusConta = "ativo" | "trial_expirado" | "desativado_lgpd";

export type AdminRow = {
  profile: Profile;
  empresa: Empresa | null;
  minutosMediaDia: number | null;
  diasRestantesTrial: number | null;
  status: StatusConta;
};

export const PLANOS = ["trial", "starter", "pro", "enterprise"] as const;
export type Plano = (typeof PLANOS)[number];
export const MODALIDADES = ["trial", "mensal", "anual", "permanente"] as const;
export type Modalidade = (typeof MODALIDADES)[number];

export type StatusVencimento = "permanente" | "ok" | "alerta" | "critico" | "vencido" | "sem_plano";

/** Verifica se uma empresa possui plano permanente ativo. */
export function isPlanoPermanente(empresa: Empresa | null): boolean {
  if (!empresa) return false;
  if (!empresa.assinatura_ativa) return false;
  if (!empresa.trial_ate) return true;
  const ano = new Date(empresa.trial_ate).getFullYear();
  return ano >= 2099;
}

/** Classifica o estado de vencimento de uma empresa. */
export function statusVencimento(empresa: Empresa | null): StatusVencimento {
  if (!empresa) return "sem_plano";
  if (isPlanoPermanente(empresa)) return "permanente";
  if (!empresa.trial_ate) return "sem_plano";
  const dias = Math.round(
    (new Date(empresa.trial_ate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
      86_400_000,
  );
  if (dias < 0) return "vencido";
  if (dias <= 7) return "critico";
  if (dias <= 30) return "alerta";
  return "ok";
}

/** Calcula a data de vencimento baseado na modalidade escolhida. */
export function calcularVencimento(modalidade: Modalidade, dataCustom?: Date): Date | null {
  const hoje = new Date();
  switch (modalidade) {
    case "permanente":
      return null;
    case "mensal": {
      const d = new Date(hoje);
      d.setMonth(d.getMonth() + 1);
      return d;
    }
    case "anual": {
      const d = new Date(hoje);
      d.setFullYear(d.getFullYear() + 1);
      return d;
    }
    case "trial":
      return dataCustom ?? new Date(hoje.getTime() + 7 * 86_400_000);
  }
}

export const MOTIVOS_DESATIVACAO = [
  "Solicitação do titular (LGPD)",
  "Inadimplência",
  "Término de contrato",
  "Uso indevido da plataforma",
  "Outro",
] as const;

function diasAte(iso: string | null): number | null {
  if (!iso) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(iso);
  alvo.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000);
}

export function formatarTempoMedio(minutos: number | null): string {
  if (minutos === null || Number.isNaN(minutos)) return "—";
  const total = Math.round(minutos);
  if (total < 60) return `${total} min/dia`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h}h/dia` : `${h}h ${m}m/dia`;
}

export function formatarCnpj(cnpj: string | null): string {
  if (!cnpj) return "CNPJ não informado";
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function formatarData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export type AdminDashboardData = {
  rows: AdminRow[];
  kpis: {
    empresasAtivas: number;
    emTrial: number;
    expirando7Dias: number;
    assinaturasVencendo30: number;
    tempoMedioGeral: number | null;
  };
  categorias: string[];
};

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Banco de dados não conectado");

  const [empresasRes, profilesRes, atividadeRes] = await Promise.all([
    supabase.from("empresas").select("*"),
    supabase.from("profiles").select("*"),
    supabase.from("user_activity_daily").select("user_id, empresa_id, data, minutos_ativos"),
  ]);

  if (empresasRes.error) throw empresasRes.error;
  if (profilesRes.error) throw profilesRes.error;
  if (atividadeRes.error) throw atividadeRes.error;

  const empresas = (empresasRes.data ?? []) as Empresa[];
  const profiles = (profilesRes.data ?? []) as Profile[];
  const atividade = (atividadeRes.data ?? []) as Array<{
    user_id: string;
    minutos_ativos: number | null;
  }>;

  const empresasById = new Map(empresas.map((e) => [e.id, e]));

  const mediaPorUsuario = new Map<string, number>();
  const acumulado = new Map<string, { soma: number; dias: number }>();
  for (const a of atividade) {
    const atual = acumulado.get(a.user_id) ?? { soma: 0, dias: 0 };
    atual.soma += a.minutos_ativos ?? 0;
    atual.dias += 1;
    acumulado.set(a.user_id, atual);
  }
  for (const [userId, { soma, dias }] of acumulado) {
    if (dias > 0) mediaPorUsuario.set(userId, soma / dias);
  }

  const rows: AdminRow[] = profiles.map((profile) => {
    const empresa = profile.empresa_id ? empresasById.get(profile.empresa_id) ?? null : null;
    const permanente = isPlanoPermanente(empresa);
    const dias = permanente ? null : diasAte(empresa?.trial_ate ?? null);
    const trialExpirado =
      !empresa?.assinatura_ativa && empresa?.trial_ate != null && (dias ?? 0) < 0;

    const status: StatusConta =
      profile.ativo === false ? "desativado_lgpd" : trialExpirado ? "trial_expirado" : "ativo";

    return {
      profile,
      empresa,
      minutosMediaDia: mediaPorUsuario.get(profile.id) ?? null,
      diasRestantesTrial: dias,
      status,
    };
  });

  const emTrialEmpresas = empresas.filter(
    (e) => !e.assinatura_ativa && e.trial_ate != null && !isPlanoPermanente(e) && (diasAte(e.trial_ate) ?? -1) >= 0,
  );

  // Assinaturas pagas com vencimento nos próximos 30 dias (ignora permanentes)
  const assinaturasVencendo30 = empresas.filter((e) => {
    if (!e.assinatura_ativa || !e.trial_ate || isPlanoPermanente(e)) return false;
    const d = diasAte(e.trial_ate);
    return d !== null && d >= 0 && d <= 30;
  }).length;

  const medias = rows.map((r) => r.minutosMediaDia).filter((m): m is number => m != null);

  // Segmentos conhecidos base + qualquer categoria existente no banco de dados
  const categoriasSet = new Set<string>(["reciclagem", "adega"]);
  for (const emp of empresas) {
    if (emp.categoria && emp.categoria.trim()) {
      categoriasSet.add(emp.categoria.trim().toLowerCase());
    }
  }

  return {
    rows,
    kpis: {
      empresasAtivas: empresas.filter((e) => e.ativa !== false).length,
      emTrial: emTrialEmpresas.length,
      expirando7Dias: emTrialEmpresas.filter((e) => (diasAte(e.trial_ate) ?? 99) <= 7).length,
      assinaturasVencendo30,
      tempoMedioGeral: medias.length
        ? medias.reduce((a, b) => a + b, 0) / medias.length
        : null,
    },
    categorias: Array.from(categoriasSet).sort(),
  };
}

export async function estenderTrial(empresaId: string, novaData: Date) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Banco de dados não conectado");
  const { error } = await supabase
    .from("empresas")
    .update({ trial_ate: novaData.toISOString() })
    .eq("id", empresaId);
  if (error) throw error;
}

export async function alterarPlano(empresaId: string, plano: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Banco de dados não conectado");
  const { error } = await supabase.from("empresas").update({ plano }).eq("id", empresaId);
  if (error) throw error;
}

/**
 * Data sentinela no futuro para fallback caso a migration de drop not-null
 * em trial_ate ainda não tenha sido aplicada no banco ativo.
 */
export const DATA_SENTINELA_PERMANENTE = "2099-12-31T23:59:59.999Z";

/**
 * Gerencia plano + modalidade de cobrança de uma empresa.
 * Atualiza `plano`, `assinatura_ativa` e `trial_ate` numa única chamada.
 * Caso a coluna trial_ate possua constraint NOT NULL ativa no DB remoto,
 * aplica fallback transparente sem quebrar a operação.
 */
export async function gerenciarPlano(
  empresaId: string,
  plano: Plano,
  modalidade: Modalidade,
  dataCustom?: Date,
) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Banco de dados não conectado");
  const vencimento = calcularVencimento(modalidade, dataCustom);
  const assinaturaAtiva = modalidade !== "trial";
  const trialAte = vencimento ? vencimento.toISOString() : null;

  const { error } = await supabase
    .from("empresas")
    .update({
      plano,
      assinatura_ativa: assinaturaAtiva,
      trial_ate: trialAte,
    })
    .eq("id", empresaId);

  if (error) {
    // Fallback: se o banco rejeitar null em trial_ate por constraint not-null
    const isNotNullViolation =
      error.message?.includes("violates not-null constraint") ||
      error.message?.includes("trial_ate") ||
      error.code === "23502";

    if (isNotNullViolation && modalidade === "permanente") {
      const fallbackRes = await supabase
        .from("empresas")
        .update({
          plano,
          assinatura_ativa: true,
          trial_ate: DATA_SENTINELA_PERMANENTE,
        })
        .eq("id", empresaId);

      if (fallbackRes.error) throw fallbackRes.error;
      return;
    }

    throw error;
  }
}

/**
 * Altera o segmento (categoria) de uma empresa no banco de dados.
 */
export async function alterarSegmento(empresaId: string, categoria: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Banco de dados não conectado");
  const catFormatada = categoria.trim().toLowerCase();
  const { error } = await supabase
    .from("empresas")
    .update({ categoria: catFormatada })
    .eq("id", empresaId);
  if (error) throw error;
}

export async function desativarUsuario(profileId: string, motivo: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Banco de dados não conectado");
  const agora = new Date();
  const expurgo = new Date(agora);
  expurgo.setFullYear(expurgo.getFullYear() + 5);
  const { error } = await supabase
    .from("profiles")
    .update({
      ativo: false,
      desativado_em: agora.toISOString(),
      exclusao_programada_para: expurgo.toISOString(),
      motivo_desativacao: motivo,
    })
    .eq("id", profileId);
  if (error) throw error;
}

export async function reativarUsuario(profileId: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Banco de dados não conectado");
  const { error } = await supabase
    .from("profiles")
    .update({
      ativo: true,
      desativado_em: null,
      exclusao_programada_para: null,
      motivo_desativacao: null,
    })
    .eq("id", profileId);
  if (error) throw error;
}
