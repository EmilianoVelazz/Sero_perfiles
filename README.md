# Registro de seroperfiles

Aplicación React y Express para consultar, capturar y exportar registros sanitarios almacenados en MySQL.

## Requisitos

- Node.js 20 o posterior
- MySQL 8 o MariaDB compatible (por ejemplo, XAMPP)

## Instalación

1. Importa `sql_partes_xampp/00_crear_base_y_tablas.sql` y después los archivos de datos numerados.
2. Copia `.env.example` como `.env`.
3. Cambia `AUTH_SECRET` por una cadena larga y aleatoria.
4. Ajusta las credenciales de MySQL y las URL según el entorno.
5. Instala y ejecuta:

```powershell
npm install
npm run dev:api
```

En otra terminal:

```powershell
npm run dev
```

La cuenta inicial de una instalación nueva es `admin@empresa.com` con contraseña `123456`. Debe cambiarse antes de exponer el sistema en una red. Las bases antiguas que todavía guardan esa contraseña en texto plano se migran automáticamente a `scrypt` durante el primer inicio de sesión correcto.

## Variables principales

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
