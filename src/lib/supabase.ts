import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Projeto Supabase do Admin Hub.
 * Credenciais lidas das variáveis de ambiente (VITE_ prefix = expostas ao browser).
 * Nunca use valores hardcoded aqui — configure o .env local.
 */
const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const key = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

export const isSupabaseConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;

/** Cliente de navegador apontando para o Supabase do admin hub. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured || typeof window === "undefined") return null;
  if (!client) {
    client = createClient(url!, key!, {
      auth: {
        storageKey: "base01-admin-auth",
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return client;
}
