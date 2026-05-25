const state = { items: [], filteredItems: [], summary: null, diagnostics: [], config: { openaiConfigured: false } };
const els = {
  apiKey: document.getElementById('apiKey'),
  baseUrl: document.getElementById('baseUrl'),
  attributesPath: document.getElementById('attributesPath'),
  attributeName: document.getElementById('attributeName'),
  openaiApiKey: document.getElementById('openaiApiKey'),
  openaiModel: document.getElementById('openaiModel'),
  useAiSuggestions: document.getElementById('useAiSuggestions'),
  includeExistingTerms: document.getElementById('includeExistingTerms'),
  scanBtn: document.getElementById('scanBtn'),
  resetBtn: document.getElementById('resetBtn'),
  aiSuggestBtn: document.getElementById('aiSuggestBtn'),
  selectAllBtn: document.getElementById('selectAllBtn'),
  applyBtn: document.getElementById('applyBtn'),
  totalTerms: document.getElementById('totalTerms'),
  missingTerms: document.getElementById('missingTerms'),
  readyTerms: document.getElementById('readyTerms'),
  colorsTableBody: document.getElementById('colorsTableBody'),
  diagnostics: document.getElementById('diagnostics'),
  searchInput: document.getElementById('searchInput'),
};
function escapeHtml(str){ return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'); }
function setLoading(btn, loading, text){ btn.disabled = loading; if(!btn.dataset.defaultText) btn.dataset.defaultText = btn.textContent; btn.textContent = loading ? text : btn.dataset.defaultText; }
function renderStats(){ els.totalTerms.textContent = state.summary?.total_terms ?? '—'; els.missingTerms.textContent = state.summary?.missing_terms ?? '—'; els.readyTerms.textContent = String(state.items.filter(i => i.selected).length || 0); }
function renderDiagnostics(){
  if(!state.diagnostics.length){ els.diagnostics.innerHTML = '<div class="diag-item muted">Nenhuma ação executada ainda.</div>'; return; }
  els.diagnostics.innerHTML = state.diagnostics.map(item => `<div class="diag-item"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><div><strong>${escapeHtml(item.title)}</strong></div><div class="small">${escapeHtml(item.time)}</div></div><div class="status-pill ${item.ok ? 'status-ok' : 'status-fail'}">${item.ok ? 'OK' : 'Falha'}</div></div><div style="margin-top:6px">${escapeHtml(item.message)}</div></div>`).join('');
}
function statusClass(status){ if(status==='confirmed') return 'status-ok'; if(status==='not_persisted' || status==='missing_after_refetch' || status==='fail') return 'status-fail'; return 'status-pending'; }
function statusLabel(status){ if(status==='confirmed') return 'Confirmado'; if(status==='not_persisted') return 'Não persistiu'; if(status==='missing_after_refetch') return 'Sumiu no GET'; if(status==='fail') return 'Falha'; return 'Pendente'; }
function renderTable(){
  const query = els.searchInput.value.trim().toLowerCase();
  state.filteredItems = state.items.filter(item => item.name.toLowerCase().includes(query));
  if(!state.filteredItems.length){ els.colorsTableBody.innerHTML = '<tr><td colspan="10" class="muted">Nenhum item encontrado.</td></tr>'; return; }
  els.colorsTableBody.innerHTML = state.filteredItems.map(item => `<tr>
    <td><input class="check" type="checkbox" ${item.selected ? 'checked' : ''} data-action="toggle" data-id="${item.id}" /></td>
    <td><div class="name">${escapeHtml(item.name)}</div><div class="small mono">ID ${escapeHtml(item.id)} • Code ${escapeHtml(item.code || '—')}</div></td>
    <td><div class="swatch" style="background:${escapeHtml(item.selected_rgb)}"></div></td>
    <td class="mono">${escapeHtml(item.suggested_rgb)}</td>
    <td><div style="display:flex;gap:8px;align-items:center"><input type="color" value="${escapeHtml(item.selected_rgb)}" data-action="color" data-id="${item.id}" /><input class="hex mono" type="text" value="${escapeHtml(item.selected_rgb)}" data-action="hex" data-id="${item.id}" /></div></td>
    <td><span class="source-pill">${escapeHtml(item.suggested_source || 'Heurística')}</span>${item.ai_confidence != null ? `<div class="small">${Math.round(Number(item.ai_confidence) * 100)}% confiança</div>` : ''}</td>
    <td class="mono">${escapeHtml(item.persisted_rgb || '—')}</td>
    <td><span class="status-pill ${statusClass(item.status)}">${statusLabel(item.status)}</span></td>
    <td class="small mono">${escapeHtml(item.match_strategy || '—')}</td>
    <td class="small">${escapeHtml(item.message || '—')}</td>
  </tr>`).join('');
  els.selectAllBtn.disabled = state.items.length === 0;
  els.aiSuggestBtn.disabled = state.items.length === 0;
  els.applyBtn.disabled = state.items.filter(i => i.selected).length === 0;
  renderStats();
}
function resetAll(){ state.items=[]; state.filteredItems=[]; state.summary=null; state.diagnostics=[]; els.searchInput.value=''; renderDiagnostics(); renderTable(); renderStats(); els.applyBtn.disabled=true; els.selectAllBtn.disabled=true; els.aiSuggestBtn.disabled=true; }

function hasOpenaiKey(){
  return state.config.openaiConfigured || Boolean(els.openaiApiKey.value.trim());
}

async function loadConfig(){
  try{
    const response = await fetch('/api/config');
    const data = await response.json();
    if(!response.ok) throw new Error(data.error || 'Falha ao carregar configuração.');
    state.config.openaiConfigured = Boolean(data.openai?.configured);
    if(data.openai?.model && !els.openaiModel.value.trim()) els.openaiModel.value = data.openai.model;
    if(state.config.openaiConfigured){
      els.openaiApiKey.value = '';
      els.openaiApiKey.placeholder = 'Configurada no backend';
    }
  }catch{
    state.config.openaiConfigured = false;
  }
}

async function scan(){
  const payload = {
    apiKey: els.apiKey.value.trim(),
    baseUrl: els.baseUrl.value.trim(),
    attributesPath: els.attributesPath.value.trim(),
    attributeName: els.attributeName.value.trim(),
    useAiSuggestions: els.useAiSuggestions.checked,
    openaiApiKey: els.openaiApiKey.value.trim(),
    openaiModel: els.openaiModel.value.trim()
  };
  if(!payload.apiKey){ alert('Insira a API Key antes de mapear.'); return; }
  if(payload.useAiSuggestions && !hasOpenaiKey()){ alert('Insira a OpenAI API Key para usar IA no mapeamento.'); return; }
  setLoading(els.scanBtn, true, 'Mapeando...');
  try{
    const response = await fetch('/api/scan', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    const data = await response.json();
    if(!response.ok) throw new Error(data.error || 'Falha ao mapear.');
    state.items = data.items;
    state.summary = data.attribute;
    const aiText = payload.useAiSuggestions ? ` HEX gerado com IA (${payload.openaiModel || 'modelo padrão'}).` : '';
    state.diagnostics.unshift({ title:'Mapeamento concluído', message:`Encontrados ${data.attribute.missing_terms} termos sem HEX no atributo ${data.attribute.name}.${aiText}`, ok:true, time:new Date().toLocaleString() });
    renderDiagnostics(); renderTable();
  }catch(error){
    state.diagnostics.unshift({ title:'Falha no mapeamento', message:error.message || 'Erro desconhecido.', ok:false, time:new Date().toLocaleString() });
    renderDiagnostics(); alert(error.message || 'Erro ao mapear.');
  }finally{ setLoading(els.scanBtn, false); }
}

async function generateAiSuggestions(){
  if(!state.items.length){ alert('Mapeie as cores antes de gerar com IA.'); return; }
  const openaiApiKey = els.openaiApiKey.value.trim();
  if(!hasOpenaiKey()){ alert('Insira a OpenAI API Key para usar IA.'); return; }
  setLoading(els.aiSuggestBtn, true, 'Gerando...');
  try{
    const response = await fetch('/api/ai-suggest', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        openaiApiKey,
        openaiModel: els.openaiModel.value.trim(),
        items: state.items
      })
    });
    const data = await response.json();
    if(!response.ok) throw new Error(data.error || 'Falha ao gerar HEX com IA.');
    const itemMap = new Map(data.items.map(item => [String(item.id), item]));
    state.items = state.items.map(item => itemMap.get(String(item.id)) || item);
    state.diagnostics.unshift({ title:'HEX gerado com IA', message:`Modelo: ${data.model} | Total: ${data.summary.total} | Atualizados: ${data.summary.suggested}.`, ok:true, time:new Date().toLocaleString() });
    renderDiagnostics(); renderTable();
  }catch(error){
    state.diagnostics.unshift({ title:'Falha na IA', message:error.message || 'Erro desconhecido.', ok:false, time:new Date().toLocaleString() });
    renderDiagnostics(); alert(error.message || 'Erro ao gerar com IA.');
  }finally{ setLoading(els.aiSuggestBtn, false); }
}

async function applyUpdates(){
  const selectedItems = state.items.filter(i => i.selected);
  if(!selectedItems.length){ alert('Selecione pelo menos um item.'); return; }
  if(!window.confirm(`Enviar ${selectedItems.length} cor(es) pelo endpoint de terms e validar persistência?`)) return;
  setLoading(els.applyBtn, true, 'Enviando e validando...');
  try{
    const response = await fetch('/api/apply', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        apiKey: els.apiKey.value.trim(),
        baseUrl: els.baseUrl.value.trim(),
        attributesPath: els.attributesPath.value.trim(),
        attributeName: els.attributeName.value.trim(),
        attribute: state.summary,
        items: selectedItems,
        includeExistingTerms: els.includeExistingTerms.checked
      })
    });
    const data = await response.json();
    if(!response.ok) throw new Error(data.error || 'Falha ao enviar.');

    const resultMap = new Map(data.results.map(item => [String(item.id), item]));
    state.items = state.items.map(item => {
      const result = resultMap.get(String(item.id));
      if(!result) return item;
      return { ...item, status: result.status, message: result.message, persisted_rgb: result.persisted_rgb || '', match_strategy: result.match_strategy || '' };
    });

    const failedItems = data.results.filter(item => !item.ok).slice(0, 8).map(item => `${item.name}: ${item.message}`).join(' | ');
    const debugLinks = data.debug_files?.validation_report_url ? ` Relatório: ${data.debug_files.validation_report_url}` : '';
    const failedText = failedItems ? ` Primeiras falhas: ${failedItems}.` : '';
    state.diagnostics.unshift({ title:'Envio e validação concluídos', message:`Modo: ${data.mode} | Total: ${data.summary.total} | Confirmados: ${data.summary.success} | Não persistidos: ${data.summary.failed}.${failedText}${debugLinks}`, ok:data.summary.failed===0, time:new Date().toLocaleString() });
    renderDiagnostics(); renderTable();
  }catch(error){
    state.diagnostics.unshift({ title:'Falha no envio', message:error.message || 'Erro desconhecido.', ok:false, time:new Date().toLocaleString() });
    renderDiagnostics(); alert(error.message || 'Erro ao enviar.');
  }finally{ setLoading(els.applyBtn, false); }
}

els.colorsTableBody.addEventListener('input', (event) => {
  const target = event.target, id = target.dataset.id, action = target.dataset.action;
  if(!id || !action) return;
  const item = state.items.find(row => String(row.id) === String(id)); if(!item) return;
  if(action === 'hex'){ let value = String(target.value || '').trim().toUpperCase(); if(!value.startsWith('#')) value = `#${value}`; item.selected_rgb = value; item.suggested_source='Manual'; }
  if(action === 'color'){ item.selected_rgb = String(target.value || '#BEBEBE').toUpperCase(); item.suggested_source='Manual'; const textInput = els.colorsTableBody.querySelector(`input[data-action="hex"][data-id="${CSS.escape(String(id))}"]`); if(textInput) textInput.value = item.selected_rgb; }
  item.status='pending'; item.message='Editado manualmente.'; item.persisted_rgb=''; item.match_strategy=''; renderTable();
});
els.colorsTableBody.addEventListener('change', (event) => {
  const target = event.target, id = target.dataset.id, action = target.dataset.action;
  if(action !== 'toggle' || !id) return;
  const item = state.items.find(row => String(row.id) === String(id)); if(!item) return;
  item.selected = Boolean(target.checked); renderTable();
});
els.selectAllBtn.addEventListener('click', () => { const allSelected = state.items.every(i => i.selected); state.items.forEach(i => { i.selected = !allSelected; }); renderTable(); });
els.scanBtn.addEventListener('click', scan);
els.aiSuggestBtn.addEventListener('click', generateAiSuggestions);
els.applyBtn.addEventListener('click', applyUpdates);
els.resetBtn.addEventListener('click', resetAll);
els.searchInput.addEventListener('input', renderTable);
loadConfig().finally(resetAll);
