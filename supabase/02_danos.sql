-- LABFIS | Módulo 03 · Reporte de daños (anónimo)
-- Ejecutar en Supabase -> SQL Editor. Se puede ejecutar más de una vez sin problema.
-- No usar datos personales reales.
--
-- Diseño de seguridad:
--   * La tabla NO es accesible directamente desde el navegador (RLS activo, sin políticas, sin permisos).
--   * El navegador solo puede llamar a DOS funciones:
--       create_damage_report(...)  -> crea el reporte y devuelve el código de seguimiento
--       get_damage_report(code)    -> devuelve el estado de UN reporte si se conoce su código
--   * No se guarda user_id, correo ni IP: el reporte es anónimo (HU-01).

-- ---------------------------------------------------------------------------
-- 1. Tabla
-- ---------------------------------------------------------------------------
create table if not exists public.damage_reports (
  id            uuid primary key default gen_random_uuid(),
  tracking_code text not null unique,
  lab_key       text not null check (lab_key in ('redes','software','digitales','datos')),
  lab_name      text not null,
  resource      text not null check (char_length(trim(resource)) between 1 and 120),
  urgency       text not null default 'Media' check (urgency in ('Baja','Media','Alta','Crítica')),
  description   text not null check (char_length(trim(description)) between 10 and 500),
  evidence_path text check (evidence_path is null or char_length(evidence_path) <= 100),
  status        text not null default 'REGISTRADO' check (status in ('REGISTRADO','EN_PROCESO','ATENDIDO')),
  tech_note     text,
  created_at    timestamptz not null default now()
);

alter table public.damage_reports enable row level security;

-- Sin políticas y sin permisos: nadie (anon/authenticated) lee ni escribe la tabla directamente.
revoke all on table public.damage_reports from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Función: crear reporte (HU-01, HU-02, HU-03, HU-04, HU-06)
--    Valida en el servidor (no se confía solo en el navegador) y genera el código.
-- ---------------------------------------------------------------------------
create or replace function public.create_damage_report(
  p_lab_key       text,
  p_resource      text,
  p_urgency       text,
  p_description   text,
  p_evidence_path text default null
)
returns table (tracking_code text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lab_name text;
  v_desc     text := trim(coalesce(p_description, ''));
  v_res      text := trim(coalesce(p_resource, ''));
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- sin 0/O/1/I para evitar confusiones
  v_code     text;
  v_tries    int := 0;
begin
  v_lab_name := case p_lab_key
    when 'redes'     then 'Laboratorio de Redes y Conectividad'
    when 'software'  then 'Laboratorio de Ingeniería de Software'
    when 'digitales' then 'Laboratorio de Sistemas Digitales'
    when 'datos'     then 'Laboratorio de Bases de Datos'
    else null
  end;

  if v_lab_name is null then
    raise exception 'Debe seleccionar un laboratorio de la lista.' using errcode = '22023';
  end if;
  if char_length(v_res) = 0 or char_length(v_res) > 120 then
    raise exception 'Debe seleccionar el equipo o infraestructura afectada.' using errcode = '22023';
  end if;
  if coalesce(p_urgency, '') not in ('Baja','Media','Alta','Crítica') then
    raise exception 'Urgencia no válida.' using errcode = '22023';
  end if;
  if char_length(v_desc) < 10 or char_length(v_desc) > 500 then
    raise exception 'La descripción debe tener entre 10 y 500 caracteres.' using errcode = '22023';
  end if;
  if p_evidence_path is not null
     and p_evidence_path !~ '^[A-Za-z0-9_-]{8,64}\.(jpg|jpeg|png|pdf)$' then
    raise exception 'Ruta de evidencia no válida.' using errcode = '22023';
  end if;

  loop
    v_code := 'REP-' || extract(year from now())::int || '-' ||
              (select string_agg(substr(v_alphabet, 1 + floor(random() * 32)::int, 1), '')
                 from generate_series(1, 6));
    begin
      insert into public.damage_reports
        (tracking_code, lab_key, lab_name, resource, urgency, description, evidence_path, tech_note)
      values
        (v_code, p_lab_key, v_lab_name, v_res, p_urgency, v_desc, p_evidence_path,
         'Reporte anónimo recibido (' || p_urgency || '). En cola de asignación para revisión técnica en LABFIS.')
      returning public.damage_reports.tracking_code, public.damage_reports.created_at
      into tracking_code, created_at;
      return next;
      return;
    exception when unique_violation then
      v_tries := v_tries + 1;
      if v_tries > 5 then raise; end if;
    end;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Función: consultar estado por código (HU-05)
--    Devuelve solo lo necesario (no la descripción ni la evidencia).
-- ---------------------------------------------------------------------------
create or replace function public.get_damage_report(p_code text)
returns table (
  tracking_code text,
  lab_name      text,
  resource      text,
  urgency       text,
  status        text,
  tech_note     text,
  created_at    timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return query
    select r.tracking_code, r.lab_name, r.resource, r.urgency, r.status, r.tech_note, r.created_at
      from public.damage_reports r
     where r.tracking_code = upper(trim(coalesce(p_code, '')));
end;
$$;

revoke all on function public.create_damage_report(text, text, text, text, text) from public;
revoke all on function public.get_damage_report(text) from public;
grant execute on function public.create_damage_report(text, text, text, text, text) to anon, authenticated;
grant execute on function public.get_damage_report(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Evidencia fotográfica (HU-03): bucket privado, solo se puede SUBIR (no leer ni listar)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('damage-evidence', 'damage-evidence', false, 5242880,
        array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update
  set file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "damage_evidence_upload" on storage.objects;
create policy "damage_evidence_upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'damage-evidence');

-- ---------------------------------------------------------------------------
-- 5. Datos de demostración (los mismos códigos del prototipo, para probar HU-05)
-- ---------------------------------------------------------------------------
insert into public.damage_reports
  (tracking_code, lab_key, lab_name, resource, urgency, description, status, tech_note, created_at)
values
  ('REP-2026-X8F2', 'redes', 'Laboratorio de Redes y Conectividad', 'PC-12 (Estación de trabajo)', 'Alta',
   'Tarjeta de red sin enlace físico en la estación PC-12 durante la práctica de laboratorio.',
   'EN_PROCESO',
   'El equipo fue evaluado por el personal técnico de LABFIS. Se solicitó reemplazo de tarjeta de red y cableado estructurado.',
   '2026-11-15 14:20:00-05'),
  ('REP-2026-A104', 'software', 'Laboratorio de Ingeniería de Software', 'Infraestructura general / Otro', 'Media',
   'Luminaria LED del laboratorio parpadeando de forma intermitente durante las clases.',
   'ATENDIDO',
   'Luminaria LED reemplazada y circuito eléctrico verificado. El espacio se encuentra 100% operativo.',
   '2026-11-12 09:15:00-05')
on conflict (tracking_code) do nothing;
