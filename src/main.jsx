import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BarChart3,
  Check,
  ChevronDown,
  Database,
  Download,
  Eye,
  FilePlus2,
  Filter,
  LayoutDashboard,
  Lock,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  Table2,
  UserRound,
  Upload,
} from 'lucide-react';
import './styles.css';

const API_BASE = import.meta.env?.VITE_API_URL || (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://127.0.0.1:3002/api' : '/api');
const PAGE_SIZE = 100;

function getPowerBiEmbedUrl(reportUrl) {
  if (!reportUrl) return '';
  try {
    const url = new URL(reportUrl);
    // El reporte ya incluye sus propios filtros superiores. Ocultamos los
    // paneles nativos para mantener una vista limpia dentro de la aplicación.
    url.searchParams.set('filterPaneEnabled', 'false');
    url.searchParams.set('navContentPaneEnabled', 'false');
    return url.toString();
  } catch {
    return reportUrl;
  }
}

const initialRecords = [
  {
    id: 1,
    fecha: '2026-04-08',
    semana: 15,
    trimestre: 2,
    anio: 2026,
    razon: 'Seroperfil',
    empresa: 'Vallyava',
    flujo: 'Joya',
    granja: 'Joyas - Sitio 1',
    caseta: 'A-04',
    lote: 'JY-2604',
    funcion: 'Hembra',
    edad: 23,
    identidad: 8,
    muestra: 'Suero',
    laboratorio: 'DCV',
    caso: 'DCV26JY104',
    numMuestras: 24,
    enfermedad: 'Mycoplasma',
    tecnica: 'ELISA',
    resultado: 1.42,
    puntoCorte: 0.4,
    interpretacion: 'Positivo',
    comentarios: 'positivos >0.4',
  },
  {
    id: 2,
    fecha: '2026-03-21',
    semana: 12,
    trimestre: 1,
    anio: 2026,
    razon: 'Seroperfil',
    empresa: 'Vallpork',
    flujo: 'FASA',
    granja: 'San Javier S2/3',
    caseta: 'S2',
    lote: 'FASA-0326',
    funcion: 'Linea',
    edad: 9,
    identidad: 5,
    muestra: 'Suero',
    laboratorio: 'BI',
    caso: 'BIAH26HMCE024',
    numMuestras: 18,
    enfermedad: 'Influenza',
    tecnica: 'ELISA',
    resultado: 0.223,
    puntoCorte: 0.6,
    interpretacion: 'Positivo',
    comentarios: 'positivo <0.6',
  },
  {
    id: 3,
    fecha: '2025-11-15',
    semana: 46,
    trimestre: 4,
    anio: 2025,
    razon: 'Seroperfil',
    empresa: 'Vallyava',
    flujo: 'Tejas',
    granja: 'Santa Ana',
    caseta: 'B-11',
    lote: 'TJ-1125',
    funcion: 'GDU',
    edad: 7,
    identidad: 3,
    muestra: 'Suero',
    laboratorio: 'UNAM',
    caso: 'UNAM25TEJ391',
    numMuestras: 30,
    enfermedad: 'PRRS',
    tecnica: 'ELISA',
    resultado: 0.78,
    puntoCorte: 0.4,
    interpretacion: 'Positivo',
    comentarios: 'seguimiento trimestral',
  },
  {
    id: 4,
    fecha: '2025-07-03',
    semana: 27,
    trimestre: 3,
    anio: 2025,
    razon: 'Seroperfil',
    empresa: 'Vallyava',
    flujo: 'Sanfandila',
    granja: 'La Laguna S2',
    caseta: 'L-02',
    lote: 'SF-0725',
    funcion: 'Linea',
    edad: 5,
    identidad: 2,
    muestra: 'Suero',
    laboratorio: 'Lapisa',
    caso: 'LAP25SF220',
    numMuestras: 16,
    enfermedad: 'APP',
    tecnica: 'ELISA',
    resultado: 0.19,
    puntoCorte: 0.5,
    interpretacion: 'Negativo',
    comentarios: 'sin hallazgos',
  },
  {
    id: 5,
    fecha: '2024-04-30',
    semana: 18,
    trimestre: 2,
    anio: 2024,
    razon: 'Seroperfil',
    empresa: 'Vallpork',
    flujo: 'FASA',
    granja: 'San Javier S2/3',
    caseta: '',
    lote: '',
    funcion: 'Linea',
    edad: 5,
    identidad: 2,
    muestra: 'Suero',
    laboratorio: 'BI',
    caso: 'BIAH24HMCE021',
    numMuestras: '',
    enfermedad: 'Mycoplasma',
    tecnica: 'ELISA',
    resultado: 2.067,
    puntoCorte: 0.4,
    interpretacion: 'Positivo',
    comentarios: 'positivos >0.4',
  },
];

const options = {
  empresa: ['Vallyava', 'Vallpork'],
  flujo: ['Joya', 'Tejas', 'FASA', 'Zacatecas', 'Sanfandila', 'Tepuza', 'Alamos', 'Waris'],
  funcion: ['Linea', 'Hembra', 'GDU'],
  laboratorio: ['DCV', 'UNAM', 'Lapisa', 'BI', 'LIVE'],
  enfermedad: ['Mycoplasma', 'PRRS', 'Influenza', 'APP', 'Ojo Azul', 'Influenza H1N2'],
  tecnica: ['ELISA', 'VSN'],
  interpretacion: ['Positivo', 'Negativo', 'Sospechoso'],
};

const blankForm = {
  fecha: '',
  semana: '',
  trimestre: '',
  anio: new Date().getFullYear(),
  razon: 'Seroperfil',
  empresa: 'Vallyava',
  flujo: 'Joya',
  granja: '',
  caseta: '',
  lote: '',
  funcion: 'Linea',
  edad: '',
  identidad: '',
  muestra: 'Suero',
  laboratorio: 'DCV',
  caso: '',
  numMuestras: '',
  enfermedad: 'Mycoplasma',
  tecnica: 'ELISA',
  resultado: '',
  puntoCorte: '',
  interpretacion: 'Positivo',
  comentarios: '',
};

const blankRecordFilters = {
  q: '',
  anio: '',
  trimestre: '',
  empresa: '',
  flujo: '',
  enfermedad: '',
};

function readStoredSession() {
  try {
    return JSON.parse(sessionStorage.getItem('seroperfilesSession')) || null;
  } catch {
    return null;
  }
}

function getDateParts(value) {
  const date = new Date(`${value}T00:00:00Z`);
  const weekDate = new Date(date);
  weekDate.setUTCDate(weekDate.getUTCDate() + 4 - (weekDate.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(weekDate.getUTCFullYear(), 0, 1));
  return {
    anio: date.getUTCFullYear(),
    trimestre: Math.floor(date.getUTCMonth() / 3) + 1,
    semana: Math.ceil((((weekDate - yearStart) / 86400000) + 1) / 7),
  };
}

function App() {
  const [session, setSession] = useState(readStoredSession);
  const loggedIn = Boolean(session?.token && session?.user);
  const user = session?.user || null;
  const [view, setView] = useState('dashboard');
  const [powerBiReportUrl, setPowerBiReportUrl] = useState(() => localStorage.getItem('powerBiReportUrl') || '');
  const [records, setRecords] = useState(initialRecords);
  const [summary, setSummary] = useState(null);
  const [recordFilters, setRecordFilters] = useState(blankRecordFilters);
  const [recordFilterOptions, setRecordFilterOptions] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [form, setForm] = useState(blankForm);
  const [apiStatus, setApiStatus] = useState('Conectando con XAMPP...');

  async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        ...options.headers,
      },
      ...options,
    });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401 && session?.token) {
      sessionStorage.removeItem('seroperfilesSession');
      setSession(null);
    }
    if (!response.ok) {
      const error = new Error(payload.message || 'No se pudo conectar con la API.'); error.errors = payload.errors; throw error;
    }
    return payload;
  }

  async function loadRecords(filters = {}, page = 1) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set('page', page);
    params.set('limit', PAGE_SIZE);
    const data = await apiRequest(`/seroperfiles?${params.toString()}`);
    setRecords(data.data);
    setPagination(data.pagination);
    setApiStatus('Conectado a MySQL / XAMPP');
  }

  async function loadSummary() {
    const data = await apiRequest('/seroperfiles/summary');
    setSummary(data);
  }

  async function loadRecordFilterOptions() {
    const data = await apiRequest('/seroperfiles/filters');
    setRecordFilterOptions(data);
  }

  useEffect(() => {
    if (!loggedIn) return;
    Promise.all([loadRecords(recordFilters), loadSummary(), loadRecordFilterOptions()]).catch((error) => {
      setApiStatus(`Sin conexion API: ${error.message}`);
    });
  }, [loggedIn]);

  function updateRecordFilters(nextFilters) {
    setRecordFilters(nextFilters);
    loadRecords(nextFilters, 1).catch((error) => setApiStatus(`Sin conexion API: ${error.message}`));
  }

  function changePage(page) {
    loadRecords(recordFilters, page).catch((error) => setApiStatus(`Sin conexion API: ${error.message}`));
  }

  async function loadAllFilteredRecords() {
    const params = new URLSearchParams();
    Object.entries(recordFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const data = await apiRequest(`/powerbi/seroperfiles${params.size ? `?${params}` : ''}`);
    return data.data;
  }

  function updatePowerBiReportUrl(url) {
    setPowerBiReportUrl(url);
    if (url) {
      localStorage.setItem('powerBiReportUrl', url);
    } else {
      localStorage.removeItem('powerBiReportUrl');
    }
  }

  const metrics = useMemo(() => {
    if (summary?.totals) {
      return {
        positives: Number(summary.totals.positives || 0),
        uniqueFarms: Number(summary.totals.uniqueFarms || 0),
        avgResult: Number(summary.totals.avgResult || 0).toFixed(2),
        total: Number(summary.totals.total || 0),
      };
    }
    const positives = records.filter((record) => record.interpretacion === 'Positivo').length;
    const uniqueFarms = new Set(records.map((record) => record.granja)).size;
    const avgResult = records.reduce((sum, record) => sum + Number(record.resultado || 0), 0) / records.length;
    return { positives, uniqueFarms, avgResult: avgResult.toFixed(2), total: records.length };
  }, [records, summary]);

  async function submitRecord(event) {
    event.preventDefault();
    try {
      await apiRequest('/seroperfiles', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      await loadRecords(recordFilters, 1);
      setForm(blankForm);
      setView('records');
      await loadSummary();
      setApiStatus('Registro guardado en MySQL');
    } catch (error) {
      setApiStatus(`No se pudo guardar: ${error.message}`);
    }
  }

  if (!loggedIn) {
    return (
      <Login
        onLogin={async (credentials) => {
          const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
          });
          const nextSession = { token: data.token, user: data.user };
          sessionStorage.setItem('seroperfilesSession', JSON.stringify(nextSession));
          setSession(nextSession);
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><ShieldCheck size={22} /></div>
          <div>
            <strong>Seroperfiles</strong>
            <span>Registro sanitario</span>
          </div>
        </div>
        <nav>
          <NavButton active={view === 'dashboard'} icon={LayoutDashboard} label="Dashboard" onClick={() => setView('dashboard')} />
          <NavButton active={view === 'records'} icon={Table2} label="Datos" onClick={() => setView('records')} />
          <NavButton active={view === 'form'} icon={FilePlus2} label="Nuevo registro" onClick={() => setView('form')} />
          {(user?.rol === 'admin') && <NavButton active={view === 'upload'} icon={Upload} label="Subir Excel" onClick={() => setView('upload')} />}
          <NavButton active={view === 'powerbi'} icon={Database} label="Power BI" onClick={() => setView('powerbi')} />
          <NavButton active={view === 'password'} icon={Lock} label="Contraseña" onClick={() => setView('password')} />
        </nav>
        <button className="logout" onClick={() => { sessionStorage.removeItem('seroperfilesSession'); setSession(null); }}>
          <LogOut size={18} /> Salir
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p>Registro de seroperfiles</p>
            <h1>{viewTitles[view]}</h1>
          </div>
          <div className="user-chip">
            <UserRound size={18} />
            {user?.nombre || 'Analista'}
            <ChevronDown size={16} />
          </div>
        </header>

        {view === 'upload' && <BulkUpload apiRequest={apiRequest} />}
        {view === 'dashboard' && <Dashboard records={summary?.recent || records} metrics={metrics} summary={summary} powerBiReportUrl={powerBiReportUrl} onConfigurePowerBi={() => setView('powerbi')} />}
        {view === 'records' && (
          <Records
            records={records}
            filters={recordFilters}
            filterOptions={recordFilterOptions}
            pagination={pagination}
            onFiltersChange={updateRecordFilters}
            onPageChange={changePage}
            loadAllRecords={loadAllFilteredRecords}
            onNew={() => setView('form')}
          />
        )}
        {view === 'form' && <RecordForm form={form} setForm={setForm} onSubmit={submitRecord} />}
        {view === 'powerbi' && <PowerBiPanel apiRequest={apiRequest} reportUrl={powerBiReportUrl} onReportUrlChange={updatePowerBiReportUrl} />}
        {view === 'password' && (
          <ChangePasswordForm
            onSubmit={async (passwords) => {
              await apiRequest('/auth/change-password', { method: 'POST', body: JSON.stringify(passwords) });
              setApiStatus('Contraseña actualizada');
              setView('dashboard');
            }}
          />
        )}
      </main>
    </div>
  );
}

const viewTitles = {
  dashboard: 'Resumen general',
  records: 'Consulta de datos',
  form: 'Captura de seroperfil',
  powerbi: 'Conexión para Power BI',
  password: 'Cambiar contraseña',
};

function Login({ onLogin }) {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submitLogin(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin({ correo, password });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-copy">
          <span>Vallyava / Vallpork</span>
          <h1>Registro de seroperfiles</h1>
        </div>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={submitLogin}>
          <div className="lock"><Lock size={24} /></div>
          <h2>Iniciar sesión</h2>
          <label>Correo</label>
          <input value={correo} onChange={(event) => setCorreo(event.target.value)} type="email" />
          <label>Contraseña</label>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? 'Validando...' : 'Entrar'}</button>
        </form>
      </section>
    </main>
  );
}

function NavButton({ active, icon: Icon, label, onClick }) {
  return (
    <button className={active ? 'nav-button active' : 'nav-button'} onClick={onClick}>
      <Icon size={18} /> {label}
    </button>
  );
}

function ChangePasswordForm({ onSubmit }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (newPassword.length < 10) {
      setError('La nueva contraseña debe tener al menos 10 caracteres.');
      return;
    }
    if (newPassword !== confirmation) {
      setError('La confirmación no coincide.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ currentPassword, newPassword });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel password-form" onSubmit={submit}>
      <h2>Seguridad de la cuenta</h2>
      <Field label="Contraseña actual" type="password" value={currentPassword} onChange={setCurrentPassword} required />
      <Field label="Nueva contraseña" type="password" minLength="10" value={newPassword} onChange={setNewPassword} required />
      <Field label="Confirmar contraseña" type="password" minLength="10" value={confirmation} onChange={setConfirmation} required />
      {error && <p className="form-error">{error}</p>}
      <button className="primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Actualizar contraseña'}</button>
    </form>
  );
}

function Dashboard({ records, metrics, summary, powerBiReportUrl, onConfigurePowerBi }) {
  const byDisease = summary?.byDisease || options.enfermedad.map((disease) => ({
    disease,
    value: records.filter((record) => record.enfermedad === disease).length,
  })).filter((item) => item.value > 0);
  const byCompany = summary?.byCompany || [];
  const byYear = summary?.byYear || [];
  const byInterpretation = summary?.byInterpretation || [];

  return (
    <div className="content-stack">
      {powerBiReportUrl ? (
        <section className="panel powerbi-dashboard-panel">
          <div className="panel-title">
            <h2>Reporte Power BI</h2>
            <button className="secondary compact" type="button" onClick={onConfigurePowerBi}>Cambiar reporte</button>
          </div>
          <iframe title="Reporte Power BI" src={getPowerBiEmbedUrl(powerBiReportUrl)} allowFullScreen />
        </section>
      ) : (
        <section className="panel powerbi-empty-panel">
          <div>
            <h2>Usa Power BI para las graficas</h2>
            <p>Configura un enlace de reporte Power BI para verlo directamente aqui arriba del dashboard.</p>
          </div>
          <button className="primary small" type="button" onClick={onConfigurePowerBi}>Configurar Power BI</button>
        </section>
      )}
      <section className="kpi-grid">
        <Kpi icon={Table2} label="Registros" value={metrics.total} trend="13,586 en Excel base" />
        <Kpi icon={Check} label="Positivos" value={metrics.positives} trend="Interpretacion registrada" />
        <Kpi icon={BarChart3} label="Resultado prom." value={metrics.avgResult} trend="Muestras capturadas" />
        <Kpi icon={Database} label="Granjas" value={metrics.uniqueFarms} trend="Origen unico" />
      </section>
      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-title">
            <h2>Enfermedades monitoreadas</h2>
            <span>Registros por diagnóstico</span>
          </div>
          <HorizontalBars data={byDisease.map((item) => ({ label: item.disease, value: item.value }))} />
        </div>
        <div className="panel">
          <div className="panel-title">
            <h2>Interpretación</h2>
            <span>Distribución</span>
          </div>
          <SegmentChart data={byInterpretation} />
        </div>
      </section>
      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-title">
            <h2>Registros por año</h2>
            <span>Tendencia histórica</span>
          </div>
          <ColumnChart data={byYear} />
        </div>
        <div className="panel">
          <div className="panel-title">
            <h2>Empresas</h2>
            <span>Participación</span>
          </div>
          <HorizontalBars data={byCompany} compact />
        </div>
      </section>
      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-title">
            <h2>Actividad reciente</h2>
            <span>Ultimas capturas</span>
          </div>
          <div className="activity-list">
            {records.slice(0, 4).map((record) => (
              <article key={record.id}>
                <strong>{record.granja}</strong>
                <span>{record.enfermedad} / {record.laboratorio} / {record.fecha}</span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function HorizontalBars({ data, compact = false }) {
  const max = Math.max(...data.map((item) => Number(item.value || 0)), 1);
  return (
    <div className={compact ? 'bar-list compact-bars' : 'bar-list'}>
      {data.map((item) => (
        <div className="bar-row" key={item.label}>
          <span>{item.label}</span>
          <div><i style={{ width: `${(Number(item.value || 0) / max) * 100}%` }} /></div>
          <b>{Number(item.value || 0).toLocaleString('es-MX')}</b>
        </div>
      ))}
    </div>
  );
}

function ColumnChart({ data }) {
  const max = Math.max(...data.map((item) => Number(item.value || 0)), 1);
  return (
    <div className="column-chart">
      {data.map((item) => (
        <div className="column-item" key={item.label}>
          <div className="column-track">
            <i style={{ height: `${Math.max(8, (Number(item.value || 0) / max) * 100)}%` }} />
          </div>
          <b>{Number(item.value || 0).toLocaleString('es-MX')}</b>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function SegmentChart({ data }) {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
  return (
    <div className="segment-chart">
      <div className="segment-track">
        {data.map((item, index) => (
          <i
            className={`segment-${index % 4}`}
            key={item.label}
            style={{ width: `${(Number(item.value || 0) / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="segment-legend">
        {data.map((item, index) => (
          <span key={item.label}>
            <i className={`segment-${index % 4}`} />
            {item.label}: {Number(item.value || 0).toLocaleString('es-MX')}
          </span>
        ))}
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, trend }) {
  return (
    <article className="kpi">
      <Icon size={21} />
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{trend}</p>
    </article>
  );
}

function Records({ records, filters, filterOptions, pagination, onFiltersChange, onPageChange, loadAllRecords, onNew }) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  function setFilter(key, value) {
    onFiltersChange({ ...filters, [key]: value });
  }

  function clearFilters() {
    onFiltersChange(blankRecordFilters);
  }

  const activeFilters = Object.entries(filters).filter(([, value]) => value);

  async function exportXlsx() {
    setExporting(true);
    setExportError('');
    try {
      const [allRecords, XLSX] = await Promise.all([loadAllRecords(), import('xlsx')]);
      const rows = allRecords.map((record) => ({
      Fecha: record.fecha,
      Semana: record.semana,
      Trimestre: record.trimestre,
      Año: record.anio,
      Razón: record.razon,
      Empresa: record.empresa,
      Flujo: record.flujo,
      Granja: record.granja,
      Caseta: record.caseta,
      Lote: record.lote,
      Funcion: record.funcion,
      Edad: record.edad,
      Identidad: record.identidad,
      Muestra: record.muestra,
      Laboratorio: record.laboratorio,
      'No de caso': record.caso,
      'Num muestras': record.numMuestras,
      Enfermedad: record.enfermedad,
      Técnica: record.tecnica,
      Resultado: record.resultado,
      'Punto de corte': record.puntoCorte,
      Interpretación: record.interpretacion,
      Comentarios: record.comentarios,
    }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      worksheet['!cols'] = Object.keys(rows[0] || {}).map((key) => ({
        wch: Math.max(12, Math.min(28, key.length + 4)),
      }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Seroperfiles');
      XLSX.writeFile(workbook, `seroperfiles_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      setExportError(error.message || 'No se pudo generar el archivo.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="panel">
      <div className="records-header">
        <div>
          <h2>Datos</h2>
          <p>{pagination.total.toLocaleString('es-MX')} registros encontrados; mostrando {records.length.toLocaleString('es-MX')} en esta página.</p>
        </div>
        <div className="button-row">
          <button className="secondary compact" onClick={exportXlsx} type="button" disabled={exporting}>
            <Download size={17} /> {exporting ? 'Preparando...' : 'Excel completo'}
          </button>
          <button className="primary small" onClick={onNew}><Plus size={17} /> Nuevo</button>
        </div>
      </div>
      {exportError && <p className="form-error">{exportError}</p>}
      <div className="records-filter-panel">
        <div className="searchbox wide-search">
          <Search size={18} />
          <input value={filters.q} onChange={(event) => setFilter('q', event.target.value)} placeholder="Buscar empresa, granja, caso, laboratorio o enfermedad" />
        </div>
        <FilterSelect label="Año" value={filters.anio} items={filterOptions?.anios} onChange={(value) => setFilter('anio', value)} />
        <FilterSelect label="Trimestre" value={filters.trimestre} items={filterOptions?.trimestres} onChange={(value) => setFilter('trimestre', value)} />
        <FilterSelect label="Empresa" value={filters.empresa} items={filterOptions?.empresas} onChange={(value) => setFilter('empresa', value)} />
        <FilterSelect label="Flujo" value={filters.flujo} items={filterOptions?.flujos} onChange={(value) => setFilter('flujo', value)} />
        <FilterSelect label="Enfermedad" value={filters.enfermedad} items={filterOptions?.enfermedades} onChange={(value) => setFilter('enfermedad', value)} />
      </div>
      {activeFilters.length > 0 && (
        <div className="filter-chips">
          {activeFilters.map(([key, value]) => (
            <button key={key} type="button" onClick={() => setFilter(key, '')}>
              <span>{filterLabels[key]}</span>{value}
            </button>
          ))}
        </div>
      )}
      <div className="table-status">
        <span>Ordenado por fecha más reciente</span>
        <span>La exportación incluye todos los resultados filtrados</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Empresa</th>
              <th>Flujo</th>
              <th>Granja</th>
              <th>Enfermedad</th>
              <th>Resultado</th>
              <th>Interpretacion</th>
              <th>Caso</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.fecha}</td>
                <td>{record.empresa}</td>
                <td>{record.flujo}</td>
                <td>{record.granja}</td>
                <td>{record.enfermedad}</td>
                <td>{record.resultado}</td>
                <td><span className={`status ${(record.interpretacion || '').toLowerCase()}`}>{record.interpretacion || 'Sin dato'}</span></td>
                <td>{record.caso}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <button className="secondary compact" type="button" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>
          Anterior
        </button>
        <span>Página {pagination.page} de {pagination.totalPages}</span>
        <button className="secondary compact" type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)}>
          Siguiente
        </button>
      </div>
    </section>
  );
}

const filterLabels = {
  q: 'Busqueda',
  anio: 'Año',
  trimestre: 'Trimestre',
  empresa: 'Empresa',
  flujo: 'Flujo',
  enfermedad: 'Enfermedad',
};

function FilterSelect({ label, value, items = [], onChange }) {
  return (
    <label className="select-filter stacked-filter">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Todos</option>
        {items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.value} ({Number(item.total || 0).toLocaleString('es-MX')})
          </option>
        ))}
      </select>
    </label>
  );
}

function RecordForm({ form, setForm, onSubmit }) {
  const [showPreview, setShowPreview] = useState(false);
  const update = (key, value) => setForm((current) => {
    if (key !== 'fecha' || !value) return { ...current, [key]: value };
    return {
      ...current,
      fecha: value,
      ...getDateParts(value),
    };
  });
  return (
    <form className="form-layout" onSubmit={onSubmit}>
      <div className="input-rule-banner">La semana, el trimestre y el año se calculan automáticamente a partir de la fecha.</div>
      <FormSection title="Datos de muestreo">
        <Field label="Fecha" type="date" value={form.fecha} onChange={(v) => update('fecha', v)} required />
        <Field label="Semana" type="number" value={form.semana} onChange={(v) => update('semana', v)} readOnly />
        <Field label="Trimestre" type="number" value={form.trimestre} onChange={(v) => update('trimestre', v)} readOnly />
        <Field label="Año" type="number" value={form.anio} onChange={(v) => update('anio', v)} readOnly />
        <Select label="Empresa" value={form.empresa} options={options.empresa} onChange={(v) => update('empresa', v)} />
        <Select label="Flujo" value={form.flujo} options={options.flujo} onChange={(v) => update('flujo', v)} />
        <Field label="Granja" value={form.granja} onChange={(v) => update('granja', v)} required />
        <Field label="Caseta" value={form.caseta} onChange={(v) => update('caseta', v)} />
        <Field label="Lote" value={form.lote} onChange={(v) => update('lote', v)} />
      </FormSection>
      <FormSection title="Identificacion">
        <Select label="Funcion" value={form.funcion} options={options.funcion} onChange={(v) => update('funcion', v)} />
        <Field label="Edad" type="number" value={form.edad} onChange={(v) => update('edad', v)} />
        <Field label="Identidad" value={form.identidad} onChange={(v) => update('identidad', v)} />
        <Field label="Muestra" value={form.muestra} onChange={(v) => update('muestra', v)} />
        <Select label="Laboratorio" value={form.laboratorio} options={options.laboratorio} onChange={(v) => update('laboratorio', v)} />
        <Field label="No. de caso" value={form.caso} onChange={(v) => update('caso', v)} required />
        <Field label="Num. muestras" type="number" min="0" value={form.numMuestras} onChange={(v) => update('numMuestras', v)} />
      </FormSection>
      <FormSection title="Resultado diagnostico">
        <Select label="Enfermedad" value={form.enfermedad} options={options.enfermedad} onChange={(v) => update('enfermedad', v)} />
        <Select label="Tecnica" value={form.tecnica} options={options.tecnica} onChange={(v) => update('tecnica', v)} />
        <Field label="Resultado" type="number" min="0" step="0.001" value={form.resultado} onChange={(v) => update('resultado', v)} />
        <Field label="Punto de corte" type="number" min="0" step="0.001" value={form.puntoCorte} onChange={(v) => update('puntoCorte', v)} />
        <Select label="Interpretacion" value={form.interpretacion} options={options.interpretacion} onChange={(v) => update('interpretacion', v)} />
        <label className="field wide">
          <span>Comentarios</span>
          <textarea value={form.comentarios} onChange={(event) => update('comentarios', event.target.value)} />
        </label>
      </FormSection>
      <div className="form-actions">
        <button className="secondary" type="button" onClick={() => setShowPreview((value) => !value)}><Eye size={17} /> Vista previa</button>
        <button className="primary" type="submit"><Check size={17} /> Guardar registro</button>
      </div>
      {showPreview && (
        <section className="panel record-preview">
          <h2>Vista previa</h2>
          <p><strong>{form.granja || 'Sin granja'}</strong> · {form.empresa} · {form.fecha || 'Sin fecha'}</p>
          <p>{form.enfermedad} / {form.tecnica} — {form.interpretacion}</p>
          <p>{form.comentarios || 'Sin comentarios'}</p>
        </section>
      )}
    </form>
  );
}

function FormSection({ title, children }) {
  return (
    <section className="panel form-section">
      <h2>{title}</h2>
      <div className="field-grid">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, sanitize, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(sanitize ? sanitize(event.target.value) : event.target.value)} {...props} />
    </label>
  );
}

function Select({ label, value, options: items, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {items.map((item) => <option key={item}>{item}</option>)}
      </select>
    </label>
  );
}

function PowerBiPanel({ apiRequest, reportUrl, onReportUrlChange }) {
  const [draftReportUrl, setDraftReportUrl] = useState(reportUrl);
  // El reporte publicado contiene una tabla antigua vacía ("Datos Power BI")
  // y la tabla que realmente alimenta las visualizaciones ("Datos Power BI (2)").
  // Migramos la configuración anterior para que los filtros apunten al modelo real.
  const [powerBiTable, setPowerBiTable] = useState(() => {
    const storedTable = localStorage.getItem('powerBiTableName');
    return !storedTable || storedTable === 'Datos Power BI' ? 'Datos Power BI (2)' : storedTable;
  });
  const [urlError, setUrlError] = useState('');
  const [filterOptions, setFilterOptions] = useState(null);
  const [dataFilters, setDataFilters] = useState({ empresa: '', flujo: '', anio: '', trimestre: '', enfermedad: '', funcion: '' });
  const [selectedFields, setSelectedFields] = useState(['fecha', 'empresa', 'flujo', 'granja', 'enfermedad', 'funcion', 'edad', 'resultado', 'puntoCorte', 'interpretacion', 'trimestre', 'anio']);
  const [preview, setPreview] = useState(null);
  const [dataError, setDataError] = useState('');
  const [preparing, setPreparing] = useState(false);
  const [visualRows, setVisualRows] = useState([]);
  const [visualLoading, setVisualLoading] = useState(false);

  const fields = [
    ['fecha', 'Fecha'], ['empresa', 'Empresa'], ['flujo', 'Flujo'], ['granja', 'Granja'], ['caseta', 'Caseta'], ['lote', 'Lote'],
    ['enfermedad', 'Enfermedad'], ['tecnica', 'Técnica'], ['resultado', 'Resultado'], ['puntoCorte', 'Punto de corte'],
    ['interpretacion', 'Interpretación'], ['laboratorio', 'Laboratorio'], ['numMuestras', 'Núm. muestras'], ['semana', 'Semana'], ['trimestre', 'Trimestre'], ['anio', 'Año'], ['caso', 'No. de caso'], ['comentarios', 'Comentarios'],
  ];
  const powerBiColumnNames = {
    fecha: 'Fecha', empresa: 'Empresa', flujo: 'Flujo', granja: 'Granja', caseta: 'Caseta', lote: 'Lote',
    funcion: 'Funcion', edad: 'Edad', enfermedad: 'Enfermedad', tecnica: 'Tecnica', resultado: 'Resultado',
    puntoCorte: 'Punto_de_corte', interpretacion: 'Interpretacion', laboratorio: 'Laboratorio',
    numMuestras: 'Num_muestras', semana: 'Semana', trimestre: 'Trimestre', anio: 'Anio', caso: 'Caso', comentarios: 'Comentarios',
  };

  useEffect(() => {
    apiRequest('/seroperfiles/filters').then(setFilterOptions).catch((error) => setDataError(error.message));
  }, []);

  useEffect(() => {
    if (powerBiTable === 'Datos Power BI') {
      setPowerBiTable('Datos Power BI (2)');
      localStorage.setItem('powerBiTableName', 'Datos Power BI (2)');
    }
  }, [powerBiTable]);

  function toggleField(key) {
    setSelectedFields((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }

  async function getFilteredRecords() {
    const params = new URLSearchParams();
    Object.entries(dataFilters).forEach(([key, value]) => { if (value && key !== 'funcion') params.set(key, value); });
    const data = await apiRequest(`/powerbi/seroperfiles${params.size ? `?${params}` : ''}`);
    return data.data;
  }

  async function getSelectedData() {
    if (!selectedFields.length) throw new Error('Selecciona al menos una columna para el reporte.');
    const records = await getFilteredRecords();
    return records.map((record) => Object.fromEntries(selectedFields.map((key) => [powerBiColumnNames[key] || key, record[key] ?? ''])));
  }

  useEffect(() => {
    let cancelled = false;
    setVisualLoading(true);
    getFilteredRecords().then((rows) => { if (!cancelled) setVisualRows(rows); }).catch((error) => { if (!cancelled) setDataError(error.message); }).finally(() => { if (!cancelled) setVisualLoading(false); });
    return () => { cancelled = true; };
  }, [dataFilters]);

  const functionFilterOptions = useMemo(() => {
    const totals = new Map();
    visualRows.forEach((record) => { const value = record.funcion || 'Sin función'; totals.set(value, (totals.get(value) || 0) + 1); });
    return [...totals.entries()].sort(([a], [b]) => a.localeCompare(b, 'es-MX')).map(([value, total]) => ({ value, total }));
  }, [visualRows]);
  const reportRows = dataFilters.funcion ? visualRows.filter((record) => (record.funcion || 'Sin función') === dataFilters.funcion) : visualRows;
  const pivotGroups = useMemo(() => {
    const groups = new Map();
    reportRows.forEach((record) => {
      const group = record.funcion || 'Sin función';
      const age = record.edad ?? 'Sin edad';
      const groupRows = groups.get(group) || new Map();
      const values = groupRows.get(age) || { result: [], cut: [] };
      if (Number.isFinite(Number(record.resultado))) values.result.push(Number(record.resultado));
      if (Number.isFinite(Number(record.puntoCorte))) values.cut.push(Number(record.puntoCorte));
      groupRows.set(age, values); groups.set(group, groupRows);
    });
    const detailGroups = [...groups.entries()].map(([group, ages]) => ({
      group,
      rows: [...ages.entries()].sort(([a], [b]) => Number(a) - Number(b)).map(([age, values]) => ({
        age,
        result: values.result.length ? values.result.reduce((sum, value) => sum + value, 0) / values.result.length : 0,
        cut: values.cut.length ? values.cut.reduce((sum, value) => sum + value, 0) / values.cut.length : 0,
      })),
    }));
    return detailGroups;
  }, [reportRows, dataFilters.funcion]);
  // Al no seleccionar una función, el reporte se mantiene en un nivel
  // resumido. Mezclar todas las edades de todas las funciones en una sola
  // línea vuelve ilegibles tanto el eje como la gráfica.
  const groupSummaries = useMemo(() => pivotGroups.map(({ group, rows }) => ({
    group,
    result: rows.length ? rows.reduce((sum, row) => sum + row.result, 0) / rows.length : 0,
    cut: rows.length ? rows.reduce((sum, row) => sum + row.cut, 0) / rows.length : 0,
  })), [pivotGroups]);
  const isDetailView = Boolean(dataFilters.funcion);
  const selectedGroup = isDetailView ? pivotGroups[0] : null;
  const chartRows = isDetailView && selectedGroup
    ? selectedGroup.rows.map((row) => ({ ...row, label: String(row.age), tooltip: `${selectedGroup.group} · ${row.age}` }))
    : groupSummaries.map((row) => ({ ...row, label: row.group, tooltip: row.group }));
  const overallResult = chartRows.length ? chartRows.reduce((sum, row) => sum + row.result, 0) / chartRows.length : 0;
  const overallCut = chartRows.length ? chartRows.reduce((sum, row) => sum + row.cut, 0) / chartRows.length : 0;
  const chartMax = Math.max(50, Math.ceil(Math.max(...chartRows.map((row) => Math.max(row.result, row.cut)), 0) / 10) * 10);
  const chartY = (value) => 188 - (Number(value || 0) / chartMax) * 146;
  const chartX = (index) => 72 + (index * 532) / Math.max(1, chartRows.length - 1);
  const chartPoint = (value, index) => `${chartX(index)},${chartY(value)}`;
  const chartTicks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => ({ value: chartMax * fraction, y: chartY(chartMax * fraction) }));
  const resultPoints = chartRows.map((row, index) => chartPoint(row.result, index)).join(' ');
  const cutPoints = chartRows.map((row, index) => chartPoint(row.cut, index)).join(' ');
  const chartLabelStep = chartRows.length > 14 ? Math.ceil(chartRows.length / 9) : 1;
  const pivotRows = isDetailView ? chartRows : groupSummaries;
  const filterDisplayNames = { empresa: 'Empresa', flujo: 'Flujo', anio: 'Año', trimestre: 'Trimestre', enfermedad: 'Enfermedad', funcion: 'Función' };

  async function buildPreview() {
    setPreparing(true); setDataError('');
    try {
      const rows = await getSelectedData();
      setPreview(rows);
    } catch (error) { setDataError(error.message); } finally { setPreparing(false); }
  }

  async function downloadPowerBiData() {
    setPreparing(true); setDataError('');
    try {
      const [rows, XLSX] = await Promise.all([getSelectedData(), import('xlsx')]);
      const worksheet = XLSX.utils.json_to_sheet(rows);
      worksheet['!cols'] = Object.keys(rows[0] || {}).map((key) => ({ wch: Math.max(13, Math.min(25, key.length + 4)) }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos Power BI');
      XLSX.writeFile(workbook, `powerbi_seroperfiles_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) { setDataError(error.message); } finally { setPreparing(false); }
  }

  function saveReportUrl() {
    try {
      const url = new URL(draftReportUrl.trim());
      if (url.protocol !== 'https:' || url.hostname !== 'app.powerbi.com') {
        throw new Error('Usa una URL HTTPS del dominio app.powerbi.com.');
      }
      setUrlError('');
      onReportUrlChange(url.toString());
      localStorage.setItem('powerBiTableName', powerBiTable.trim() || 'Datos Power BI');
    } catch (error) {
      setUrlError(error.message === 'Invalid URL' ? 'Ingresa una URL válida.' : error.message);
    }
  }

  function getFilteredReportUrl() {
    if (!reportUrl) {
      return '';
    }
    const table = powerBiTable.trim();
    if (!table) {
      return reportUrl;
    }
    const powerBiFilterFields = { empresa: 'Empresa', flujo: 'Flujo', anio: 'Anio', trimestre: 'Trimestre', enfermedad: 'Enfermedad', funcion: 'Funcion' };
    const powerBiIdentifier = (value) => String(value).replace(/[^A-Za-z0-9_]/g, (character) => `_x${character.charCodeAt(0).toString(16).padStart(4, '0')}_`);
    const numericFilters = new Set(['anio', 'trimestre']);
    const clauses = Object.entries(dataFilters)
      .filter(([, value]) => value)
      .map(([key, value]) => `${powerBiIdentifier(table)}/${powerBiIdentifier(powerBiFilterFields[key] || key)} eq ${numericFilters.has(key) ? value : `'${String(value).replaceAll("'", "''")}'`}`);
    try {
      const url = new URL(getPowerBiEmbedUrl(reportUrl));
      // En "Website or portal" (reportEmbed), Power BI lee literalmente
      // "$filter". Se agrega manualmente para conservar el signo $ en el
      // enlace de inserción (en vez de serializarlo como %24filter).
      url.searchParams.delete('$filter');
      url.searchParams.delete('filter');
      if (clauses.length) {
        const separator = url.search ? '&' : '?';
        return `${url.toString()}${separator}$filter=${encodeURIComponent(clauses.join(' and '))}`;
      } else {
        return url.toString();
      }
    } catch {
      return reportUrl;
    }
  }

  function openFilteredPowerBi() {
    const filteredUrl = getFilteredReportUrl();
    if (!filteredUrl) {
      setUrlError('Primero configura y guarda la URL del reporte de Power BI.');
      return;
    }
    window.open(filteredUrl, '_blank', 'noopener,noreferrer');
    setUrlError('');
  }

  const filteredReportUrl = getFilteredReportUrl();

  function scrollToPowerBiConfig() {
    document.getElementById('powerbi-report-config')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <section className="powerbi-only">
      <div className="panel powerbi-visual-report">
        <div className="panel-title">
          <div><span className="eyebrow">Vista de reporte</span><h2>{isDetailView ? `Resultado por edad · ${dataFilters.funcion}` : 'Resumen de resultado por función'}</h2><p>{isDetailView ? 'Compara el resultado promedio de cada edad contra su punto de corte.' : 'Selecciona una función para desglosar el resultado por edad.'}</p></div>
          <span>{visualLoading ? 'Actualizando datos...' : `${reportRows.length.toLocaleString('es-MX')} registros incluidos`}</span>
        </div>
        <div className="report-filter-bar">
          <FilterSelect label="Año" value={dataFilters.anio} items={filterOptions?.anios} onChange={(value) => setDataFilters((current) => ({ ...current, anio: value }))} />
          <FilterSelect label="Trimestre" value={dataFilters.trimestre} items={filterOptions?.trimestres} onChange={(value) => setDataFilters((current) => ({ ...current, trimestre: value }))} />
          <FilterSelect label="Flujo" value={dataFilters.flujo} items={filterOptions?.flujos} onChange={(value) => setDataFilters((current) => ({ ...current, flujo: value }))} />
          <FilterSelect label="Enfermedad" value={dataFilters.enfermedad} items={filterOptions?.enfermedades} onChange={(value) => setDataFilters((current) => ({ ...current, enfermedad: value }))} />
          <FilterSelect label="Función" value={dataFilters.funcion} items={functionFilterOptions} onChange={(value) => setDataFilters((current) => ({ ...current, funcion: value }))} />
        </div>
        <div className="powerbi-filter-summary">
          {Object.entries(dataFilters).filter(([, value]) => value).length ? Object.entries(dataFilters).filter(([, value]) => value).map(([key, value]) => <span key={key}>{filterDisplayNames[key]} <b>{value}</b></span>) : <span>Mostrando todos los registros. Usa estos filtros para acotar el análisis.</span>}
        </div>
        <div className="powerbi-open-report">
          <div><strong>{reportUrl ? '¿Listo para ver el reporte en Power BI?' : 'Configura primero un reporte publicado de Power BI'}</strong><span>{reportUrl ? 'Abre el reporte publicado con los filtros seleccionados en esta pantalla.' : 'Aún falta pegar y guardar la URL de inserción del reporte.'}</span></div>
          {reportUrl ? <button className="primary small" type="button" onClick={openFilteredPowerBi}><BarChart3 size={17} /> Abrir Power BI filtrado</button> : <button className="secondary" type="button" onClick={scrollToPowerBiConfig}>Configurar URL del reporte</button>}
        </div>
        <div className="powerbi-visual-grid">
          <div className="powerbi-pivot-wrap">
            <div className="visual-section-title"><div><strong>{isDetailView ? `Detalle: ${dataFilters.funcion}` : 'Detalle por función'}</strong><span>{isDetailView ? 'Edades incluidas en el análisis' : 'Elige una función para ver sus edades'}</span></div></div>
            <table className="powerbi-pivot">
              <thead><tr><th>{isDetailView ? 'Edad' : 'Función'}</th><th>Resultado prom.</th><th>Punto de corte prom.</th></tr></thead>
              <tbody>
                {pivotRows.map((row) => <tr key={isDetailView ? row.label : row.group} className={isDetailView ? 'pivot-detail' : 'pivot-group'}><td>{isDetailView ? row.label : row.group}</td><td>{row.result.toFixed(2)}</td><td>{row.cut.toFixed(2)}</td></tr>)}
                {chartRows.length > 0 && <tr className="pivot-total"><td>Total general</td><td>{overallResult.toFixed(2)}</td><td>{overallCut.toFixed(2)}</td></tr>}
                {!pivotRows.length && <tr><td colSpan="3">No hay datos para los filtros seleccionados.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="powerbi-chart-wrap">
            <div className="visual-section-title"><div><strong>Comparativo de resultados</strong><span>{isDetailView ? `Edades de ${dataFilters.funcion}` : 'Promedio por función'}</span></div></div>
            <div className="powerbi-chart-legend"><span><i className="result-line" />Resultado promedio</span><span><i className="cut-line" />Punto de corte promedio</span></div>
            <svg className="powerbi-line-chart" viewBox="0 0 640 248" role="img" aria-label="Gráfica de resultados y punto de corte">
              {chartTicks.map((tick) => <React.Fragment key={tick.value}><line x1="72" x2="604" y1={tick.y} y2={tick.y} className="chart-grid-line" /><text x="60" y={tick.y + 3} textAnchor="end" className="chart-scale">{tick.value.toFixed(0)}</text></React.Fragment>)}
              <line x1="72" x2="604" y1="188" y2="188" className="chart-axis" />
              {chartRows.length > 1 && <><polyline points={resultPoints} className="chart-result" /><polyline points={cutPoints} className="chart-cut" /></>}
              {chartRows.map((row, index) => <React.Fragment key={`${row.tooltip}-${index}`}><circle cx={chartX(index)} cy={chartY(row.result)} r="4.5" className="chart-result-dot"><title>{`${row.tooltip}: Resultado ${row.result.toFixed(2)}`}</title></circle><circle cx={chartX(index)} cy={chartY(row.cut)} r="4" className="chart-cut-dot"><title>{`${row.tooltip}: Punto de corte ${row.cut.toFixed(2)}`}</title></circle>{(index % chartLabelStep === 0 || index === chartRows.length - 1) && <text x={chartX(index)} y="207" textAnchor="middle" className="chart-label">{row.label}</text>}</React.Fragment>)}
              {chartRows.length > 0 && <text x="338" y="235" textAnchor="middle" className="chart-axis-title">{isDetailView ? 'Edad (días)' : 'Función'}</text>}
              {!chartRows.length && <text x="320" y="125" textAnchor="middle" className="chart-empty">No hay datos para los filtros elegidos.</text>}
            </svg>
          </div>
        </div>
      </div>
      <div className="panel powerbi-control-panel" id="powerbi-report-config">
        <div className="panel-title">
          <h2>Graficas Power BI</h2>
          <span>{reportUrl ? 'Reporte configurado' : 'Pega el enlace del reporte'}</span>
        </div>
        <div className="powerbi-setup-grid">
          <div className="powerbi-step active">
            <b>1</b>
            <span>Crea tus graficas en Power BI Desktop</span>
          </div>
          <div className="powerbi-step active">
            <b>2</b>
            <span>Publica el reporte en Power BI Service</span>
          </div>
          <div className="powerbi-step active">
            <b>3</b>
            <span>Pega aqui la URL de insercion</span>
          </div>
        </div>
        <label className="field powerbi-url-field">
          <span>URL del reporte Power BI</span>
          <input
            value={draftReportUrl}
            onChange={(event) => setDraftReportUrl(event.target.value)}
            placeholder="https://app.powerbi.com/reportEmbed?reportId=..."
          />
        </label>
        <label className="field powerbi-url-field">
          <span>Tabla del modelo en Power BI</span>
          <input value={powerBiTable} onChange={(event) => setPowerBiTable(event.target.value)} placeholder="Datos Power BI (2)" />
        </label>
        {urlError && <p className="form-error">{urlError}</p>}
        <div className="button-row">
          <button className="primary small" type="button" onClick={saveReportUrl}>
            <Check size={17} /> Mostrar graficas
          </button>
          <button className="secondary" type="button" onClick={() => { setDraftReportUrl(''); onReportUrlChange(''); }}>
            <Filter size={17} /> Quitar reporte
          </button>
        </div>
        <p className="powerbi-note">
          Usa la URL del reporte publicado. La tabla debe llamarse igual que en el panel Datos de Power BI; en este reporte es <b>Datos Power BI (2)</b>.
        </p>
      </div>

      <div className="panel powerbi-report-surface">
        {reportUrl ? (
          <iframe title="Graficas Power BI" src={filteredReportUrl} allowFullScreen />
        ) : (
          <div className="powerbi-placeholder">
            <BarChart3 size={46} />
            <h2>Aqui apareceran tus graficas de Power BI</h2>
            <p>Pega una URL de reporte para reemplazar este espacio por el dashboard real de Power BI.</p>
          </div>
        )}
      </div>
    </section>
  );
}

createRoot(document.getElementById('root')).render(<App />);


function BulkUpload({ apiRequest }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [success, setSuccess] = useState('');

  const columns = [
    ['fecha', 'Fecha', true], ['empresa', 'Empresa', true], ['granja', 'Granja', true], ['enfermedad', 'Enfermedad', true],
    ['razon', 'Razón'], ['flujo', 'Flujo'], ['caseta', 'Caseta'], ['lote', 'Lote'], ['funcion', 'Función'], ['edad', 'Edad'],
    ['identidad', 'Identidad'], ['muestra', 'Muestra'], ['laboratorio', 'Laboratorio'], ['caso', 'No de caso'], ['numMuestras', 'Num muestras'],
    ['tecnica', 'Técnica'], ['resultado', 'Resultado'], ['puntoCorte', 'Punto de corte'], ['interpretacion', 'Interpretación'], ['comentarios', 'Comentarios'],
  ];
  const aliases = { razon: ['razon', 'razón'], funcion: ['funcion', 'función'], caso: ['no de caso', 'caso'], numMuestras: ['num muestras', 'nummuestras'], tecnica: ['tecnica', 'técnica'], puntoCorte: ['punto de corte', 'puntocorte'], interpretacion: ['interpretacion', 'interpretación'] };
  const limits = { empresa: 120, flujo: 120, granja: 180, caseta: 80, lote: 100, funcion: 100, identidad: 100, muestra: 100, laboratorio: 120, caso: 120, enfermedad: 140, tecnica: 100, interpretacion: 80 };
  const canonical = (value) => String(value ?? '').trim().toLocaleLowerCase('es-MX').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
  const catalogValues = {
    empresa: options.empresa,
    flujo: options.flujo,
    funcion: options.funcion,
    laboratorio: options.laboratorio,
    enfermedad: options.enfermedad,
    tecnica: options.tecnica,
    interpretacion: options.interpretacion,
    muestra: ['Suero'],
  };
  const displayValue = (value) => `“${String(value ?? '').trim().slice(0, 40)}”`;

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setReport(null);
    setSuccess('');
  };

  const downloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const headers = columns.map(([, label]) => label);
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    worksheet['!cols'] = headers.map((header) => ({ wch: Math.max(14, header.length + 4) }));
    const guide = XLSX.utils.aoa_to_sheet([
      ['Guía de carga masiva'],
      ['No cambies los nombres de las columnas.'],
      ['Obligatorios: Fecha, Empresa, Granja y Enfermedad.'],
      ['Fecha: usa AAAA-MM-DD, por ejemplo 2026-04-08. No se aceptan fechas inexistentes ni texto.'],
      ['Los campos numéricos no aceptan letras, fórmulas ni valores negativos. Num muestras debe ser entero.'],
      ['Empresa, Flujo, Función, Laboratorio, Enfermedad, Técnica e Interpretación deben coincidir con las opciones del sistema.'],
      [],
      ['Ejemplo válido'],
      ['Fecha', 'Empresa', 'Flujo', 'Granja', 'Enfermedad', 'Edad', 'Num muestras', 'Resultado'],
      ['2026-04-08', 'Vallyava', 'Joya', 'Granja ejemplo', 'Mycoplasma', 23, 24, 1.42],
      [],
      ['Ejemplos que se rechazan'],
      ['Fecha', 'Motivo'],
      ['2026-02-30', 'No existe esa fecha.'],
      ['texto', 'La fecha debe tener formato AAAA-MM-DD.'],
      ['Vallporck', 'Empresa no reconocida. Usa Vallpork o Vallyava.'],
      ['veinte', 'Edad debe ser número; por ejemplo 20.'],
    ]);
    guide['!cols'] = [{ wch: 24 }, { wch: 64 }, { wch: 20 }, { wch: 24 }, { wch: 24 }, { wch: 12 }, { wch: 16 }, { wch: 14 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros');
    XLSX.utils.book_append_sheet(workbook, guide, 'Instrucciones');
    XLSX.writeFile(workbook, 'plantilla_carga_seroperfiles.xlsx');
  };

  const validateFile = async () => {
    if (!file) return;
    setLoading(true);
    setReport(null);
    setSuccess('');
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('El archivo supera el límite de 10 MB.');
      if (!/\.(xlsx|xls|csv)$/i.test(file.name)) throw new Error('Selecciona un archivo .xlsx, .xls o .csv.');
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { cellDates: true, raw: true });
      const sheetName = workbook.SheetNames.includes('Registros') ? 'Registros' : workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) throw new Error('No se encontró una hoja para importar.');
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
      if (rows.length < 2) throw new Error('El archivo debe incluir encabezados y al menos un registro.');
      const headers = rows[0].map(canonical);
      const headerIndex = Object.fromEntries(headers.map((header, index) => [header, index]));
      const fieldIndex = Object.fromEntries(columns.map(([key, label]) => [key, (aliases[key] || [label]).map(canonical).map((name) => headerIndex[name]).find((index) => index !== undefined)]));
      const errors = [];
      const warnings = [];
      const duplicateHeaders = headers.filter((header, index) => header && headers.indexOf(header) !== index);
      [...new Set(duplicateHeaders)].forEach((header) => errors.push({ cell: 'Encabezados', message: `La columna “${header}” está repetida. Déjala una sola vez.` }));
      columns.filter(([key, , required]) => required && fieldIndex[key] === undefined).forEach(([, label]) => errors.push({ cell: 'Encabezados', message: `Falta la columna obligatoria “${label}”.` }));
      if (sheetName !== 'Registros') warnings.push({ cell: 'Hoja', message: `Se usará la primera hoja: “${sheetName}”. Para evitar errores usa la hoja “Registros” de la plantilla.` });
      headers.forEach((header, index) => {
        if (header && !Object.values(fieldIndex).includes(index)) warnings.push({ cell: `${XLSX.utils.encode_col(index)}1`, message: `La columna “${rows[0][index]}” no se importará.` });
      });
      const normalizeDate = (value) => {
        if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
        if (typeof value === 'number') {
          const parsed = XLSX.SSF.parse_date_code(value);
          if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
        }
        const text = String(value ?? '').trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return '';
        const date = new Date(`${text}T00:00:00Z`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text ? text : '';
      };
      const records = [];
      rows.slice(1).forEach((row, rowOffset) => {
        const rowNumber = rowOffset + 2;
        if (row.every((value) => String(value ?? '').trim() === '')) return;
        const record = { _rowNumber: rowNumber };
        columns.forEach(([key, label, required]) => {
          const column = fieldIndex[key];
          const cell = column === undefined ? '' : `${XLSX.utils.encode_col(column)}${rowNumber}`;
          let value = column === undefined ? '' : row[column];
          const sourceCell = column === undefined ? null : sheet[XLSX.utils.encode_cell({ r: rowOffset + 1, c: column })];
          if (sourceCell?.f) errors.push({ cell, message: `${label} no puede contener fórmulas. Escribe el valor final.` });
          if (key === 'fecha') value = normalizeDate(value);
          else value = String(value ?? '').trim();
          record[key] = value;
          if (required && !value) errors.push({ cell: cell || 'Encabezados', message: `${label} es obligatorio.` });
          if (value && typeof value === 'string' && /[\u0000-\u001F\u007F]/.test(value)) errors.push({ cell, message: `${label} contiene un carácter no permitido.` });
          if (value && typeof value === 'string' && /^[=+\-@]/.test(value) && key !== 'fecha') errors.push({ cell, message: `${label} no puede iniciar con un carácter de fórmula.` });
          if (limits[key] && value && !/^[\p{L}\p{N}\s.,()/#-]+$/u.test(String(value))) errors.push({ cell, message: `${label} contiene caracteres especiales no permitidos.` });
          if (limits[key] && value && String(value).length > limits[key]) errors.push({ cell, message: `${label} excede ${limits[key]} caracteres.` });
          if (value && catalogValues[key]) {
            const matchedValue = catalogValues[key].find((candidate) => canonical(candidate) === canonical(value));
            if (!matchedValue) errors.push({ cell, message: `${label} ${displayValue(value)} no es una opción válida. Revisa la plantilla.` });
            else record[key] = matchedValue;
          }
        });
        if (fieldIndex.fecha !== undefined && row[fieldIndex.fecha] !== '' && !record.fecha) errors.push({ cell: `${XLSX.utils.encode_col(fieldIndex.fecha)}${rowNumber}`, message: `Fecha ${displayValue(row[fieldIndex.fecha])} inválida. Usa AAAA-MM-DD; ejemplo: 2026-04-08.` });
        [['edad', 'Edad', false], ['numMuestras', 'Num muestras', true], ['resultado', 'Resultado', false], ['puntoCorte', 'Punto de corte', false]].forEach(([key, label, integer]) => {
          if (fieldIndex[key] === undefined) return;
          const value = record[key];
          if (value === '') return;
          const pattern = integer ? /^\d+$/ : /^\d+(?:[.,]\d+)?$/;
          if (!pattern.test(value) || Number(value.replace(',', '.')) < 0) errors.push({ cell: `${XLSX.utils.encode_col(fieldIndex[key])}${rowNumber}`, message: `${label} ${displayValue(value)} debe ser ${integer ? 'un entero' : 'un número'} no negativo.` });
          else record[key] = value.replace(',', '.');
        });
        records.push(record);
      });
      if (records.length > 5000) errors.push({ cell: 'Archivo', message: 'El límite por archivo es de 5,000 registros.' });
      setReport({ total: records.length, validRecords: errors.length ? [] : records, errors, warnings });
    } catch (err) {
      setReport({ total: 0, validRecords: [], errors: [{ cell: 'Archivo', message: err.message || 'No se pudo procesar el archivo.' }], warnings: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!report?.validRecords?.length) return;
    setLoading(true);
    setSuccess('');
    try {
      const res = await apiRequest('/seroperfiles/bulk', {
        method: 'POST',
        body: JSON.stringify(report.validRecords),
      });
      setSuccess(res.message || 'Carga completada.');
      setFile(null);
      setReport(null);
    } catch (err) {
      const apiErrors = (err.errors || []).map((error) => ({ cell: error.row ? `Fila ${error.row}` : 'Servidor', message: error.message || String(error) }));
      setReport((current) => ({ ...(current || { total: 0, validRecords: [], warnings: [] }), errors: apiErrors.length ? apiErrors : [{ cell: 'Servidor', message: err.message || 'Error al importar el archivo.' }], validRecords: [] }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel upload-page">
      <div className="upload-hero">
        <div className="upload-hero-icon"><Upload size={28} /></div>
        <div>
          <span className="eyebrow">Importación controlada</span>
          <h2>Carga masiva de Excel</h2>
          <p>Valida cada dato antes de incorporarlo a la base: sin filas incompletas ni cargas parciales.</p>
        </div>
      </div>

      <div className="upload-steps" aria-label="Pasos de importación">
        <div className="upload-step"><b>1</b><span>Descarga la plantilla</span></div>
        <div className="upload-step"><b>2</b><span>Selecciona y valida el archivo</span></div>
        <div className="upload-step"><b>3</b><span>Confirma la importación</span></div>
      </div>

      <div className="upload-workspace">
        <div className="upload-dropzone">
          <input id="excel-upload" className="file-input" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
          <label htmlFor="excel-upload" className="file-picker">
            <Upload size={23} />
            <strong>{file ? file.name : 'Selecciona tu archivo Excel'}</strong>
            <span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · listo para validar` : 'Formatos admitidos: .xlsx, .xls y .csv · máximo 10 MB'}</span>
          </label>
          <div className="upload-actions">
            <button className="secondary" onClick={downloadTemplate} type="button"><Download size={17} /> Descargar plantilla</button>
            <button className="primary" onClick={validateFile} disabled={!file || loading}>
              {loading ? 'Procesando...' : 'Validar archivo'}
            </button>
          </div>
        </div>
        <aside className="upload-rules">
          <strong>Validación automática</strong>
          <span>Fecha, Empresa, Granja y Enfermedad son obligatorios.</span>
          <span>Fecha: AAAA-MM-DD; ejemplo: 2026-04-08.</span>
          <span>Los campos numéricos no aceptan letras ni negativos.</span>
          <span>Se rechazan fórmulas, fechas inexistentes y valores mal escritos.</span>
          <div className="upload-examples">
            <b>Ejemplos</b>
            <p><em>Correcto</em> Fecha: <code>2026-04-08</code></p>
            <p><em>Se rechaza</em> Fecha: <code>texto</code> o <code>2026-02-30</code></p>
            <p><em>Se rechaza</em> Edad: <code>veinte</code></p>
          </div>
        </aside>
      </div>

      {report && (
        <div className={`upload-report ${report.errors.length ? 'has-errors' : 'is-ready'}`}>
          <div className="upload-report-head">
            <div className="upload-report-icon">{report.errors.length ? '!' : <Check size={21} />}</div>
            <div>
              <strong>{report.errors.length ? `${report.errors.length} error(es) encontrados` : 'Archivo listo para importar'}</strong>
              <span>{report.errors.length ? 'Corrige los datos indicados y vuelve a validar el archivo.' : `${report.total.toLocaleString('es-MX')} registros superaron todas las validaciones.`}</span>
            </div>
          </div>
          {report.errors.length > 0 && <ul className="upload-issues">{report.errors.slice(0, 100).map((error, index) => <li key={`${error.cell}-${index}`}><b>{error.cell}</b><span>{error.message}</span></li>)}</ul>}
          {report.errors.length > 100 && <p className="upload-note">Se muestran los primeros 100 errores.</p>}
          {report.warnings.length > 0 && <p className="upload-note"><b>Advertencias:</b> {report.warnings.map((warning) => `${warning.cell}: ${warning.message}`).join(' ')}</p>}
          {!report.errors.length && <button className="primary upload-confirm" onClick={handleUpload} disabled={loading}>{loading ? 'Importando...' : `Importar ${report.total.toLocaleString('es-MX')} registros`}</button>}
        </div>
      )}

      {success && <div className="upload-success"><Check size={20} /><span>{success}</span></div>}
    </section>
  );
}
