'use strict';

// Pokédex de Cartas — app estático, sem servidor e sem dependências.
// Fonte da coleção: data/colecao.json (cartas reais do fichário).
// Alterações feitas no telemóvel ficam no localStorage deste dispositivo.

const CHAVE = 'pokedex-cartas:v1';
const SPRITE = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const GERACOES = [
  [1, 151], [152, 251], [252, 386], [387, 493], [494, 649],
  [650, 721], [722, 809], [810, 905], [906, 1025]
];
const MAX_POR_POKEMON = 999;

const $ = sel => document.querySelector(sel);
const estado = { pokemon: [], cartasPorId: new Map(), base: {}, local: {}, filtro: 'todos', geracao: 0, texto: '', tiles: new Map(), aberto: null };

function lerLocal() {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE) || '{}');
    return limparQuantidades(bruto);
  } catch { return {}; }
}
function gravarLocal() {
  try { localStorage.setItem(CHAVE, JSON.stringify(estado.local)); } catch { /* sem armazenamento: segue só em memória */ }
}
// Aceita apenas { "id": inteiro } com ids válidos — nada mais entra no estado.
function limparQuantidades(obj) {
  const out = {};
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return out;
  for (const [k, v] of Object.entries(obj)) {
    const id = Number(k), n = Number(v);
    if (Number.isInteger(id) && id >= 1 && id <= 1025 && Number.isInteger(n) && n >= 0 && n <= MAX_POR_POKEMON) out[id] = n;
  }
  return out;
}

const qtd = id => (id in estado.local ? estado.local[id] : (estado.base[id] || 0));
const geracaoDe = id => GERACOES.findIndex(([a, b]) => id >= a && id <= b) + 1;
const numero = id => '#' + String(id).padStart(4, '0');
const normalizar = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

async function iniciar() {
  const [pokemon, colecao] = await Promise.all([
    fetch('data/pokemon.json').then(r => r.json()),
    fetch('data/colecao.json').then(r => r.json())
  ]);
  estado.pokemon = pokemon;
  for (const c of colecao.cartas) {
    estado.base[c.pokemon] = (estado.base[c.pokemon] || 0) + 1;
    if (!estado.cartasPorId.has(c.pokemon)) estado.cartasPorId.set(c.pokemon, []);
    estado.cartasPorId.get(c.pokemon).push(c);
  }
  estado.local = lerLocal();

  const sel = $('#geracao');
  GERACOES.forEach(([a, b], i) => {
    const o = document.createElement('option');
    o.value = String(i + 1);
    o.textContent = `Geração ${i + 1} (${a}–${b})`;
    sel.append(o);
  });

  construirGrelha();
  ligarEventos();
  atualizar();
}

function construirGrelha() {
  const frag = document.createDocumentFragment();
  for (const p of estado.pokemon) {
    const b = document.createElement('button');
    b.className = 'poke';
    b.type = 'button';
    b.dataset.id = p.id;
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = p.en;
    img.width = 80; img.height = 80;
    img.src = SPRITE(p.id);
    const n = document.createElement('div'); n.className = 'n'; n.textContent = numero(p.id);
    const nome = document.createElement('div'); nome.className = 'nome'; nome.textContent = p.en;
    const badge = document.createElement('span'); badge.className = 'qtd'; badge.hidden = true;
    b.append(badge, img, n, nome);
    frag.append(b);
    estado.tiles.set(p.id, { b, badge, chave: normalizar(`${p.en} ${p.ja} ${p.id}`) });
  }
  $('#grelha').append(frag);
}

function atualizar() {
  let tenho = 0, cartas = 0, visiveis = 0;
  const t = normalizar(estado.texto.trim());
  for (const p of estado.pokemon) {
    const q = qtd(p.id);
    if (q > 0) { tenho++; cartas += q; }
    const tile = estado.tiles.get(p.id);
    tile.b.classList.toggle('tem', q > 0);
    tile.b.classList.toggle('falta', q === 0);
    tile.badge.hidden = q < 2;
    tile.badge.textContent = '×' + q;
    const mostra =
      (estado.filtro === 'todos' || (estado.filtro === 'tenho') === (q > 0)) &&
      (!estado.geracao || geracaoDe(p.id) === estado.geracao) &&
      (!t || tile.chave.includes(t) || String(p.id) === t.replace(/^#?0*/, ''));
    tile.b.hidden = !mostra;
    if (mostra) visiveis++;
  }
  const total = estado.pokemon.length;
  $('#tenho').textContent = tenho;
  $('#total').textContent = total;
  $('#ncartas').textContent = cartas;
  const pct = total ? (tenho / total) * 100 : 0;
  $('#pct').textContent = pct.toFixed(1).replace('.', ',') + '%';
  $('#barra-fill').style.width = pct + '%';
  $('#vazio').hidden = visiveis > 0;
}

function abrir(id) {
  const p = estado.pokemon[id - 1];
  estado.aberto = id;
  $('#d-img').src = SPRITE(id);
  $('#d-img').alt = p.en;
  $('#d-num').textContent = numero(id) + ' · Geração ' + geracaoDe(id);
  $('#d-nome').textContent = p.en;
  $('#d-ja').textContent = p.ja;
  const lista = $('#d-cartas');
  lista.replaceChildren();
  for (const c of estado.cartasPorId.get(id) || []) {
    const li = document.createElement('li');
    const s = document.createElement('strong');
    s.textContent = c.nome;
    li.append(s, ` — ${c.colecao} ${c.numero} (${c.idioma})`);
    lista.append(li);
  }
  atualizarDetalhe();
  $('#detalhe').showModal();
}
function atualizarDetalhe() { $('#d-qtd').textContent = qtd(estado.aberto); }

function mudar(delta) {
  const id = estado.aberto;
  const novo = Math.min(MAX_POR_POKEMON, Math.max(0, qtd(id) + delta));
  if (novo === (estado.base[id] || 0)) delete estado.local[id];
  else estado.local[id] = novo;
  gravarLocal();
  atualizarDetalhe();
  atualizar();
}

function exportar() {
  const quantidades = {};
  for (const p of estado.pokemon) { const q = qtd(p.id); if (q > 0) quantidades[p.id] = q; }
  const blob = new Blob([JSON.stringify({ app: 'pokedex-cartas', versao: 1, data: new Date().toISOString(), quantidades }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'minha-colecao.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importar(ficheiro) {
  if (!ficheiro || ficheiro.size > 200_000) { alert('Ficheiro inválido.'); return; }
  try {
    const dados = JSON.parse(await ficheiro.text());
    const q = limparQuantidades(dados && dados.quantidades);
    const novo = {};
    for (const p of estado.pokemon) {
      const v = q[p.id] || 0;
      if (v !== (estado.base[p.id] || 0)) novo[p.id] = v;
    }
    estado.local = novo;
    gravarLocal();
    atualizar();
  } catch { alert('Não consegui ler esse ficheiro.'); }
}

function ligarEventos() {
  $('#grelha').addEventListener('click', e => {
    const b = e.target.closest('.poke');
    if (b) abrir(Number(b.dataset.id));
  });
  $('#pesquisa').addEventListener('input', e => { estado.texto = e.target.value; atualizar(); });
  $('#geracao').addEventListener('change', e => { estado.geracao = Number(e.target.value); atualizar(); });
  document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.seg button').forEach(x => x.classList.toggle('ativo', x === b));
    estado.filtro = b.dataset.filtro;
    atualizar();
  }));
  $('#d-mais').addEventListener('click', () => mudar(1));
  $('#d-menos').addEventListener('click', () => mudar(-1));
  $('#d-fechar').addEventListener('click', () => $('#detalhe').close());
  $('#detalhe').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
  $('#exportar').addEventListener('click', exportar);
  $('#importar').addEventListener('change', e => { importar(e.target.files[0]); e.target.value = ''; });
  $('#repor').addEventListener('click', () => {
    if (confirm('Apagar as alterações feitas neste dispositivo e voltar à coleção original?')) {
      estado.local = {}; gravarLocal(); atualizar();
    }
  });
}

iniciar().catch(() => { $('#vazio').textContent = 'Erro ao carregar os dados.'; $('#vazio').hidden = false; });
