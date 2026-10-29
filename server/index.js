import cors from 'cors';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import express from 'express';
import { createDatabase } from './database.js';

dotenv.config();

const app = express();
const port = Number(process.env.API_PORT || 3002);
const deploymentHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const publicApiUrl = (process.env.API_PUBLIC_URL || (deploymentHost ? `https://${deploymentHost}` : `http://127.0.0.1:${port}`)).replace(/\/$/, '');
const authSecret = process.env.AUTH_SECRET || 'solo-desarrollo-cambia-esta-clave';
const tokenLifetimeSeconds = 8 * 60 * 60;

if (process.env.VERCEL && (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32)) {
  throw new Error('Configura AUTH_SECRET con al menos 32 caracteres en Vercel.');
}

if (!process.env.AUTH_SECRET) {
  console.warn('ADVERTENCIA: configura AUTH_SECRET antes de publicar la API.');
}

const pool = createDatabase();

const configuredOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = configuredOrigins.length
  ? configuredOrigins
  : [/^http:\/\/127\.0\.0\.1:\d+$/, /^http:\/\/localhost:\d+$/];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '10mb' }));

const selectColumns = `
  id,
  DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha,
  semana,
  trimestre,
  anio,
  razon,
  empresa,
  flujo,
  granja,
  caseta,
  lote,
  funcion,
  edad,
  identidad,
  muestra,
  laboratorio,
  no_caso AS caso,
  num_muestras AS numMuestras,
  enfermedad,
  tecnica,
  resultado,
  punto_corte AS puntoCorte,
  interpretacion,
  comentarios,
  creado_por AS creadoPor,
  creado_en AS creadoEn,
  actualizado_en AS actualizadoEn
`;

const powerBiFields = [
  { key: 'id', label: 'ID', type: 'Numero entero' },
  { key: 'fecha', label: 'Fecha', type: 'Fecha' },
  { key: 'semana', label: 'Semana', type: 'Numero entero' },
  { key: 'trimestre', label: 'Trimestre', type: 'Numero entero' },
  { key: 'anio', label: 'Año', type: 'Numero entero' },
  { key: 'razon', label: 'Razón', type: 'Texto' },
  { key: 'empresa', label: 'Empresa', type: 'Texto' },
  { key: 'flujo', label: 'Flujo', type: 'Texto' },
  { key: 'granja', label: 'Granja', type: 'Texto' },
  { key: 'caseta', label: 'Caseta', type: 'Texto' },
  { key: 'lote', label: 'Lote', type: 'Texto' },
  { key: 'funcion', label: 'Funcion', type: 'Texto' },
  { key: 'edad', label: 'Edad', type: 'Decimal' },
  { key: 'identidad', label: 'Identidad', type: 'Texto' },
  { key: 'muestra', label: 'Muestra', type: 'Texto' },
  { key: 'laboratorio', label: 'Laboratorio', type: 'Texto' },
  { key: 'caso', label: 'No de caso', type: 'Texto' },
  { key: 'numMuestras', label: 'Num muestras', type: 'Numero entero' },
  { key: 'enfermedad', label: 'Enfermedad', type: 'Texto' },
  { key: 'tecnica', label: 'Técnica', type: 'Texto' },
  { key: 'resultado', label: 'Resultado', type: 'Decimal' },
  { key: 'puntoCorte', label: 'Punto de corte', type: 'Decimal' },
  { key: 'interpretacion', label: 'Interpretación', type: 'Texto' },
  { key: 'comentarios', label: 'Comentarios', type: 'Texto' },
  { key: 'creadoPor', label: 'Creado por', type: 'Numero entero' },
  { key: 'creadoEn', label: 'Creado en', type: 'Fecha y hora' },
  { key: 'actualizadoEn', label: 'Actualizado en', type: 'Fecha y hora' },
];

const importCatalogs = {
  empresa: ['Vallyava', 'Vallpork'],
  flujo: ['Joya', 'Tejas', 'FASA', 'Zacatecas', 'Sanfandila', 'Tepuza', 'Alamos', 'Waris'],
  funcion: ['Linea', 'Hembra', 'GDU'],
  laboratorio: ['DCV', 'UNAM', 'Lapisa', 'BI', 'LIVE'],
  enfermedad: ['Mycoplasma', 'PRRS', 'Influenza', 'APP', 'Ojo Azul', 'Influenza H1N2'],
  tecnica: ['ELISA', 'VSN'],
  interpretacion: ['Positivo', 'Negativo', 'Sospechoso'],
  muestra: ['Suero'],
};

const importCatalogLabels = {
  empresa: 'Empresa', flujo: 'Flujo', funcion: 'Función', laboratorio: 'Laboratorio',
  enfermedad: 'Enfermedad', tecnica: 'Técnica', interpretacion: 'Interpretación', muestra: 'Muestra',
};

function emptyToNull(value) {
  return value === '' || value === undefined ? null : value;
}

function encodeBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function signToken(user) {
  const payload = encodeBase64Url(JSON.stringify({
    sub: user.id,
    nombre: user.nombre,
    correo: user.correo,
    rol: user.rol,
    exp: Math.floor(Date.now() / 1000) + tokenLifetimeSeconds,
  }));
  const signature = crypto.createHmac('sha256', authSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifyToken(token) {
  const [payload, providedSignature] = String(token || '').split('.');
  if (!payload || !providedSignature) return null;

  const expectedSignature = crypto.createHmac('sha256', authSecret).update(payload).digest();
  let receivedSignature;
  try {
    receivedSignature = Buffer.from(providedSignature, 'base64url');
  } catch {
    return null;
  }

  if (receivedSignature.length !== expectedSignature.length
      || !crypto.timingSafeEqual(receivedSignature, expectedSignature)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!decoded.exp || decoded.exp <= Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function passwordMatches(password, storedPassword) {
  if (!storedPassword?.startsWith('scrypt$')) {
    const supplied = Buffer.from(String(password));
    const stored = Buffer.from(String(storedPassword || ''));
    return supplied.length === stored.length && crypto.timingSafeEqual(supplied, stored);
  }

  const [, salt, storedHash] = storedPassword.split('$');
  if (!salt || !storedHash) return false;
  const calculatedHash = crypto.scryptSync(String(password), salt, 64);
  const expectedHash = Buffer.from(storedHash, 'hex');
  return calculatedHash.length === expectedHash.length
    && crypto.timingSafeEqual(calculatedHash, expectedHash);
}

function requireAuth(request, response, next) {
  const authorization = request.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const user = verifyToken(token);
  if (!user) {
    return response.status(401).json({ message: 'La sesión no es válida o expiró.' });
  }
  request.user = user;
  next();
}

function requireWriteRole(request, response, next) {
  if (!['admin', 'analista'].includes(request.user?.rol)) {
    return response.status(403).json({ message: 'Tu usuario sólo tiene permisos de consulta.' });
  }
  next();
}

function isoWeek(date) {
  const value = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  value.setUTCDate(value.getUTCDate() + 4 - (value.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  return Math.ceil((((value - yearStart) / 86400000) + 1) / 7);
}

function parseRecordDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function isNonNegativeNumber(value) {
  return value === null || value === '' || value === undefined
    || (Number.isFinite(Number(value)) && Number(value) >= 0);
}

function isNonNegativeInteger(value) {
  return value === null || value === '' || value === undefined
    || (Number.isInteger(Number(value)) && Number(value) >= 0);
}

function canonicalImportValue(value) {
  return String(value ?? '').trim().toLocaleLowerCase('es-MX')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
}

function validateRecord(record) {
  const errors = [];
  const date = parseRecordDate(record.fecha);
  if (!date) errors.push('La fecha debe ser válida.');
  if (!String(record.empresa || '').trim()) errors.push('La empresa es obligatoria.');
  if (!String(record.granja || '').trim()) errors.push('La granja es obligatoria.');
  if (!String(record.enfermedad || '').trim()) errors.push('La enfermedad es obligatoria.');
  for (const [key, label] of [['edad', 'Edad'], ['resultado', 'Resultado'], ['puntoCorte', 'Punto de corte']]) {
    if (!isNonNegativeNumber(record[key])) errors.push(`${label} debe ser un número no negativo.`);
  }
  if (!isNonNegativeInteger(record.numMuestras)) errors.push('Número de muestras debe ser un entero no negativo.');
  const limits = { empresa: 120, flujo: 120, granja: 180, caseta: 80, lote: 100, funcion: 100, identidad: 100, muestra: 100, laboratorio: 120, caso: 120, enfermedad: 140, tecnica: 100, interpretacion: 80 };
  for (const [key, limit] of Object.entries(limits)) {
    const value = record[key];
    if (value !== null && value !== undefined && String(value).length > limit) errors.push(`${key} excede el máximo de ${limit} caracteres.`);
    if (value !== null && value !== undefined && /[\u0000-\u001F\u007F]/.test(String(value))) errors.push(`${key} contiene caracteres de control no permitidos.`);
    if (value && !/^[\p{L}\p{N}\s.,()/#-]+$/u.test(String(value))) errors.push(`${key} contiene caracteres especiales no permitidos.`);
    if (value && /^[=+@]/.test(String(value).trim())) errors.push(`${key} no puede contener una fórmula.`);
  }
  for (const [key, allowedValues] of Object.entries(importCatalogs)) {
    const value = String(record[key] ?? '').trim();
    if (value && !allowedValues.some((allowed) => canonicalImportValue(allowed) === canonicalImportValue(value))) {
      errors.push(`${importCatalogLabels[key]} no es una opción válida.`);
    }
  }

  return { errors, date };
}

function recordParams(record, date, userId) {
  return {
    fecha: record.fecha,
    semana: isoWeek(date),
    trimestre: Math.floor(date.getUTCMonth() / 3) + 1,
    anio: date.getUTCFullYear(),
    razon: emptyToNull(record.razon) || 'Seroperfil',
    empresa: record.empresa,
    flujo: emptyToNull(record.flujo),
    granja: record.granja,
    caseta: emptyToNull(record.caseta),
    lote: emptyToNull(record.lote),
    funcion: emptyToNull(record.funcion),
    edad: emptyToNull(record.edad),
    identidad: emptyToNull(record.identidad),
    muestra: emptyToNull(record.muestra) || 'Suero',
    laboratorio: emptyToNull(record.laboratorio),
    no_caso: emptyToNull(record.caso),
    num_muestras: emptyToNull(record.numMuestras),
    enfermedad: record.enfermedad,
    tecnica: emptyToNull(record.tecnica),
    resultado: emptyToNull(record.resultado),
    punto_corte: emptyToNull(record.puntoCorte),
    interpretacion: emptyToNull(record.interpretacion),
    comentarios: emptyToNull(record.comentarios),
    creado_por: userId,
  };
}

const insertSeroperfilSql = `INSERT INTO seroperfiles (
  fecha, semana, trimestre, anio, razon, empresa, flujo, granja, caseta, lote,
  funcion, edad, identidad, muestra, laboratorio, no_caso, num_muestras,
  enfermedad, tecnica, resultado, punto_corte, interpretacion, comentarios, creado_por
) VALUES (
  :fecha, :semana, :trimestre, :anio, :razon, :empresa, :flujo, :granja, :caseta, :lote,
  :funcion, :edad, :identidad, :muestra, :laboratorio, :no_caso, :num_muestras,
  :enfermedad, :tecnica, :resultado, :punto_corte, :interpretacion, :comentarios, :creado_por
)`;

function csvValue(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

function buildSeroperfilesFilters(query) {
  const { q, anio, trimestre, empresa, flujo, enfermedad, laboratorio, interpretacion, fecha_desde, fecha_hasta } = query;
  const where = [];
  const params = {};

  if (q) {
    where.push(`(
      empresa LIKE :q OR flujo LIKE :q OR granja LIKE :q OR enfermedad LIKE :q OR laboratorio LIKE :q OR no_caso LIKE :q
    )`);
    params.q = `%${q}%`;
  }

  if (anio) {
    where.push('anio = :anio');
    params.anio = anio;
  }

  if (trimestre) {
    where.push('trimestre = :trimestre');
    params.trimestre = trimestre;
  }

  if (empresa && empresa !== 'Todas') {
    where.push('empresa = :empresa');
    params.empresa = empresa;
  }

  if (flujo) {
    where.push('flujo = :flujo');
    params.flujo = flujo;
  }

  if (enfermedad) {
    where.push('enfermedad = :enfermedad');
    params.enfermedad = enfermedad;
  }

  if (laboratorio) {
    where.push('laboratorio = :laboratorio');
    params.laboratorio = laboratorio;
  }

  if (interpretacion) {
    where.push('interpretacion = :interpretacion');
    params.interpretacion = interpretacion;
  }

  if (fecha_desde) {
    where.push('fecha >= :fecha_desde');
    params.fecha_desde = fecha_desde;
  }

  if (fecha_hasta) {
    where.push('fecha <= :fecha_hasta');
    params.fecha_hasta = fecha_hasta;
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params,
  };
}

app.get('/api/health', async (_request, response) => {
  const [rows] = await pool.query('SELECT 1 AS ok');
  response.json({ ok: rows[0].ok === 1 });
});

app.post('/api/auth/login', async (request, response) => {
  const { correo, password } = request.body || {};

  if (!correo || !password) {
    return response.status(400).json({ message: 'Correo y contrasena son obligatorios.' });
  }

  const [rows] = await pool.execute(
    `SELECT id, nombre, correo, rol, password_hash
     FROM usuarios
     WHERE correo = :correo AND activo = 1
     LIMIT 1`,
    { correo },
  );

  const user = rows[0];
  if (!user || !passwordMatches(password, user.password_hash)) {
    return response.status(401).json({ message: 'Credenciales incorrectas.' });
  }

  if (!user.password_hash.startsWith('scrypt$')) {
    await pool.execute(
      'UPDATE usuarios SET password_hash = :passwordHash WHERE id = :id',
      { passwordHash: hashPassword(password), id: user.id },
    );
  }

  const safeUser = {
    id: user.id,
    nombre: user.nombre,
    correo: user.correo,
    rol: user.rol,
  };

  response.json({
    token: signToken(safeUser),
    user: safeUser,
  });
});

app.use('/api', requireAuth);

app.post('/api/auth/change-password', async (request, response) => {
  const { currentPassword, newPassword } = request.body || {};
  if (!currentPassword || typeof newPassword !== 'string' || newPassword.length < 10) {
    return response.status(400).json({ message: 'La nueva contraseña debe tener al menos 10 caracteres.' });
  }

  const [rows] = await pool.execute(
    'SELECT password_hash FROM usuarios WHERE id = :id AND activo = 1 LIMIT 1',
    { id: request.user.sub },
  );
  if (!rows[0] || !passwordMatches(currentPassword, rows[0].password_hash)) {
    return response.status(401).json({ message: 'La contraseña actual no es correcta.' });
  }

  await pool.execute(
    'UPDATE usuarios SET password_hash = :passwordHash WHERE id = :id',
    { passwordHash: hashPassword(newPassword), id: request.user.sub },
  );
  response.json({ ok: true });
});

app.get('/api/seroperfiles', async (request, response) => {
  const { whereSql, params } = buildSeroperfilesFilters(request.query);
  const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
  const limit = Math.min(250, Math.max(10, Number.parseInt(request.query.limit, 10) || 100));
  const offset = (page - 1) * limit;
  const [[countRow]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM seroperfiles ${whereSql}`,
    params,
  );
  const [rows] = await pool.execute(
    `SELECT ${selectColumns}
     FROM seroperfiles
     ${whereSql}
     ORDER BY fecha DESC, id DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params,
  );

  const total = Number(countRow.total || 0);
  response.json({
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

app.get('/api/seroperfiles/filters', async (_request, response) => {
  const [anios] = await pool.query(`
    SELECT anio AS value, COUNT(*) AS total
    FROM seroperfiles
    WHERE anio IS NOT NULL
    GROUP BY anio
    ORDER BY anio DESC
  `);
  const [empresas] = await pool.query(`
    SELECT empresa AS value, COUNT(*) AS total
    FROM seroperfiles
    WHERE empresa IS NOT NULL AND empresa <> ''
    GROUP BY empresa
    ORDER BY empresa
  `);
  const [trimestres] = await pool.query(`
    SELECT trimestre AS value, COUNT(*) AS total
    FROM seroperfiles
    WHERE trimestre IS NOT NULL
    GROUP BY trimestre
    ORDER BY trimestre
  `);
  const [flujos] = await pool.query(`
    SELECT flujo AS value, COUNT(*) AS total
    FROM seroperfiles
    WHERE flujo IS NOT NULL AND flujo <> ''
    GROUP BY flujo
    ORDER BY flujo
  `);
  const [enfermedades] = await pool.query(`
    SELECT enfermedad AS value, COUNT(*) AS total
    FROM seroperfiles
    WHERE enfermedad IS NOT NULL AND enfermedad <> ''
    GROUP BY enfermedad
    ORDER BY enfermedad
  `);
  const [laboratorios] = await pool.query(`
    SELECT laboratorio AS value, COUNT(*) AS total
    FROM seroperfiles
    WHERE laboratorio IS NOT NULL AND laboratorio <> ''
    GROUP BY laboratorio
    ORDER BY laboratorio
  `);
  const [interpretaciones] = await pool.query(`
    SELECT interpretacion AS value, COUNT(*) AS total
    FROM seroperfiles
    WHERE interpretacion IS NOT NULL AND interpretacion <> ''
    GROUP BY interpretacion
    ORDER BY interpretacion
  `);

  response.json({ anios, trimestres, empresas, flujos, enfermedades, laboratorios, interpretaciones });
});

app.get('/api/seroperfiles/summary', async (_request, response) => {
  const [[totals]] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN interpretacion = 'Positivo' THEN 1 ELSE 0 END) AS positives,
      COUNT(DISTINCT granja) AS uniqueFarms,
      ROUND(AVG(resultado), 2) AS avgResult
    FROM seroperfiles
  `);

  const [byDisease] = await pool.query(`
    SELECT enfermedad AS disease, COUNT(*) AS value
    FROM seroperfiles
    GROUP BY enfermedad
    ORDER BY value DESC
    LIMIT 8
  `);

  const [byCompany] = await pool.query(`
    SELECT empresa AS label, COUNT(*) AS value
    FROM seroperfiles
    WHERE empresa IS NOT NULL AND empresa <> ''
    GROUP BY empresa
    ORDER BY value DESC
  `);

  const [byYear] = await pool.query(`
    SELECT anio AS label, COUNT(*) AS value
    FROM seroperfiles
    WHERE anio IS NOT NULL
    GROUP BY anio
    ORDER BY anio
  `);

  const [byInterpretation] = await pool.query(`
    SELECT interpretacion AS label, COUNT(*) AS value
    FROM seroperfiles
    WHERE interpretacion IS NOT NULL AND interpretacion <> ''
    GROUP BY interpretacion
    ORDER BY value DESC
  `);

  const [recent] = await pool.query(`
    SELECT ${selectColumns}
    FROM seroperfiles
    ORDER BY fecha DESC, id DESC
    LIMIT 4
  `);

  response.json({ totals, byDisease, byCompany, byYear, byInterpretation, recent });
});

app.get('/api/powerbi/seroperfiles', async (request, response) => {
  const { whereSql, params } = buildSeroperfilesFilters(request.query);
  const [rows] = await pool.execute(
    `SELECT ${selectColumns}
     FROM seroperfiles
     ${whereSql}
     ORDER BY fecha DESC, id DESC`,
    params,
  );

  response.json({
    generatedAt: new Date().toISOString(),
    total: rows.length,
    fields: powerBiFields,
    data: rows,
  });
});

app.get('/api/powerbi/schema', async (_request, response) => {
  const [[totals]] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      MIN(fecha) AS fechaDesde,
      MAX(fecha) AS fechaHasta,
      COUNT(DISTINCT empresa) AS empresas,
      COUNT(DISTINCT flujo) AS flujos,
      COUNT(DISTINCT enfermedad) AS enfermedades
    FROM seroperfiles
  `);

  const [empresas] = await pool.query(`
    SELECT empresa AS value, COUNT(*) AS total
    FROM seroperfiles
    WHERE empresa IS NOT NULL AND empresa <> ''
    GROUP BY empresa
    ORDER BY empresa
  `);

  const [flujos] = await pool.query(`
    SELECT flujo AS value, COUNT(*) AS total
    FROM seroperfiles
    WHERE flujo IS NOT NULL AND flujo <> ''
    GROUP BY flujo
    ORDER BY flujo
  `);

  const [enfermedades] = await pool.query(`
    SELECT enfermedad AS value, COUNT(*) AS total
    FROM seroperfiles
    WHERE enfermedad IS NOT NULL AND enfermedad <> ''
    GROUP BY enfermedad
    ORDER BY enfermedad
  `);

  response.json({
    generatedAt: new Date().toISOString(),
    source: {
      database: process.env.DB_NAME || 'registro_seroperfiles',
      table: 'seroperfiles',
      csvUrl: `${publicApiUrl}/api/powerbi/seroperfiles.csv`,
      jsonUrl: `${publicApiUrl}/api/powerbi/seroperfiles`,
    },
    totals,
    fields: powerBiFields,
    filters: {
      empresas,
      flujos,
      enfermedades,
    },
  });
});

app.get('/api/powerbi/seroperfiles.csv', async (request, response) => {
  const { whereSql, params } = buildSeroperfilesFilters(request.query);
  const [rows] = await pool.execute(
    `SELECT ${selectColumns}
     FROM seroperfiles
     ${whereSql}
     ORDER BY fecha DESC, id DESC`,
    params,
  );

  const headers = powerBiFields.map((field) => field.key);
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvValue(row[header])).join(',')),
  ].join('\n');

  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
  response.setHeader('Content-Disposition', 'attachment; filename="seroperfiles_powerbi.csv"');
  response.send(`\uFEFF${csv}`);
});

app.post('/api/seroperfiles/bulk', requireWriteRole, async (request, response) => {
  const records = request.body;
  if (!Array.isArray(records) || records.length === 0) {
    return response.status(400).json({ message: 'Envía al menos un registro para importar.' });
  }
  if (records.length > 5000) {
    return response.status(400).json({ message: 'El límite por archivo es de 5,000 registros.' });
  }

  const prepared = [];
  const errors = [];
  records.forEach((record, index) => {
    const { errors: rowErrors, date } = validateRecord(record || {});
    const row = Number(record?._rowNumber) || index + 2;
    if (rowErrors.length) {
      rowErrors.forEach((message) => errors.push({ row, message }));
    } else {
      prepared.push(recordParams(record, date, request.user.sub));
    }
  });
  if (errors.length) {
    return response.status(400).json({ message: 'El archivo contiene datos inválidos.', errors });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const params of prepared) await connection.execute(insertSeroperfilSql, params);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  response.status(201).json({ message: `${prepared.length.toLocaleString('es-MX')} registros importados correctamente.`, imported: prepared.length });
});

app.post('/api/seroperfiles', requireWriteRole, async (request, response) => {
  const record = request.body || {};
  const { errors, date } = validateRecord(record);
  if (errors.length > 0) {
    return response.status(400).json({ message: errors.join(' ') });
  }

  const params = recordParams(record, date, request.user.sub);
  const [result] = await pool.execute(insertSeroperfilSql, params);

  const [rows] = await pool.execute(
    `SELECT ${selectColumns} FROM seroperfiles WHERE id = :id`,
    { id: result.insertId },
  );

  response.status(201).json(rows[0]);
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({
    message: 'Error en la API.',
    ...(process.env.NODE_ENV === 'development' ? { detail: error.message } : {}),
  });
});

export default app;

if (!process.env.VERCEL) {
  app.listen(port, '127.0.0.1', () => {
    console.log(`API lista en http://127.0.0.1:${port}`);
  });
}
