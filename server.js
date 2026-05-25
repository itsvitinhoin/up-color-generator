import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    const name = key.trim();
    if (!name || process.env[name]) continue;
    let value = valueParts.join('=').trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[name] = value;
  }
}

loadEnvFile();

const app = express();
const PORT = process.env.PORT || 3010;

app.use(express.json({ limit: '8mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const DEFAULTS = {
  baseUrl: 'https://api.upzero.com.br',
  attributesPath: '/external/v1/attributes',
  attributeName: 'Cor',
  openaiModel: 'gpt-5.4-nano',
  applyConcurrency: Number(process.env.APPLY_CONCURRENCY || 4),
};

const BASE_MAP = {
  preto:'#000000', branco:'#FFFFFF', bege:'#D8C3A5', nude:'#D2B48C', areia:'#CDB79E', cru:'#E8DDC8',
  creme:'#F5E6CC', camel:'#C19A6B', caramelo:'#B87333', cappuccino:'#A67B5B', coffee:'#6F4E37',
  cocoa:'#6D4C41', chocolate:'#5D4037', mocha:'#7B5E57', bronze:'#B08D57', cobre:'#B87333',
  marrom:'#6F4E37', grafite:'#4B4B4D', cinza:'#808080', azul:'#2F5D9F', navy:'#1F2A44',
  sky:'#87CEEB', turquesa:'#40E0D0', tiffany:'#81D8D0', teal:'#0F766E', ciano:'#00B7C2',
  oceano:'#2C7DA0', piscina:'#56CFE1', royal:'#4169E1', roxo:'#6F42C1', lilas:'#C8A2C8',
  lavender:'#B497BD', mauve:'#A67FA5', orchid:'#DA70D6', magenta:'#D63384', fucsia:'#E91E63',
  rosa:'#E8A3B5', pink:'#E8A3B5', coral:'#F88379', peach:'#F4A68C', salmao:'#FA8072',
  goiaba:'#D97B7B', rose:'#B76E79', rubi:'#9B111E', vermelho:'#C62828', vinho:'#722F37',
  bordo:'#800020', borgonha:'#800020', burgundy:'#800020', plum:'#8E4585', uva:'#6F2DA8',
  tomate:'#D1493F', terracota:'#C96A4A', telha:'#B85C38', tijolo:'#A14A2A', laranja:'#F57C00',
  orange:'#F57C00', cenoura:'#E67E22', mostarda:'#C99700', ocre:'#B86B00', amarelo:'#F4C430',
  lemon:'#F6E27F', limao:'#BFD200', lima:'#B8D430', olive:'#708238', oliva:'#708238',
  verde:'#3E8E41', green:'#3E8E41', musgo:'#6B7D3A', militar:'#5A6B3C', sage:'#9CAF88',
  menta:'#98D8C8', mint:'#98D8C8', jade:'#5E9C8A', esmeralda:'#0E8A4C', floresta:'#355E3B',
  forest:'#355E3B', petroleo:'#2F5E62', aqua:'#72D6C9', aspargo:'#7BA05B', matcha:'#9CAB6B'
};

const SPECIALS = {
  'cloud dancer':'#F3EEE7','irish cream':'#C7A17A','brazilian sand':'#CBB89D','brown stone':'#8A6E5A',
  'bottle green':'#006A4E','cashmere rose':'#C9A3A8','celadon green':'#A8C3A0','celtic blue':'#3B6F8F',
  'cloud cream':'#F4EEE4','coffee liqueur':'#6A4A3C','cotton blue':'#A7C7E7','cream tan':'#D8B89C',
  'dark bark':'#4E3629','dark blackberry':'#4B2E39','deep burgundy':'#5C1F2D','deep grass green':'#355E3B',
  'deep mahogany':'#5B3A29','dusty orange':'#CC7A45','dusty rose':'#C08081','fairest jade':'#BFD8C0',
  'flame orange':'#E25822','golden olive':'#8D8B55','green lime mist':'#C7D36F','green moss':'#758E4F',
  'light cool gray':'#C8C8C8','light poseidon':'#7BA7BC','light taupe':'#B69D8B','living coral':'#FA7268',
  'mint julep':'#DDE7C7','misty jade':'#B7C9B7','mocha bisque':'#B79A84','mocha mousse':'#8B6E5D',
  'mountain spring':'#A3B18A','muted cappuccino':'#A4896A','nuthatch brown':'#8B6B4A','old rose':'#C08081',
  'orchid ice':'#E0C7E8','pale rosette':'#E7C6CF','pink lemonade':'#F7B6C2','pink sand':'#D8B7A6',
  'prairie sand':'#D2BEA3','rainy day':'#9E9E97','red velvet':'#9B1B30','rose bisque':'#E8C7BF',
  'sage green':'#9CAF88','sand dollar':'#DECBA4','sandshell':'#D8C0A8','sea pink':'#E6A8B4',
  'shifting sand':'#CDB9A2','sky blue':'#87CEEB','summer green':'#8FB996','summer sand':'#D8C3A5',
  'taffy pink':'#F3A6C8','taos taupe':'#8B7765','taupe gray':'#8B7D73','tawny birch':'#B8926A',
  'toasted almond':'#D2B48C','twilight mauve':'#8F6A7C','vanilla custard':'#F3E0A6','vibrant green':'#00A651',
  'warm gray':'#A89F91','warm taupe':'#8B6F5C','winter moss':'#7A8450','aurora pink':'#E6A1B0',
  'blue glow':'#5DADE2','butter milk':'#F8EDC9','canyon rose':'#C97B7D','coconut milk':'#F5F0E8',
  'desert sage':'#A3A88A','duck green':'#4F6D5A','english rose':'#C97B84','forest green':'#355E3B',
  'ginger bread':'#8A5A3C','green flash':'#2ECC71','ice green':'#CDEFE6','milky blue':'#BFD7EA',
  'pale mauve':'#D7B5C7','peach nougat':'#E9B79C','pink marshmallow':'#F6C6D3','purple sage':'#9B8AA3',
  'rose gold':'#B76E79','rosewood':'#8A5A62','ruby wine':'#7A2330','soft mint':'#D4E9D7',
  'spring crocus':'#B39BC8','sunkist coral':'#F58F7C','terra cota':'#C96A4A','ultra violeta':'#6C2DC7',
  'dark navy':'#1F2A44'
};

function stripAccents(s){ return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function normalizeName(s){ return stripAccents(s).toLowerCase().replace(/\s+/g,' ').trim(); }
function normalizeCode(s){ return String(s||'').trim().toLowerCase(); }
function hexToRgb(hex){ const h=String(hex).replace('#',''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
function rgbToHex(rgb){ return '#' + rgb.map(v => Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('').toUpperCase(); }
function rgbToHsl(r,g,b){ r/=255;g/=255;b/=255; const max=Math.max(r,g,b), min=Math.min(r,g,b); let h,s; const l=(max+min)/2; if(max===min){h=s=0;} else { const d=max-min; s=l>0.5? d/(2-max-min): d/(max+min); switch(max){ case r:h=(g-b)/d+(g<b?6:0); break; case g:h=(b-r)/d+2; break; default:h=(r-g)/d+4; } h/=6;} return [h,s,l]; }
function hue2rgb(p,q,t){ if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; }
function hslToRgb(h,s,l){ let r,g,b; if(s===0){r=g=b=l;} else { const q=l<0.5? l*(1+s): l+s-l*s; const p=2*l-q; r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3);} return [r*255,g*255,b*255]; }
function adjust(hexColor,{lighten=0,darken=0,satMult=1}){ const [r,g,b]=hexToRgb(hexColor); let [h,s,l]=rgbToHsl(r,g,b); if(lighten) l=l+(1-l)*lighten; if(darken) l=l*(1-darken); s=Math.max(0,Math.min(1,s*satMult)); return rgbToHex(hslToRgb(h,s,l)); }
function findBase(norm){ const keys=Object.keys(BASE_MAP).filter(k=>norm.includes(k)); if(!keys.length) return '#BEBEBE'; keys.sort((a,b)=>b.length-a.length); return BASE_MAP[keys[0]]; }
function inferHex(name){ const norm=normalizeName(String(name).replace(/-/g,' ')); if(SPECIALS[norm]) return SPECIALS[norm]; let base=findBase(norm); if(norm.includes('neon')) base=adjust(base,{lighten:0.08,satMult:1.25}); if(norm.includes('claro')) base=adjust(base,{lighten:0.22,satMult:0.95}); if(norm.includes('escuro')) base=adjust(base,{darken:0.22}); if(norm.includes('desbotad')||norm.includes('palido')) base=adjust(base,{lighten:0.15,satMult:0.72}); if(norm.includes('brilhante')||norm.includes('vibrant')) base=adjust(base,{lighten:0.05,satMult:1.15}); if(norm.includes('queimad')||norm.includes('burnt')||norm.includes('rust')) base=adjust(base,{darken:0.10,satMult:0.90}); return base; }
function normalizeListPayload(payload){ if(Array.isArray(payload)) return payload; if(payload&&typeof payload==='object'){ if(Array.isArray(payload.data)) return payload.data; if(Array.isArray(payload.items)) return payload.items; if(Array.isArray(payload.results)) return payload.results; } return []; }
function authHeaders(apiKey){ return { 'Accept':'application/json','Content-Type':'application/json','X-API-Key':apiKey }; }
function openaiHeaders(apiKey){ return { 'Accept':'application/json','Content-Type':'application/json','Authorization':`Bearer ${apiKey}` }; }
function getConfiguredOpenaiApiKey(){ return String(process.env.OPENAI_API_KEY || '').trim(); }
function isValidHex(value){ return /^#[0-9A-F]{6}$/i.test(String(value || '').trim()); }
function normalizeHex(value){ const raw = String(value || '').trim().toUpperCase(); const withHash = raw.startsWith('#') ? raw : `#${raw}`; return isValidHex(withHash) ? withHash : ''; }

async function fetchJson(url, options={}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text || null; }
  if (!response.ok) {
    const message = data === null ? 'null' : (typeof data === 'string' ? data : JSON.stringify(data));
    throw new Error(`HTTP ${response.status}: ${message}`);
  }
  return data;
}

function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }

function shouldRetryFetchError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return (
    message.includes('fetch failed') ||
    message.includes('socket') ||
    message.includes('timeout') ||
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('http 408') ||
    message.includes('http 425') ||
    message.includes('http 429') ||
    message.includes('http 500') ||
    message.includes('http 502') ||
    message.includes('http 503') ||
    message.includes('http 504')
  );
}

async function fetchJsonWithRetry(url, options={}, retryOptions={}) {
  const retries = Number(retryOptions.retries ?? 4);
  const baseDelayMs = Number(retryOptions.baseDelayMs ?? 350);
  const timeoutMs = Number(retryOptions.timeoutMs ?? 25000);
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const data = await fetchJson(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      return { data, attempts: attempt + 1 };
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt >= retries || !shouldRetryFetchError(error)) break;
      const jitter = Math.floor(Math.random() * 150);
      await sleep(baseDelayMs * (2 ** attempt) + jitter);
    }
  }

  throw lastError;
}

function extractResponseText(data) {
  if (typeof data?.output_text === 'string') return data.output_text;
  const chunks = [];
  for (const output of data?.output || []) {
    for (const content of output?.content || []) {
      if (typeof content?.text === 'string') chunks.push(content.text);
    }
  }
  return chunks.join('');
}

function findAttribute(attributes, attributeName) {
  return attributes.find(attr => String(attr?.name || '').trim().toLowerCase() === String(attributeName).trim().toLowerCase());
}

function buildVerificationMap(terms){
  const byId = new Map(), byCode = new Map(), byName = new Map();
  for (const term of terms) {
    byId.set(String(term.id), term);
    const c = normalizeCode(term.code); if (c && !byCode.has(c)) byCode.set(c, term);
    const n = normalizeName(term.name); if (n && !byName.has(n)) byName.set(n, term);
  }
  return { byId, byCode, byName };
}

function verifyItem(item, map){
  const sent = String(item.selected_rgb || '').toUpperCase();
  const byId = map.byId.get(String(item.id));
  const byCode = normalizeCode(item.code) ? map.byCode.get(normalizeCode(item.code)) : null;
  const byName = normalizeName(item.name) ? map.byName.get(normalizeName(item.name)) : null;
  const candidates = [byId, byCode, byName].filter(Boolean);
  if (!candidates.length) return { ok:false, status:'missing_after_refetch', persisted_rgb:'', match_strategy:'none', message:'O term não foi encontrado no GET após o POST.' };
  for (const candidate of candidates) {
    const persisted = String(candidate.rgb || '').toUpperCase();
    if (persisted === sent) {
      const strategy = candidate===byId ? 'id' : candidate===byCode ? 'code' : 'name';
      return { ok:true, status:'confirmed', persisted_rgb:persisted, match_strategy:strategy, message:`Persistido com sucesso. Confirmação por ${strategy}.` };
    }
  }
  const first = candidates[0];
  const persisted = String(first.rgb || '').toUpperCase();
  return { ok:false, status:'not_persisted', persisted_rgb:persisted, match_strategy: byId ? 'id' : byCode ? 'code' : 'name', message: persisted ? `O term foi encontrado após o POST, mas o RGB persistido (${persisted}) não bate com o enviado (${sent}).` : 'O term foi encontrado após o POST, mas o RGB continua vazio.' };
}

function buildTermRequest(item) {
  const rgb = String(item.selected_rgb || '').trim().toUpperCase();
  return { code:String(item.code ?? ''), name:String(item.name ?? ''), sort_order:Number(item.sort_order ?? 0), rgb, meta:{ rgb } };
}

function buildTermRequestVariants(item) {
  const rgb = String(item.selected_rgb || '').trim().toUpperCase();
  const code = String(item.code ?? '');
  const name = String(item.name ?? '');
  const sort_order = Number(item.sort_order ?? 0);
  return [
    { label:'rgb_meta', body:{ code, name, sort_order, rgb, meta:{ rgb } } },
    { label:'rgb_only', body:{ code, name, sort_order, rgb } },
    { label:'minimal_rgb', body:{ code, name, rgb } },
  ];
}

function writeDebugFile(filename, data) {
  const outDir = process.env.VERCEL ? path.join('/tmp', 'up-color-generator-debug') : path.join(__dirname, 'debug');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return filePath;
}

function readDebugFile(filename) {
  const safeName = path.basename(String(filename || ''));
  const outDir = process.env.VERCEL ? path.join('/tmp', 'up-color-generator-debug') : path.join(__dirname, 'debug');
  const filePath = path.join(outDir, safeName);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let index = 0;
  const count = Math.max(1, Number(concurrency || 1));
  await Promise.all(Array.from({ length: count }, async () => {
    while (index < items.length) {
      const current = index++;
      results[current] = await worker(items[current], current);
    }
  }));
  return results;
}

function chunkItems(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

async function postTermWithFallbacks(request, apiKey) {
  let lastError = null;
  const variants = buildTermRequestVariants(request.item);

  for (const variant of variants) {
    try {
      const result = await fetchJsonWithRetry(
        request.url,
        { method:'POST', headers: authHeaders(apiKey), body: JSON.stringify(variant.body) },
        { retries: variant.label === 'rgb_meta' ? 3 : 0, timeoutMs:25000 }
      );
      return { id:request.id, ok:true, attempts:result.attempts, payload_variant:variant.label, response:result.data };
    } catch (error) {
      lastError = error;
      const message = String(error?.message || error);
      if (!message.includes('HTTP 409')) break;
    }
  }

  return {
    id:request.id,
    ok:false,
    attempts:variants.length,
    error:lastError instanceof Error ? lastError.message : 'Falha ao atualizar termo.',
  };
}

function buildAiSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      colors: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: { type: 'string' },
            hex: { type: 'string' },
            confidence: { type: 'number' },
            rationale: { type: 'string' },
          },
          required: ['id', 'hex', 'confidence', 'rationale'],
        },
      },
    },
    required: ['colors'],
  };
}

async function inferHexWithAi(items, { openaiApiKey, openaiModel=DEFAULTS.openaiModel }) {
  const apiKey = String(openaiApiKey || getConfiguredOpenaiApiKey()).trim();
  if (!apiKey) throw new Error('OpenAI API Key é obrigatória para gerar HEX com IA.');
  const results = new Map();

  for (const batch of chunkItems(items, 80)) {
    const response = await fetchJson('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: openaiHeaders(apiKey),
      body: JSON.stringify({
        model: openaiModel || DEFAULTS.openaiModel,
        input: [
          {
            role: 'system',
            content: [
              'Você é um especialista em catálogos de e-commerce, nomes comerciais de cores, Pantone-like naming e HEX RGB.',
              'Gere um HEX #RRGGBB representativo para cada cor de produto.',
              'Use o nome e o código da cor. Preserve tons comerciais conhecidos em inglês e português.',
              'Evite cinza genérico para cores desconhecidas: faça a melhor inferência plausível.',
              'Retorne somente dados válidos no schema solicitado.',
            ].join(' '),
          },
          {
            role: 'user',
            content: JSON.stringify({
              task: 'Gerar HEX para cores de variantes de e-commerce.',
              colors: batch.map(item => ({
                id: String(item.id),
                code: String(item.code || ''),
                name: String(item.name || ''),
                heuristic_hex: String(item.selected_rgb || item.suggested_rgb || ''),
              })),
            }),
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'color_hex_batch',
            strict: true,
            schema: buildAiSchema(),
          },
        },
      }),
    });

    let parsed;
    try { parsed = JSON.parse(extractResponseText(response)); }
    catch { throw new Error('A OpenAI retornou uma resposta que não pôde ser lida como JSON.'); }

    for (const color of parsed.colors || []) {
      const hex = normalizeHex(color.hex);
      if (!hex) continue;
      results.set(String(color.id), {
        id: String(color.id),
        hex,
        confidence: Number(color.confidence ?? 0),
        rationale: String(color.rationale || ''),
      });
    }
  }

  return results;
}

function applyAiSuggestions(items, suggestions) {
  return items.map(item => {
    const suggestion = suggestions.get(String(item.id));
    if (!suggestion) return item;
    return {
      ...item,
      heuristic_rgb: item.heuristic_rgb || item.suggested_rgb,
      suggested_rgb: suggestion.hex,
      selected_rgb: suggestion.hex,
      suggested_source: 'IA',
      ai_confidence: suggestion.confidence,
      ai_rationale: suggestion.rationale,
      message: suggestion.rationale ? `IA: ${suggestion.rationale}` : item.message,
    };
  });
}

app.get('/api/health', (_,res) => res.json({ ok:true }));
app.get('/api/config', (_,res) => res.json({ ok:true, openai:{ configured:Boolean(getConfiguredOpenaiApiKey()), model:DEFAULTS.openaiModel } }));
app.get('/api/debug/:filename', (req,res) => {
  try {
    const data = readDebugFile(req.params.filename);
    if (!data) return res.status(404).json({ error:'Arquivo de debug não encontrado nesta instância.' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erro ao ler debug.' });
  }
});

app.post('/api/scan', async (req,res) => {
  try {
    const { apiKey, baseUrl=DEFAULTS.baseUrl, attributesPath=DEFAULTS.attributesPath, attributeName=DEFAULTS.attributeName, useAiSuggestions=false, openaiApiKey='', openaiModel=DEFAULTS.openaiModel } = req.body || {};
    if (!apiKey?.trim()) return res.status(400).json({ error:'API Key é obrigatória.' });

    const url = `${String(baseUrl).replace(/\/+$/, '')}${attributesPath}`;
    const raw = await fetchJson(url, { method:'GET', headers: authHeaders(apiKey.trim()) });
    const attributes = normalizeListPayload(raw);
    const target = findAttribute(attributes, attributeName);
    if (!target) return res.status(404).json({ error:`Atributo "${attributeName}" não encontrado.` });

    const terms = Array.isArray(target.terms) ? target.terms : [];
    const missing = terms.filter(term => !term?.rgb || !String(term.rgb).trim()).map(term => {
      const suggested = inferHex(term.name);
      return {
        id: String(term.id),
        attribute_id: String(term.attribute_id ?? ''),
        code: String(term.code ?? ''),
        name: String(term.name ?? ''),
        sort_order: Number(term.sort_order ?? 0),
        current_rgb: String(term.rgb ?? ''),
        suggested_rgb: suggested,
        selected_rgb: suggested,
        heuristic_rgb: suggested,
        suggested_source:'Heurística',
        ai_confidence:null,
        ai_rationale:'',
        status:'pending',
        message:'',
        selected:true,
        persisted_rgb:'',
        match_strategy:''
      };
    });

    const finalMissing = useAiSuggestions
      ? applyAiSuggestions(missing, await inferHexWithAi(missing, { openaiApiKey, openaiModel }))
      : missing;

    res.json({
      ok:true,
      attribute:{ id:String(target.id), name:String(target.name ?? ''), code:String(target.code ?? ''), sort_order:Number(target.sort_order ?? 0), total_terms:terms.length, missing_terms:finalMissing.length },
      items: finalMissing
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erro ao mapear.' });
  }
});

app.post('/api/ai-suggest', async (req,res) => {
  try {
    const { openaiApiKey='', openaiModel=DEFAULTS.openaiModel, items=[] } = req.body || {};
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error:'Nenhum item para gerar com IA.' });
    const suggestions = await inferHexWithAi(items, { openaiApiKey, openaiModel });
    res.json({ ok:true, model: openaiModel || DEFAULTS.openaiModel, summary:{ total:items.length, suggested:suggestions.size }, items: applyAiSuggestions(items, suggestions) });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erro ao gerar HEX com IA.' });
  }
});

app.post('/api/apply', async (req,res) => {
  try {
    const { apiKey, baseUrl=DEFAULTS.baseUrl, attributesPath=DEFAULTS.attributesPath, attributeName=DEFAULTS.attributeName, attribute, items=[] } = req.body || {};
    if (!apiKey?.trim()) return res.status(400).json({ error:'API Key é obrigatória.' });
    if (!attribute?.id) return res.status(400).json({ error:'Atributo inválido.' });
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error:'Nenhum item para enviar.' });

    const base = String(baseUrl).replace(/\/+$/, '');
    const attributeUrl = `${base}${attributesPath}`;
    const selectedItems = items.filter(item => item.selected !== false);
    const termUrl = `${attributeUrl}/${encodeURIComponent(String(attribute.id))}/terms`;
    const requests = selectedItems.map(item => ({ id:String(item.id), name:String(item.name || ''), code:String(item.code || ''), url:termUrl, item, body:buildTermRequest(item) }));

    const payloadFile = writeDebugFile('last-payload.json', { mode:'term_upsert', attribute_id:String(attribute.id), requests });

    const postResults = await mapWithConcurrency(requests, DEFAULTS.applyConcurrency, async (request) => {
      if (!isValidHex(request.body.rgb)) {
        return { id:request.id, ok:false, attempts:0, error:`HEX inválido: ${request.body.rgb || '(vazio)'}` };
      }
      return postTermWithFallbacks(request, apiKey.trim());
    });
    const responseFile = writeDebugFile('last-post-response.json', postResults);

    const postResultMap = new Map(postResults.map(result => [String(result.id), result]));
    const selectedById = new Map(selectedItems.map(item => [String(item.id), item]));
    let verificationMap = buildVerificationMap([]);
    let results = [];

    for (let validationAttempt = 0; validationAttempt < 4; validationAttempt++) {
      if (validationAttempt > 0) await sleep(900 * validationAttempt);
      const afterResult = await fetchJsonWithRetry(termUrl, { method:'GET', headers: authHeaders(apiKey.trim()) }, { retries:3, timeoutMs:25000 });
      verificationMap = buildVerificationMap(normalizeListPayload(afterResult.data));

      results = selectedItems.map(item => {
        const postResult = postResultMap.get(String(item.id));
        const verification = verifyItem(item, verificationMap);
        if (verification.ok) {
          return { id:String(item.id), name:String(item.name || ''), code:String(item.code || ''), sent_rgb:String(item.selected_rgb || '').toUpperCase(), persisted_rgb:verification.persisted_rgb, match_strategy:verification.match_strategy, ok:true, status:verification.status, message: postResult?.ok === false ? `Persistido apesar de erro no retorno do POST: ${postResult.error}` : verification.message };
        }
        if (postResult && !postResult.ok) {
          return { id:String(item.id), name:String(item.name || ''), code:String(item.code || ''), sent_rgb:String(item.selected_rgb || '').toUpperCase(), persisted_rgb:verification.persisted_rgb || '', match_strategy:verification.match_strategy || 'none', ok:false, status:'fail', message:`Falha no POST do termo id=${String(item.id)} code=${String(item.code || '')}: ${postResult.error}` };
        }
        return { id:String(item.id), name:String(item.name || ''), code:String(item.code || ''), sent_rgb:String(item.selected_rgb || '').toUpperCase(), persisted_rgb:verification.persisted_rgb, match_strategy:verification.match_strategy, ok:false, status:verification.status, message:verification.message };
      });

      if (results.every(result => result.ok)) break;
    }

    const recoverableItems = results
      .filter(result => !result.ok)
      .map(result => selectedById.get(String(result.id)))
      .filter(Boolean);

    if (recoverableItems.length) {
      const retryRequests = recoverableItems.map(item => ({ id:String(item.id), name:String(item.name || ''), code:String(item.code || ''), url:termUrl, item, body:buildTermRequest(item) }));
      const retryPostResults = await mapWithConcurrency(retryRequests, 2, async (request) => {
        const result = await postTermWithFallbacks(request, apiKey.trim());
        return { ...result, retry:true };
      });
      for (const result of retryPostResults) postResultMap.set(String(result.id), result);

      await sleep(1500);
      const afterRetry = await fetchJsonWithRetry(termUrl, { method:'GET', headers: authHeaders(apiKey.trim()) }, { retries:3, timeoutMs:25000 });
      verificationMap = buildVerificationMap(normalizeListPayload(afterRetry.data));
      results = selectedItems.map(item => {
        const postResult = postResultMap.get(String(item.id));
        const verification = verifyItem(item, verificationMap);
        if (verification.ok) {
          return { id:String(item.id), name:String(item.name || ''), code:String(item.code || ''), sent_rgb:String(item.selected_rgb || '').toUpperCase(), persisted_rgb:verification.persisted_rgb, match_strategy:verification.match_strategy, ok:true, status:verification.status, message: postResult?.retry ? `Persistido com sucesso após retry. Confirmação por ${verification.match_strategy}.` : verification.message };
        }
        if (postResult && !postResult.ok) {
          return { id:String(item.id), name:String(item.name || ''), code:String(item.code || ''), sent_rgb:String(item.selected_rgb || '').toUpperCase(), persisted_rgb:verification.persisted_rgb || '', match_strategy:verification.match_strategy || 'none', ok:false, status:'fail', message:`Falha no POST do termo id=${String(item.id)} code=${String(item.code || '')}: ${postResult.error}` };
        }
        return { id:String(item.id), name:String(item.name || ''), code:String(item.code || ''), sent_rgb:String(item.selected_rgb || '').toUpperCase(), persisted_rgb:verification.persisted_rgb, match_strategy:verification.match_strategy, ok:false, status:verification.status, message:verification.message };
      });
    }

    const success = results.filter(r => r.ok).length;
    const failed = results.length - success;
    const reportFile = writeDebugFile('last-validation-report.json', {
      summary:{ total:results.length, success, failed, post_failed:postResults.filter(result => !result.ok).length, concurrency:DEFAULTS.applyConcurrency },
      failed_results: results.filter(result => !result.ok),
      results
    });

    res.json({ ok: failed === 0, summary:{ total:results.length, success, failed }, results, mode:'term_upsert_retry', debug_files:{ payload:payloadFile, post_response:responseFile, validation_report:reportFile, validation_report_url:'/api/debug/last-validation-report.json', post_response_url:'/api/debug/last-post-response.json' } });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erro ao aplicar atualizações.' });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`UP Zero Color UI v4 disponível em http://localhost:${PORT}`);
  });
}

export default app;
