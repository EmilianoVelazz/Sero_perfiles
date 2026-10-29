# Migracion a Supabase — 29 de octubre de 2026

Destino: proyecto `Sero_perfiles` (`snzkrvhojwnsteddszok`).
Origen: copia consistente de MySQL exportada a las 16:33:45 UTC.

| Tabla | Filas | Comparacion SHA-256 |
| --- | ---: | --- |
| usuarios | 3 | Identica al origen |
| seroperfiles | 10051 | Identica al origen |

Se importaron el esquema, los indices, las claves foraneas y el trigger de
actualizacion. Cero referencias huerfanas. Las siguientes identidades son 4 y
10052 respectivamente. RLS esta activado y los roles `anon` y `authenticated`
no tienen acceso directo a los usuarios ni a los registros. El asesor de
seguridad solo reporto dos avisos informativos por RLS sin politicas, coherentes
con el acceso exclusivo desde el servidor.

La migracion de datos y la conexion de la aplicacion estan completadas. La API
PostgreSQL se publico en Vercel desde el commit `0f6966c`. Se configuraron
`DATABASE_URL`, `DATABASE_CA` y `AUTH_SECRET` en Vercel; los secretos no estan en
Git. La conexion verifica el certificado y el hostname del pooler de Supabase.
No se modifico la base MySQL de origen.

Verificacion en produccion (`https://seroperfiles.vercel.app`):

- `/api/health` devolvio HTTP 200 y `ok: true`.
- La consulta paginada encontro 10051 registros y conservo las fechas y campos.
- Busqueda, filtros, resumen, esquema Power BI, JSON y CSV devolvieron HTTP 200
  con una sesion temporal de prueba.
- Las solicitudes sin sesion fueron rechazadas con HTTP 401.
- Las pruebas no insertaron ni actualizaron datos.

Para volver a generar la consulta de verificacion de integridad desde la copia
local: `node tools/verify-supabase-migration.js`. Ejecutar su salida como consulta
de solo lectura en el proyecto de destino.
