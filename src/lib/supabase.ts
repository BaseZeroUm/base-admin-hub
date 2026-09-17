import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Projeto Supabase externo do cliente (Base 01).
 * A chave anon é publicável — pode ficar no código do front-end.
 */
const EXTERNAL_SUPABASE_URL = "https://vqemjfcfeizgcnpihyve.supabase.co";
const EXTERNAL_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxZW1qZmNmZWl6Z2NucGloeXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NjA2MjEsImV4cCI6MjEwNDUzNjYyMX0.W4gQ_LihECEPUHrI6zrZvn2UtqwHyBN1q9h35oXhk3g";

const url = EXTERNAL_SUPABASE_URL;
const key = EXTERNAL_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;

/** Cliente de navegador apontando para o Supabase externo do cliente. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured || typeof window === "undefined") return null;
  if (!client) {
    client = createClient(url, key, {
      auth: {
        storageKey: "base01-admin-auth",
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return client;
}
