# Registro de seroperfiles

Aplicación React y Express para consultar, capturar y exportar registros sanitarios almacenados en MySQL.

## Requisitos

- Node.js 20 o posterior
- MySQL 8 o MariaDB compatible (por ejemplo, XAMPP)

## Instalación

1. Importa `sql_partes_xampp/00_crear_base_y_tablas.sql` y después los archivos de datos numerados. Si ya tenías la base creada, ejecuta también `sql_partes_xampp/06_agregar_rol_powerbi.sql`.
2. Copia `.env.example` como `.env`.
3. Cambia `AUTH_SECRET` por una cadena larga y aleatoria.
4. Ajusta las credenciales de MySQL y las URL según el entorno.
5. Instala y ejecuta:

```powershell
npm install
npm run build
npm run dev:api
```

En otra terminal:

```powershell
npm run dev
```

La cuenta inicial de una instalación nueva es `admin@empresa.com` con contraseña `123456`. Debe cambiarse antes de exponer el sistema en una red. Las bases antiguas que todavía guardan esa contraseña en texto plano se migran automáticamente a `scrypt` durante el primer inicio de sesión correcto.

## Variables principales

`npm run build` usa Vite en Linux (incluido Vercel) y conserva la compilacion
alternativa de PowerShell en Windows. El resultado se guarda en `dist`.
Sin `DATABASE_URL`, el servidor local usa MySQL. Con `DATABASE_URL`, usa PostgreSQL.

### Vercel y Supabase

La API se publica desde `api/index.js`. El frontend usa `/api` cuando no esta
en localhost; no configures una URL de localhost en Vercel.

Configura en Vercel (Production y Preview):

- `DATABASE_URL`: URI del Transaction pooler de Supabase, con la contrasena
  y los caracteres especiales codificados como URL. No la publiques en Git.
- `AUTH_SECRET`: cadena aleatoria de al menos 32 caracteres.
- `CLIENT_ORIGIN`: origen HTTPS del frontend.
- `API_PUBLIC_URL`: origen HTTPS de la API, para enlaces de Power BI.

La conexion PostgreSQL verifica el certificado TLS. Si necesitas un certificado
de CA adicional, guardalo como PEM en `DATABASE_CA`. Las claves publicables de
Supabase no sustituyen `DATABASE_URL` ni dan acceso a las tablas privadas.

Antes de publicar, ejecutar `node --test server/database.test.js` y
`npm run build`. Tras configurar los secretos, comprobar `/api/health`, el inicio
de sesion, los filtros y los reportes. El respaldo local permanece privado.

- `AUTH_SECRET`: firma las sesiones; es obligatoria en producción.
- `CLIENT_ORIGIN`: orígenes web permitidos, separados por comas.
- `API_PUBLIC_URL`: URL pública usada en la información de Power BI.
- `VITE_API_URL`: URL de la API consumida por React.

## Verificación

```powershell
node --check server/index.js
npm run build
npm audit
```

Los endpoints de datos requieren `Authorization: Bearer <token>`. El token se obtiene mediante `POST /api/auth/login` y expira después de ocho horas.

## Perfil Power BI

El administrador puede crear una cuenta con el perfil **Power BI** desde la pantalla **Usuarios**. Esa cuenta sólo puede abrir la sección **Power BI**, cambiar su contraseña y descargar/consultar los datos de reportes; no puede ver, editar ni eliminar los registros operativos.

En Power BI Desktop usa el conector **Web** y el endpoint JSON `http(s)://TU_API/api/powerbi/seroperfiles`, o descarga el CSV desde el perfil Power BI. Los campos listos para segmentadores son `empresa`, `flujo`, `anio`, `trimestre` y `enfermedad`. Como el endpoint requiere sesión, para actualización programada se debe configurar una autenticación segura de servicio o conectar Power BI directamente a MySQL con una cuenta de sólo lectura.
