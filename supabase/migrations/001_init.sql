-- Análises de imóveis
create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  property_type text,
  neighborhood text,
  area_m2 numeric,
  price numeric,
  market_value numeric,
  origin text,
  occupation text,
  renovation_level text,
  objective text,
  notes text,
  result_text text,
  risk_level text,
  recommendation text
);

-- Documentos enviados
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  analysis_id uuid references analyses(id) on delete cascade,
  file_name text not null,
  file_size integer,
  storage_path text not null,
  extracted_text text
);

-- Histórico de conversas
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  analysis_id uuid references analyses(id) on delete set null,
  messages jsonb not null default '[]'::jsonb,
  title text
);

-- Storage bucket para PDFs
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict do nothing;

-- Policy: acesso irrestrito (uso interno/privado)
create policy "allow all" on storage.objects
  for all using (bucket_id = 'documents');
