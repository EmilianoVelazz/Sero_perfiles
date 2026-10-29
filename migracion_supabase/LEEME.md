# Importar la base de XAMPP a Supabase

El archivo `registro_seroperfiles_supabase.sql` contiene la estructura y una copia de los datos actuales de `registro_seroperfiles`: 3 usuarios y 10,051 seroperfiles. Consulta `resumen-exportacion.json` para la fecha exacta del respaldo. Incluye contrasenas almacenadas por la aplicacion; guarda este respaldo como archivo privado.

## Si ya creaste las tablas con el SQL del chat

Usa **`SOLO_DATOS_para_tablas_ya_creadas.sql`**. En SQL Editor crea una consulta nueva, pega todo el archivo y ejecutalo una sola vez. Este archivo contiene todos los registros, sin volver a crear tablas.

Comprueba primero que `seroperfiles` este vacia y `usuarios` contenga solamente la cuenta inicial `admin@empresa.com` con los valores del SQL del chat (o que tambien este vacia). El script verifica esas condiciones; si encuentra otros datos se cancela. Dentro de una transaccion reemplaza la cuenta inicial por los 3 usuarios originales e importa los 10,051 seroperfiles, conservando sus IDs y relaciones.

No ejecutes tambien `registro_seroperfiles_supabase.sql`, que es para un destino sin tablas. Si necesitas regenerar la version de solo datos despues de actualizar el respaldo, ejecuta `node tools/prepare-supabase-data-import.js`.

## Importacion desde Supabase

1. Abre el proyecto de destino en Supabase. Las tablas `public.usuarios` y `public.seroperfiles` no deben existir todavia.
2. En **SQL Editor**, crea una consulta y pega el contenido completo de `registro_seroperfiles_supabase.sql`.
3. Ejecuta la consulta completa una sola vez. Al finalizar devuelve las cantidades de usuarios y seroperfiles.

No ejecutes `estructura.sql` primero: es una referencia de las tablas; el archivo completo ya la incluye. El script usa una transaccion, no contiene `DROP`, `TRUNCATE` ni operaciones para reemplazar datos existentes. Si las tablas ya existen, la importacion falla. Si una consola deja la transaccion abierta despues de un error, ejecuta `ROLLBACK;` antes de volver a intentar.

## Alternativa con psql

Si prefieres importar el archivo de aproximadamente 3 MB desde la terminal, usa `psql` de PostgreSQL. En Supabase, abre **Connect > Session pooler** y copia el host, puerto y usuario que muestra tu proyecto. Desde la carpeta `Registro_rox` ejecuta:

```powershell
psql "host=HOST_DEL_SESSION_POOLER port=PUERTO_DEL_PANEL user=USUARIO_DEL_PANEL dbname=postgres sslmode=require" --set=ON_ERROR_STOP=1 --password --file="migracion_supabase/registro_seroperfiles_supabase.sql"
```

`psql` solicita la contrasena de la base de Supabase. No uses la contrasena de acceso de la aplicacion ni pongas la contrasena en el archivo SQL.

## Verificar el resultado

```sql
SELECT 'usuarios' AS tabla, count(*) AS filas FROM public.usuarios
UNION ALL
SELECT 'seroperfiles', count(*) FROM public.seroperfiles;

SELECT count(*) AS referencias_huerfanas
FROM public.seroperfiles s
LEFT JOIN public.usuarios u ON u.id = s.creado_por
WHERE s.creado_por IS NOT NULL AND u.id IS NULL;
```

Para este respaldo se esperan 3 usuarios, 10,051 seroperfiles y 0 referencias huerfanas. Los identificadores y las secuencias quedan preparados para nuevas inserciones. Se mantienen los importes decimales, los roles y las contrasenas actuales. Los timestamps se exportan en UTC conservando el instante original; para mostrarlos en hora local utiliza `America/Mexico_City`.

El archivo completo se ejecuto en PostgreSQL 18.3 mediante PGlite en una base temporal local. Se comprobaron los valores de todas las filas con SHA-256, las secuencias, las relaciones, la actualizacion automatica de timestamps y la proteccion de acceso. El resultado esta en `verificacion-postgresql.json`. Esta verificacion no representa una importacion ejecutada en tu proyecto de Supabase.

## Conectar la aplicacion despues

Este archivo migra las tablas y los datos. El servidor Express actual importa `mysql2/promise` y usa SQL de MySQL. Antes de conectarlo a Supabase hay que cambiar el controlador por uno de PostgreSQL, configurar su conexion con SSL y adaptar las consultas: parametros `:nombre`, resultados de `pool.execute`, `DATE_FORMAT` y el identificador de nuevas inserciones.

Los usuarios se importan a `public.usuarios`, conservando la autenticacion personalizada de Express. No se crean cuentas en `auth.users` de Supabase Auth. Para usar Supabase Auth se requiere una migracion de autenticacion adicional.

Las dos tablas tienen RLS activado y no conceden acceso directo a `anon` ni `authenticated`. Estan preparadas para un servidor de confianza con conexion PostgreSQL y permisos adecuados. No se incluyen politicas que expongan usuarios o contrasenas al navegador. La comparacion de texto en PostgreSQL puede diferir de la intercalacion `utf8mb4_unicode_ci` de MySQL; revisar busquedas y unicidad de correos al adaptar el servidor.

## Actualizar el respaldo

Desde `Registro_rox`:

```powershell
node tools/export-supabase.js
```

Lee `.env`, abre una transaccion de solo lectura en MySQL y reemplaza los archivos de exportacion locales. No modifica los registros de XAMPP ni conecta a Supabase. Si la estructura de la base cambia, revisa el esquema y el exportador antes de regenerar.

Documentacion oficial:

- [Migrar MySQL a Supabase](https://supabase.com/docs/guides/platform/migrating-to-supabase/mysql)
- [Conexion a PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
