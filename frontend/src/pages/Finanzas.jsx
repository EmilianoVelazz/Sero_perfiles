import { useEffect } from 'react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { usePageStyles, loadScriptsInOrder } from '../lib/assets.js';
import FINANZAS_HTML from './finanzasMarkup.js';

const CHARTJS = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
const LWC = 'https://unpkg.com/lightweight-charts@4/dist/lightweight-charts.standalone.production.js';
const AOS_JS = 'https://unpkg.com/aos@2.3.1/dist/aos.js';

// La página tradicional incluye su propio header. En React ya se monta Header,
// así que retiramos únicamente esa copia para evitar dos barras superpuestas,
// IDs duplicados y menús móviles compitiendo entre sí.
const FINANZAS_REACT_HTML = FINANZAS_HTML.replace(
  /<header class="header">[\s\S]*?<\/header>\s*<div class="hdr-divider"><\/div>/,
  ''
).replace(
  /<footer class="footer">[\s\S]*?<\/footer>/,
  ''
);

// Finanzas es la terminal más grande (6583 líneas, 9 CSS, 23 scripts inline, Chart.js,
// web components filter-bar/chart-card, AOS). Como Inicio/Mercados: React posee la ruta
// y monta el markup verbatim, reutilizando su lógica probada (js/finanzas-page.js).
export default function Finanzas() {
  usePageStyles([
    '/css/header.css?v=6', '/css/footer.css', '/css/responsive.css',
    'https://unpkg.com/aos@2.3.1/dist/aos.css',
    '/css/immersive.css?v=11', '/css/finanzas.css?v=11', '/css/finanzas-bento.css?v=35',
    '/css/finanzas-glass.css?v=1', '/css/finanzas-hub.css?v=1', '/css/finanzas-mercados-locales.css?v=1',
    '/css/finanzas-mexico-dense.css?v=33', '/css/finanzas-global-dense.css?v=36', '/css/finanzas-bonds-dense.css?v=33',
    '/css/finanzas-responsive-polish.css?v=14',
  ]);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const financeScriptWasLoaded = Boolean(
        document.querySelector('script[data-vn-legacy="/js/finanzas-page.js"]')
      );
      await loadScriptsInOrder([
        '/js/api-keys.js?v=3',
        '/js/data-service.js?v=15',
        CHARTJS,
        LWC,
        '/js/components/filter-bar.js',
        '/js/components/chart-card.js?v=6',
        AOS_JS,
        '/js/flags-widget.js',
        '/js/mailbox.js',
        ['/js/chat-widget.js?v=24', { 'data-mascota': '/Logotipos/mascota-atlas.svg' }],
        '/js/finanzas-page.js?v=15',
      ]);
      if (disposed) return;
      // finanzas-page.js registra 9 listeners DOMContentLoaded (ya disparado en la SPA);
      // lo re-emitimos para que inicialicen sobre el markup ya montado.
      // IMPORTANTE: 5 de esos listeners están en `window` (p.ej. el que trasplanta los
      // paneles a global-dense-wrapper en la sección Mercados). Un Event sin bubbles se
      // queda en `document` y nunca llega a `window`; con { bubbles: true } sube hasta
      // `window` y también los dispara. Sin esto, Mercados/Global quedan vacíos.
      document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true }));
      if (financeScriptWasLoaded && typeof window.vnReinitializeFinanzasCharts === 'function') {
        await window.vnReinitializeFinanzasCharts();
      }
      window.scrollTo(0, 0);
    })();
    return () => { disposed = true; };
  }, []);

  return (
    <>
      <Header />
      <div className="vn-fin-clear" dangerouslySetInnerHTML={{ __html: FINANZAS_REACT_HTML }} />
      <Footer />
    </>
  );
}
