import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Loader2, LockKeyhole, MailCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Base 01 Admin — Acesso ao Painel Master" },
      {
        name: "description",
        content: "Autenticação administrativa do painel Base 01: empresas, licenças e governança de dados.",
      },
      { property: "og:title", content: "Base 01 Admin — Acesso" },
      {
        property: "og:description",
        content: "Entre com suas credenciais para acessar o painel master Base 01.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Modo = "entrar" | "criar";

function Marca() {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-brand-gradient flex size-10 items-center justify-center rounded-2xl font-bold text-primary-foreground shadow-brand">
        01
      </div>
      <div>
        <p className="text-sm font-bold tracking-wide">Base 01</p>
        <p className="text-xs text-sidebar-foreground/60">Painel Master</p>
      </div>
    </div>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<Modo>("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);

  // SSO: se já existe sessão ativa, entra direto no painel.
  useEffect(() => {
    let cancelado = false;
    const supabase = getSupabase();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => {
      if (!cancelado && data.user) void navigate({ to: "/" });
    });
    return () => {
      cancelado = true;
    };
  }, [navigate]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setEnviando(false);
    if (error) {
      toast.error("Credenciais inválidas. Verifique e-mail e senha.");
      return;
    }
    void navigate({ to: "/" });
  }

  async function criarConta(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setEnviando(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome },
        emailRedirectTo: window.location.origin + "/auth",
      },
    });
    setEnviando(false);
    if (error) {
      toast.error(`Não foi possível criar a conta: ${error.message}`);
      return;
    }
    setAguardandoConfirmacao(true);
  }

  const supabaseOk = isSupabaseConfigured;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Painel institucional */}
      <aside className="bg-sidebar text-sidebar-foreground relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <div className="bg-brand-gradient pointer-events-none absolute -top-32 -right-32 size-96 rounded-full opacity-20 blur-3xl" />
        <Marca />
        <div className="relative space-y-5">
          <h1 className="text-3xl font-bold leading-tight">
            Gestão de empresas &amp; licenças <span className="text-brand-gradient">em um só lugar</span>
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-sidebar-foreground/70">
            Controle contas clientes, períodos de teste, uso da plataforma e governança de dados
            com a segurança que a Base 01 exige.
          </p>
          <ul className="space-y-2 text-sm text-sidebar-foreground/80">
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-brand-mint" /> Acesso restrito a administradores
            </li>
            <li className="flex items-center gap-2">
              <LockKeyhole className="size-4 text-brand-mint" /> Conformidade LGPD com retenção auditável
            </li>
          </ul>
        </div>
        <p className="text-xs text-sidebar-foreground/40">© {new Date().getFullYear()} Base 01</p>
      </aside>

      {/* Formulário */}
      <main className="flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Marca />
          </div>

          {aguardandoConfirmacao ? (
            <div className="shadow-card rounded-3xl border-border bg-card p-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <MailCheck className="size-5" />
              </div>
              <h2 className="mt-5 text-lg font-bold">Confirme seu e-mail</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Enviamos um link de confirmação para <strong>{email}</strong>. Após confirmar,
                volte aqui e entre com suas credenciais.
              </p>
              <Button
                variant="outline"
                className="mt-6 w-full rounded-xl"
                onClick={() => {
                  setAguardandoConfirmacao(false);
                  setModo("entrar");
                }}
              >
                Voltar para o login
              </Button>
            </div>
          ) : (
            <div className="shadow-card rounded-3xl border-border bg-card p-8">
              <h2 className="text-2xl font-bold tracking-tight">
                {modo === "entrar" ? "Acesse o painel" : "Criar conta"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {modo === "entrar"
                  ? "Entre com suas credenciais administrativas."
                  : "Cadastre-se para solicitar acesso ao painel."}
              </p>

              {!supabaseOk && (
                <p className="mt-4 rounded-xl bg-warning/15 p-3 text-xs text-warning-foreground">
                  Banco de dados não conectado. Conecte o projeto antes de autenticar.
                </p>
              )}

              <form className="mt-6 space-y-4" onSubmit={modo === "entrar" ? entrar : criarConta}>
                {modo === "criar" && (
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      className="rounded-xl"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Seu nome"
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    className="rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@empresa.com.br"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    className="rounded-xl"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete={modo === "entrar" ? "current-password" : "new-password"}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-xl shadow-brand"
                  disabled={enviando || !supabaseOk}
                >
                  {enviando ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      {modo === "entrar" ? "Entrar" : "Criar conta"}
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>

              <button
                type="button"
                className="mt-6 w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
              >
                {modo === "entrar" ? (
                  <>
                    Não tem conta? <span className="font-semibold text-primary">Criar conta</span>
                  </>
                ) : (
                  <>
                    Já tem conta? <span className="font-semibold text-primary">Entrar</span>
                  </>
                )}
              </button>
            </div>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            O acesso ao painel é liberado apenas para contas com permissão de administrador.
          </p>
        </div>
      </main>
    </div>
  );
}
