# Base Admin Hub

Crie uma aplicação de Painel Administrativo Master (B2B SaaS) para a plataforma "Base 01" (Base Zero Um), com foco em gestão de empresas clientes, controle de licenças e governança de dados.

### 1. Identidade Visual & Design System

- Padrão visual: Clean, moderno, executivo e corporativo (estilo Base 01).

- Layout: Sidebar escura e elegante com navegação colapsável, logotipo "Base 01 Admin", e área principal em fundo neutro/cinza suave (`bg-muted/30` ou `bg-slate-50`).

- Componentes: Shadcn UI, Tailwind CSS, Lucide React icons, bordas sutis (`border-border`), cartões com cantos arredondados generosos (`rounded-2xl` ou `rounded-3xl`) e sombras suaves (`shadow-sm`).

- Badges coloridos e semânticos para segmentos (Reciclagem, Adega), planos (Trial, Pro) e status (Ativo, Expirado, Desativado LGPD).

### 2. Estrutura do Banco de Dados (Supabase existente)

A aplicação deve conectar ao meu projeto Supabase já existente e interagir com as seguintes tabelas:

- `public.empresas`: `id`, `razao_social`, `nome_fantasia`, `cnpj`, `categoria` (reciclagem, adega, etc.), `plano`, `trial_ate`, `assinatura_ativa`, `ativa`, `created_at`.

- `public.profiles`: `id`, `empresa_id`, `nome`, `email`, `ativo`, `desativado_em`, `exclusao_programada_para`, `motivo_desativacao`.

- `public.user_roles`: `user_id`, `empresa_id`, `role` (apenas quem tem role 'admin' pode operar este painel).

- `public.user_activity_daily`: `user_id`, `empresa_id`, `data`, `minutos_ativos`, `ultimo_ping` (usado para calcular o tempo médio diário de cada usuário).

### 3. Funcionalidades da Interface

#### A. Topo & Cards de Indicadores (KPIs)

- Total de Empresas Ativas

- Total de Contas em Período de Teste (Trial)

- Contas expirando nos próximos 7 dias

- Tempo Médio Geral de Uso da plataforma por dia

#### B. Tabela Principal de Gestão (Empresas & Usuários)

Uma tabela completa com busca por nome/razão social/e-mail, filtro por segmento (Todos, Reciclagem, Adega) e filtro por status:

- Colunas:

  1. Usuário / Responsável (Nome e e-mail)

  2. Empresa (Razão Social e CNPJ)

  3. Segmento (Badge visual: Reciclagem, Adega, etc.)

  4. Plano & Trial (Exibe o plano, a data limite do trial e dias restantes)

  5. Tempo Médio Diário (Calcula a média de `minutos_ativos` do usuário em `user_activity_daily` e formata ex: "45 min/dia" ou "1h 20m/dia")

  6. Status (Badge: "Ativo", "Trial Expirado" ou "Desativado LGPD")

  7. Ações (Menu dropdown com opções rápidas)

#### C. Ações & Modais de Gestão

1. **Estender Teste Grátis (Modal):**

   - Permite somar dias à coluna `trial_ate` da empresa (+7 dias, +15 dias, +30 dias ou selecionar uma data específica no calendário).

   - Atualiza `trial_ate` no Supabase e exibe notificação de sucesso com Sonner toast.

2. **Desativar Usuário / Suspensão LGPD (Modal de Soft-Delete):**

   - Exibe aviso de conformidade LGPD: a conta será bloqueada imediatamente para login, mas os registros históricos permanecem retidos pelo período de carência legal (5 anos) antes do expurgo.

   - Campos: Seleção do motivo da desativação (ex: "Solicitação do titular (LGPD)", "Inadimplência", "Término de contrato").

   - Ação: Atualiza a tabela `profiles` definindo `ativo = false`, `desativado_em = now()`, `exclusao_programada_para = (now() + 5 anos)` e salva o motivo.

3. **Reativar Usuário:**

   - Botão para restaurar o acesso de contas suspensas (`ativo = true`, limpando `desativado_em`).

4. **Alterar Plano:**

   - Dropdown direto ou modal para trocar o plano da empresa (`trial`, `starter`, `pro`, `enterprise`).

### 4. Proteção de Acesso (Admin Guard)

- Se não houver usuário logado, redirecionar para `https://app.basezeroum.com.br/auth`.

- Se o usuário logado não possuir registro com `role = 'admin'` na tabela `user_roles`, bloquear a tela com mensagem de "Acesso restrito a administradores" e botão para desconectar.

@import "tailwindcss" source(none);
@source "../src";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

/*
 * Base 01 — design system.
 * Paleta derivada da logo: azul (#4FA8DE) -> verde-água (#7FD1A8).
 * Nunca usar cores literais nos componentes: sempre tokens semânticos.
 */

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --radius-4xl: calc(var(--radius) + 16px);
  --font-sans: "Manrope", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Manrope", ui-sans-serif, system-ui, sans-serif;
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-brand-blue: var(--brand-blue);
  --color-brand-mint: var(--brand-mint);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-ring-offset-background: var(--background);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

:root {
  --radius: 0.875rem;

  --brand-blue: oklch(0.72 0.106 235);
  --brand-mint: oklch(0.82 0.084 160);

  --background: oklch(0.985 0.002 240);
  --foreground: oklch(0.245 0.021 250);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.245 0.021 250);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.245 0.021 250);
  --primary: oklch(0.66 0.115 236);
  --primary-foreground: oklch(0.995 0 0);
  --secondary: oklch(0.955 0.012 230);
  --secondary-foreground: oklch(0.315 0.024 248);
  --muted: oklch(0.958 0.006 240);
  --muted-foreground: oklch(0.545 0.019 250);
  --accent: oklch(0.93 0.045 175);
  --accent-foreground: oklch(0.31 0.045 190);
  --destructive: oklch(0.585 0.208 25);
  --destructive-foreground: oklch(0.995 0 0);
  --success: oklch(0.66 0.132 160);
  --success-foreground: oklch(0.995 0 0);
  --warning: oklch(0.78 0.145 76);
  --warning-foreground: oklch(0.26 0.04 76);
  --border: oklch(0.912 0.008 245);
  --input: oklch(0.912 0.008 245);
  --ring: oklch(0.72 0.106 235);
  --chart-1: oklch(0.68 0.118 236);
  --chart-2: oklch(0.79 0.094 165);
  --chart-3: oklch(0.6 0.09 260);
  --chart-4: oklch(0.78 0.145 76);
  --chart-5: oklch(0.62 0.11 300);
  --sidebar: oklch(1 0 0);
  --sidebar-foreground: oklch(0.34 0.02 250);
  --sidebar-primary: oklch(0.66 0.115 236);
  --sidebar-primary-foreground: oklch(0.995 0 0);
  --sidebar-accent: oklch(0.955 0.018 210);
  --sidebar-accent-foreground: oklch(0.3 0.04 235);
  --sidebar-border: oklch(0.925 0.008 245);
  --sidebar-ring: oklch(0.72 0.106 235);

  --gradient-brand: linear-gradient(120deg, var(--brand-blue), var(--brand-mint));
  --shadow-card: 0 1px 2px oklch(0.245 0.021 250 / 0.04), 0 8px 24px -12px oklch(0.245 0.021 250 / 0.14);
  --shadow-brand: 0 10px 30px -12px oklch(0.66 0.115 236 / 0.5);
}

.dark {
  --background: oklch(0.205 0.021 248);
  --foreground: oklch(0.965 0.005 240);
  --card: oklch(0.248 0.023 248);
  --card-foreground: oklch(0.965 0.005 240);
  --popover: oklch(0.248 0.023 248);
  --popover-foreground: oklch(0.965 0.005 240);
  --primary: oklch(0.74 0.106 235);
  --primary-foreground: oklch(0.19 0.03 245);
  --secondary: oklch(0.295 0.024 248);
  --secondary-foreground: oklch(0.955 0.005 240);
  --muted: oklch(0.295 0.024 248);
  --muted-foreground: oklch(0.72 0.017 250);
  --accent: oklch(0.35 0.05 195);
  --accent-foreground: oklch(0.95 0.02 180);
  --destructive: oklch(0.65 0.19 25);
  --destructive-foreground: oklch(0.99 0 0);
  --success: oklch(0.72 0.12 162);
  --success-foreground: oklch(0.19 0.03 245);
  --warning: oklch(0.8 0.14 76);
  --warning-foreground: oklch(0.22 0.04 76);
  --border: oklch(1 0 0 / 12%);
  --input: oklch(1 0 0 / 16%);
  --ring: oklch(0.72 0.106 235);
  --sidebar: oklch(0.228 0.022 248);
  --sidebar-foreground: oklch(0.94 0.005 240);
  --sidebar-primary: oklch(0.74 0.106 235);
  --sidebar-primary-foreground: oklch(0.19 0.03 245);
  --sidebar-accent: oklch(0.3 0.03 240);
  --sidebar-accent-foreground: oklch(0.95 0.005 240);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.72 0.106 235);
}

@utility bg-brand-gradient {
  background-image: var(--gradient-brand);
}

@utility text-brand-gradient {
  background-image: var(--gradient-brand);
  background-clip: text;
  color: transparent;
}

@utility shadow-card {
  box-shadow: var(--shadow-card);
}

@utility shadow-brand {
  box-shadow: var(--shadow-brand);
}

@layer base {
  * {
    border-color: var(--color-border);
  }

  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }

  h1,
  h2,
  h3 {
    letter-spacing: -0.02em;
  }
}

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bb34a9f7-4bbf-4b8f-adb4-ed16ceb13163).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
