-- SKIN ROMA · database newsletter + prodotti
-- Eseguire una volta in Supabase > SQL Editor. Lo script è idempotente.
create extension if not exists pgcrypto;

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null unique,
  phone text not null,
  language text not null default 'it',
  marketing_consent boolean not null default false,
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  price numeric(10,2),
  image_url text not null,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Protezioni lato database; le Netlify Functions usano service_role e bypassano RLS.
alter table public.subscribers enable row level security;
alter table public.products enable row level security;

do $$ begin
  alter table public.products add constraint products_price_nonnegative check (price is null or price >= 0);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.products add constraint products_sort_nonnegative check (sort_order >= 0);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.subscribers add constraint subscribers_language_valid check (language in ('it','en'));
exception when duplicate_object then null;
end $$;

create index if not exists subscribers_created_at_idx on public.subscribers (created_at desc);
create index if not exists products_public_order_idx on public.products (published, sort_order, created_at desc);

insert into storage.buckets (id,name,public)
values ('products','products',true)
on conflict (id) do update set public=true;
