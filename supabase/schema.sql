-- Run this once in the Supabase SQL editor.
-- Demo app: single-tenant, so we skip auth/RLS.

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  original_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists post_variants (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  platform text not null check (platform in ('linkedin','x','reddit')),
  content text not null,
  status text not null default 'draft' check (status in ('draft','posting','posted','failed','mocked')),
  platform_post_url text,
  error text,
  posted_at timestamptz,
  impressions integer not null default 0,
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  unique (post_id, platform)
);

create index if not exists post_variants_post_id_idx on post_variants(post_id);
create index if not exists posts_created_at_idx on posts(created_at desc);
