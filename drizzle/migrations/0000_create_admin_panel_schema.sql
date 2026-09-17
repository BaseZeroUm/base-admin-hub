-- Papéis de usuário (admin etc.)
create type public.app_role as enum ('admin', 'moderator', 'user');

-- Empresas clientes
create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  razao_social text,
  nome_fantasia text,
  cnpj text,
  categoria text,
  plano text,
  trial_ate timestamptz,
  assinatura_ativa boolean default false,
  ativa boolean default true,
  created_at timestamptz not null default now()
);

-- Perfis de usuário vinculados a uma empresa
create table public.profiles (
  id uuid primary key,
  empresa_id uuid references public.empresas(id) on delete set null,
  nome text,
  email text,
  ativo boolean default true,
  desativado_em timestamptz,
  exclusao_programada_para timestamptz,
  motivo_desativacao text,
  created_at timestamptz not null default now()
);

-- Papéis por usuário (evita recursão de RLS via função security definer)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

-- Atividade diária agregada por usuário
create table public.user_activity_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  empresa_id uuid references public.empresas(id) on delete set null,
  data date not null,
  minutos_ativos numeric default 0,
  unique (user_id, data)
);

-- Perfil criado automaticamente para cada novo usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nome)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Verificação de papel sem recursão de RLS
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Permissões de acesso
grant select, insert, update, delete on public.empresas to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select, insert, update, delete on public.user_activity_daily to authenticated;
grant all on public.empresas to service_role;
grant all on public.profiles to service_role;
grant all on public.user_roles to service_role;
grant all on public.user_activity_daily to service_role;

-- Row Level Security
alter table public.empresas enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_activity_daily enable row level security;

create policy "Admins gerenciam empresas"
  on public.empresas for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Usuarios veem a propria empresa"
  on public.empresas for select to authenticated
  using (
    id in (select empresa_id from public.profiles where id = auth.uid())
  );

create policy "Admins gerenciam perfis"
  on public.profiles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Usuario ve e edita o proprio perfil"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "Usuario edita o proprio perfil"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Usuarios veem os proprios papeis"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid());

create policy "Admins registram atividade"
  on public.user_activity_daily for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Usuarios veem a propria atividade"
  on public.user_activity_daily for select to authenticated
  using (user_id = auth.uid());
