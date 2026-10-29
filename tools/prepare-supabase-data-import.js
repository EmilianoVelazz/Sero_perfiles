import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'migracion_supabase');
const manifest = JSON.parse(await fs.readFile(path.join(directory, 'resumen-exportacion.json'), 'utf8'));
const full = await fs.readFile(path.join(directory, 'registro_seroperfiles_supabase.sql'), 'utf8');
const marker = `-- usuarios: ${manifest.tables.usuarios.rows} filas.`;
const start = full.indexOf(marker);
if (start < 0) throw new Error('No se encontro el bloque de datos de la exportacion.');

const prefix = `-- IMPORTAR TODOS LOS DATOS EN LAS TABLAS YA CREADAS EN SUPABASE.
-- Respaldo de XAMPP: ${manifest.exportedAtUtc}
-- ${manifest.tables.usuarios.rows} usuarios y ${manifest.tables.seroperfiles.rows} seroperfiles.
-- Ejecutar el archivo completo una sola vez.
-- Solo admite seroperfiles vacia y usuarios vacia o con el administrador inicial.
-- Reemplaza el administrador inicial por los usuarios reales del respaldo.

BEGIN;
SET LOCAL standard_conforming_strings = on;
SET LOCAL TIME ZONE 'UTC';

LOCK TABLE public.usuarios, public.seroperfiles IN SHARE ROW EXCLUSIVE MODE;

DO $destino$
BEGIN
  IF EXISTS (SELECT 1 FROM public.seroperfiles) THEN
    RAISE EXCEPTION 'seroperfiles ya contiene datos. La importacion se cancelo sin reemplazarlos.';
  END IF;

  IF (SELECT count(*) FROM public.usuarios) > 1
     OR EXISTS (
       SELECT 1 FROM public.usuarios
       WHERE id <> 1
          OR nombre <> 'Administrador'
          OR correo <> 'admin@empresa.com'
          OR rol <> 'admin'
          OR activo <> 1
          OR password_hash <> 'scrypt$f7d96bb2d6b24a945e1f4146e11ee678$246e544d96b3446c38d69770a82706b908fda10132f320c3b9e77d9738ae1f95559b0392e6080fe34a5571a5670fdf4356dce3ad42889580c0c6ae2db50de4fd'
     ) THEN
    RAISE EXCEPTION 'usuarios contiene cuentas distintas al administrador inicial. La importacion se cancelo sin reemplazarlas.';
  END IF;
END;
$destino$;

-- Solo se elimina la cuenta inicial despues de comprobar el destino.
-- Todo el reemplazo se confirma junto con la importacion al final.
DELETE FROM public.usuarios WHERE id = 1;

`;

const outputPath = path.join(directory, 'SOLO_DATOS_para_tablas_ya_creadas.sql');
await fs.writeFile(outputPath, prefix + full.slice(start), 'utf8');
console.log(JSON.stringify({ file: outputPath, usuarios: manifest.tables.usuarios.rows, seroperfiles: manifest.tables.seroperfiles.rows }));
