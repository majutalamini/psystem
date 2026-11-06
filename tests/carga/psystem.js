// Etapa 3: carga com 4 usuários (2 min) e estresse curto com 8 (30 s) contra o laboratório sintético
// (psystem_diagnostic, 1.000 pacientes, porta 8001). Somente leituras: as gravações foram medidas na etapa 1.
// Uso: sh scripts/carga.sh
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// Tempo medido dentro do Laravel (Server-Timing do laboratório), para separar PHP de rede/fila.
const phpApp = new Trend('php_app_ms');
const phpSql = new Trend('php_sql_ms');
const phpBoot = new Trend('php_bootstrap_ms');
const DIAGNOSTICO = { 'X-Psystem-Diagnostics': '1' };

const BASE = __ENV.BASE_URL || 'http://127.0.0.1:8001';
const SENHA = 'diagnostico-local'; // operadores sintéticos do DiagnosticoSeeder

export const options = {
  noCookiesReset: true, // cada usuário mantém a sessão entre as voltas, como no navegador
  scenarios: {
    carga: { executor: 'constant-vus', vus: 4, duration: '2m', tags: { cenario: 'carga' } },
    estresse: { executor: 'constant-vus', vus: 8, duration: '30s', startTime: '2m10s', tags: { cenario: 'estresse' } },
  },
  thresholds: {
    'http_req_duration{cenario:carga,tipo:leitura}': ['p(95)<500'],
    'http_req_duration{cenario:carga,tipo:relatorio}': ['p(95)<2000'],
    'http_req_failed{cenario:carga}': ['rate<0.01'],
    'checks{cenario:carga}': ['rate>0.99'],
    // Só para o resumo mostrar cada tela separadamente (limite alto, não reprova).
    ...Object.fromEntries(['dashboard', 'agenda-semana', 'agenda-mes', 'pacientes', 'pacientes-busca', 'perfil', 'financeiro', 'relatorios']
      .flatMap((tela) => [[`http_req_duration{cenario:carga,tela:${tela}}`, ['p(95)<60000']], [`http_req_duration{cenario:estresse,tela:${tela}}`, ['p(95)<60000']]])),
  },
  summaryTrendStats: ['med', 'p(95)', 'max', 'count'],
};

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function entrar(numero) {
  const jar = http.cookieJar();
  http.get(`${BASE}/login`, { tags: { tipo: 'login' } });
  const xsrf = decodeURIComponent((jar.cookiesForURL(BASE)['XSRF-TOKEN'] || [''])[0]);
  const resposta = http.post(`${BASE}/login`, { email: `operador${numero}@diagnostico.invalid`, password: SENHA },
    { headers: { 'X-XSRF-TOKEN': xsrf }, tags: { tipo: 'login' } });
  check(resposta, { 'login entrou': (r) => r.status === 200 && !r.url.includes('/login') });
}

let logado = false;
let ids = [];

export default function () {
  if (!logado) {
    entrar(((__VU - 1) % 4) + 1);
    const opcoes = http.get(`${BASE}/pacientes/opcoes?page=1`, { tags: { tipo: 'leitura', tela: 'opcoes' } });
    ids = (opcoes.json('items') || []).map((p) => p.id);
    logado = true;
  }
  const leitura = (tela, url) => {
    const tags = { tipo: tela === 'relatorios' ? 'relatorio' : 'leitura', tela };
    const r = http.get(`${BASE}${url}`, { tags, headers: DIAGNOSTICO });
    check(r, { [`${tela} 200`]: (x) => x.status === 200 && !x.url.includes('/login') });
    const timing = r.headers['Server-Timing'] || '';
    const dur = (nome) => Number((timing.match(new RegExp(`${nome};dur=([0-9.]+)`)) || [])[1]);
    if (timing) {
      phpApp.add(dur('app'), tags);
      phpSql.add(dur('sql'), tags);
      phpBoot.add(dur('bootstrap'), tags);
    }
  };

  group('navegação', () => {
    leitura('dashboard', '/');
    leitura('agenda-semana', `/agenda?data=${hoje()}&visao=semana`);
    leitura('agenda-mes', `/agenda?data=${hoje()}&visao=mes&grade=1`);
    leitura('pacientes', '/pacientes');
    leitura('pacientes-busca', '/pacientes?q=Silva');
    if (ids.length) leitura('perfil', `/pacientes/${ids[Math.floor(Math.random() * ids.length)]}`);
    leitura('financeiro', '/financeiro');
    leitura('relatorios', '/relatorios');
  });
  sleep(1);
}
