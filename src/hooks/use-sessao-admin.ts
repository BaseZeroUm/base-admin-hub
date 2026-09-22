import { useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export type SessaoAdmin =
  | { estado: "carregando" }
  | { estado: "sem_banco" }
  | { estado: "sem_admin"; email: string | null }
  | { estado: "admin"; email: string | null };

const AUTH_URL = "/auth";

export async function sairAdmin() {
  await getSupabase()?.auth.signOut();
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
