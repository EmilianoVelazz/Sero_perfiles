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
} from 'lucide-react';
import './styles.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3002/api';
const PAGE_SIZE = 100;

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
  empresa: '',
  flujo: '',
  enfermedad: '',
  laboratorio: '',
  interpretacion: '',
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
      throw new Error(payload.message || 'No se pudo conectar con la API.');
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
        {view === 'powerbi' && <PowerBiPanel reportUrl={powerBiReportUrl} onReportUrlChange={updatePowerBiReportUrl} />}
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
          <iframe title="Reporte Power BI" src={powerBiReportUrl} allowFullScreen />
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
        <FilterSelect label="Empresa" value={filters.empresa} items={filterOptions?.empresas} onChange={(value) => setFilter('empresa', value)} />
        <FilterSelect label="Flujo" value={filters.flujo} items={filterOptions?.flujos} onChange={(value) => setFilter('flujo', value)} />
        <FilterSelect label="Enfermedad" value={filters.enfermedad} items={filterOptions?.enfermedades} onChange={(value) => setFilter('enfermedad', value)} />
        <FilterSelect label="Laboratorio" value={filters.laboratorio} items={filterOptions?.laboratorios} onChange={(value) => setFilter('laboratorio', value)} />
        <FilterSelect label="Interpretación" value={filters.interpretacion} items={filterOptions?.interpretaciones} onChange={(value) => setFilter('interpretacion', value)} />
        <button className="secondary compact" onClick={clearFilters} type="button">
          <Filter size={17} /> Limpiar
        </button>
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
  empresa: 'Empresa',
  flujo: 'Flujo',
  enfermedad: 'Enfermedad',
  laboratorio: 'Laboratorio',
  interpretacion: 'Interpretación',
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

function PowerBiPanel({ reportUrl, onReportUrlChange }) {
  const [draftReportUrl, setDraftReportUrl] = useState(reportUrl);
  const [urlError, setUrlError] = useState('');

  function saveReportUrl() {
    try {
      const url = new URL(draftReportUrl.trim());
      if (url.protocol !== 'https:' || url.hostname !== 'app.powerbi.com') {
        throw new Error('Usa una URL HTTPS del dominio app.powerbi.com.');
      }
      setUrlError('');
      onReportUrlChange(url.toString());
    } catch (error) {
      setUrlError(error.message === 'Invalid URL' ? 'Ingresa una URL válida.' : error.message);
    }
  }

  return (
    <section className="powerbi-only">
      <div className="panel powerbi-control-panel">
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
          Esta pantalla es solo para graficas de Power BI. El enlace debe venir de Power BI Service como reporte embebido o publico.
        </p>
      </div>

      <div className="panel powerbi-report-surface">
        {reportUrl ? (
          <iframe title="Graficas Power BI" src={reportUrl} allowFullScreen />
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
