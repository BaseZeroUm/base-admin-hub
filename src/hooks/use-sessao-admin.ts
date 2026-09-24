import { useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export type SessaoAdmin =
  | { estado: "carregando" }
  | { estado: "sem_banco" }
  | { estado: "sem_admin"; email: string | null }
  | { estado: "admin"; email: string | null };

import type { QueryClient } from "@tanstack/react-query";

const AUTH_URL = "/auth";

export async function sairAdmin(queryClient?: QueryClient) {
  try {
    if (queryClient) {
      await queryClient.cancelQueries();
      queryClient.clear();
    }
  } catch {}
  await getSupabase()?.auth.signOut({ scope: "global" });
  window.location.href = AUTH_URL;
}

export function useSessaoAdmin() {
  const [sessao, setSessao] = useState<SessaoAdmin>({ estado: "carregando" });

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

      const [rpcRes, profileRes] = await Promise.all([
        supabase.rpc("is_master_admin"),
        supabase
          .from("profiles")
          .select("id, ativo, desativado_em")
          .eq("id", data.user.id)
          .maybeSingle(),
      ]);

      if (rpcRes.error) {
        console.error("[useSessaoAdmin] Erro em is_master_admin:", rpcRes.error);
      }
      if (profileRes.error) {
        console.error("[useSessaoAdmin] Erro em profiles:", profileRes.error);
      }

      // Validação de conta ativa
      if (profileRes.data?.ativo === false || profileRes.data?.desativado_em) {
        await supabase.auth.signOut({ scope: "global" });
        window.location.href = AUTH_URL;
        return;
      }

      const email = data.user.email ?? null;
      const isMasterAdmin = Boolean(rpcRes.data);

      setSessao(
        isMasterAdmin ? { estado: "admin", email } : { estado: "sem_admin", email },
      );
    }

    void verificar();
    return () => {
      cancelado = true;
    };
  }, []);

  return sessao;
}
