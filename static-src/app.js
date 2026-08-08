'use strict';

const STORAGE_KEY = 'cht_registration_static_v1';
const ADMIN_PASSWORD = 'Wishadmin';

const SAMPLE_OPTIONS = [
  { id: 'op1', label: '羽球友誼賽', desc: '08:30-12:00｜桃園巨蛋', color: '#003d79' },
  { id: 'op2', label: '親子野餐趣', desc: '10:00-15:00｜大安森林公園', color: '#f26522' },
  { id: 'op3', label: '企業參訪', desc: '09:00-12:00｜中華電信學院', color: '#1f6fb2' },
  { id: 'op4', label: '不克參加', desc: '今年無法到場，仍可完成報名程序', color: '#7a8ba3' }
];

const SAMPLE_MEMBERS = [
  { memberNo: 'CHT-001', name: '王小明', phone: '0912-345-001', department: '行動通信分公司', email: 'wang.xm@cht.com.tw' },
  { memberNo: 'CHT-002', name: '林怡君', phone: '0912-345-002', department: '企業客戶分公司', email: 'lin.yj@cht.com.tw' },
  { memberNo: 'CHT-003', name: '陳志豪', phone: '0912-345-003', department: '資訊技術分公司', email: 'chen.zh@cht.com.tw' },
  { memberNo: 'CHT-004', name: '張雅婷', phone: '0912-345-004', department: '數據通信分公司', email: 'zhang.yt@cht.com.tw' },
  { memberNo: 'CHT-005', name: '李建宏', phone: '0912-345-005', department: '北區分公司', email: 'li.jh@cht.com.tw' },
  { memberNo: 'CHT-006', name: '黃佩珊', phone: '0912-345-006', department: '中區分公司', email: 'huang.ps@cht.com.tw' },
  { memberNo: 'CHT-007', name: '劉冠廷', phone: '0912-345-007', department: '南區分公司', email: 'liu.gt@cht.com.tw' },
  { memberNo: 'CHT-008', name: '吳欣怡', phone: '0912-345-008', department: '國際電信分公司', email: 'wu.xy@cht.com.tw' },
  { memberNo: 'CHT-009', name: '蔡孟哲', phone: '0912-345-009', department: '中華電信研究院', email: 'cai.mz@cht.com.tw' },
  { memberNo: 'CHT-010', name: '許芳儀', phone: '0912-345-010', department: '客服中心', email: 'xu.fy@cht.com.tw' },
  { memberNo: 'CHT-011', name: '謝承翰', phone: '0912-345-011', department: '行動通信分公司', email: 'xie.ch@cht.com.tw' },
  { memberNo: 'CHT-012', name: '邱姿婷', phone: '0912-345-012', department: '資訊技術分公司', email: 'qiu.zt@cht.com.tw' },
  { memberNo: 'CHT-013', name: '羅文豪', phone: '0912-345-013', department: '企業客戶分公司', email: 'luo.wh@cht.com.tw' },
  { memberNo: 'CHT-014', name: '曾雅雯', phone: '0912-345-014', department: '數據通信分公司', email: 'zeng.yw@cht.com.tw' }
];

const SAMPLE_REGISTRATIONS = [
  { memberNo: 'CHT-001', options: ['op1'], submittedAt: '2026-08-03T09:12:00+08:00' },
  { memberNo: 'CHT-002', options: ['op1'], submittedAt: '2026-08-03T10:40:00+08:00' },
  { memberNo: 'CHT-003', options: ['op2'], submittedAt: '2026-08-03T14:05:00+08:00' },
  { memberNo: 'CHT-004', options: ['op3'], submittedAt: '2026-08-04T08:30:00+08:00' },
  { memberNo: 'CHT-005', options: ['op1'], submittedAt: '2026-08-04T11:20:00+08:00' },
  { memberNo: 'CHT-006', options: ['op4'], submittedAt: '2026-08-04T16:45:00+08:00' },
  { memberNo: 'CHT-007', options: ['op2'], submittedAt: '2026-08-05T09:05:00+08:00' },
  { memberNo: 'CHT-008', options: ['op1'], submittedAt: '2026-08-05T10:18:00+08:00' },
  { memberNo: 'CHT-009', options: ['op3'], submittedAt: '2026-08-05T13:37:00+08:00' },
  { memberNo: 'CHT-010', options: ['op2'], submittedAt: '2026-08-05T15:52:00+08:00' }
];

function defaultConfig() {
  return {
    siteTitle: '中華電信會員活動報名',
    eventTitle: '2026 會員盛夏交流會',
    description: '邀請會員一起參加年度盛夏交流，請選擇您想參加的一項活動。',
    startAt: '2026-08-01T09:00',
    deadline: '2026-08-20T17:30',
    qrUrl: '',
    open: true,
    options: SAMPLE_OPTIONS.map((o) => ({ ...o }))
  };
}

function defaultState() {
  return {
    config: defaultConfig(),
    members: SAMPLE_MEMBERS.map((m) => ({ ...m })),
    registrations: SAMPLE_REGISTRATIONS.map((r) => ({ ...r }))
  };
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed && parsed.config && Array.isArray(parsed.config.options)) {
      return parsed;
    }
  } catch {}
  return defaultState();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function $(selector, root = document) {
  return root.querySelector(selector);
}

function $$(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue;
    if (key === 'class') node.className = value;
    else if (key === 'style') node.setAttribute('style', value);
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child == null) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

function setText(selector, text) {
  const node = $(selector);
  if (node) node.textContent = text;
}

function refreshIcons() {
  if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
}

function normalizeKey(value) {
  return String(value || '').trim().toUpperCase();
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function formatDateTime(value) {
  if (!value) return '未設定';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function toDateOnly(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeOnly(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function csvCell(value) {
  const text = String(value == null ? '' : value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(filename, text) {
  const blob = new Blob([`\uFEFF${text}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = el('a', { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function parseCsv(text) {
  const source = String(text || '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') { field += '"'; i += 1; } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch !== '\r') field += ch;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => String(cell).trim() !== ''));
}

function toast(message, type = 'ok') {
  const box = el('div', { class: `toast ${type}`, textContent: message });
  document.body.append(box);
  setTimeout(() => box.remove(), 2600);
}

let state = loadState();
let pendingPayload = null;
let peopleMode = 'registered';
let peopleSearch = '';
let peopleFilter = 'all';
let csvText = '';
let csvHeaders = [];
let csvRows = [];

function optionLabel(id) {
  const option = (state.config.options || []).find((o) => o.id === id);
  return option ? option.label : id;
}

function findMember(memberNo) {
  return (state.members || []).find((m) => normalizeKey(m.memberNo) === normalizeKey(memberNo));
}

function uniqueRegistrations() {
  const map = new Map();
  (state.registrations || []).forEach((reg) => map.set(normalizeKey(reg.memberNo), reg));
  return [...map.values()];
}

function qrResolvedUrl() {
  return state.config.qrUrl || (window.location.href || '').split('#')[0];
}

function renderQrCode() {
  const url = qrResolvedUrl();
  setText('#qrUrlText', url);
  const box = $('#qrCode');
  box.innerHTML = '';
  if (typeof qrcode !== 'function') {
    box.append(el('span', { class: 'qr-loading' }, 'QR Code 產生器尚未載入'));
    return;
  }
  try {
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    box.append(el('img', { src: qr.createDataURL(8, 4), alt: '報名頁 QR Code' }));
  } catch {
    box.append(el('span', { class: 'qr-loading' }, '無法產生 QR Code'));
  }
}

function renderPublic() {
  const config = state.config;
  document.title = config.siteTitle || '報名統計系統';
  setText('#footerTitle', config.siteTitle);
  setText('#eventTitle', config.eventTitle);
  setText('#eventDesc', config.description);
  setText('#startText', `報名開始：${config.startAt ? formatDateTime(config.startAt) : '未設定開始時間'}`);
  setText('#deadlineText', `報名截止：${config.deadline ? formatDateTime(config.deadline) : '未設定截止時間'}`);

  const statusChip = $('#statusChip');
  const statusText = $('#statusText');
  const now = Date.now();
  const notStarted = config.startAt && new Date(config.startAt).getTime() > now;
  const ended = config.deadline && new Date(config.deadline).getTime() <= now;
  statusChip.classList.remove('status-live', 'status-wait', 'status-ended', 'status-closed');
  let statusLabel = '報名進行中';
  if (!config.open) statusLabel = '報名已關閉';
  else if (notStarted) statusLabel = '報名尚未開始';
  else if (ended) statusLabel = '報名已截止';
  statusText.textContent = statusLabel;
  statusChip.classList.add(statusLabel === '報名進行中' ? 'status-live' : statusLabel === '報名尚未開始' ? 'status-wait' : statusLabel === '報名已截止' ? 'status-ended' : 'status-closed');

  $('#manualFields').classList.toggle('hidden', state.members.length > 0);

  const grid = $('#options');
  grid.innerHTML = '';
  config.options.forEach((option) => {
    const label = el('label', { class: 'option-card', style: `--opt-color:${option.color}` });
    const input = el('input', { type: 'radio', name: 'event-option', value: option.id });
    const body = el('span', { class: 'option-body' });
    body.append(el('span', { class: 'option-title' }, option.label));
    if (option.desc) body.append(el('span', { class: 'option-desc' }, option.desc));
    input.addEventListener('change', () => label.classList.toggle('checked', input.checked));
    label.append(input, body);
    grid.append(label);
  });
  renderQrCode();
  refreshIcons();
}

function showConfirm(payload) {
  pendingPayload = payload;
  const summary = $('#confirmSummary');
  summary.innerHTML = '';
  const labels = payload.options.map((id) => optionLabel(id)).join('、');
  [['姓名', payload.name], ['手機', payload.phone || '未填寫'], ['身分證', payload.idCard || '未填寫'], ['出生年月日', payload.birthDate || '未填寫'], ['參加選項', labels]]
    .forEach(([label, value]) => summary.append(el('div', { class: 'confirm-row' }, el('span', {}, label), el('strong', {}, value))));
  $('#confirmModal').classList.remove('hidden');
  refreshIcons();
}

function closeConfirm() {
  $('#confirmModal').classList.add('hidden');
}

async function submitRegistration(payload) {
  const config = state.config;
  if (!config.open) return showError('報名目前已關閉');
  if (config.startAt && Date.parse(config.startAt) > Date.now()) return showError('報名尚未開始，請於開始時間後再送出');
  if (config.deadline && Date.parse(config.deadline) <= Date.now()) return showError('報名已截止，無法再送出');

  let member = null;
  const members = state.members;
  if (members.length > 0) {
    const nameMatches = members.filter((m) => m.name && normalizeKey(m.name) === normalizeKey(payload.name));
    if (nameMatches.length === 0) return showError('此姓名不在名冊中');
    if (nameMatches.length === 1) member = nameMatches[0];
    else {
      const phoneMatches = nameMatches.filter((m) => m.phone && normalizePhone(m.phone) === normalizePhone(payload.phone));
      if (phoneMatches.length === 1) member = phoneMatches[0];
      else return showError('名冊中有同名會員，請輸入正確的手機號碼');
    }
  } else {
    member = { memberNo: '', name: payload.name, phone: payload.phone, email: payload.email, idCard: payload.idCard, birthDate: payload.birthDate, department: '' };
    const existing = members.find((m) => m.memberNo.startsWith('M-') && normalizeKey(m.name) === normalizeKey(payload.name) && (!payload.phone || (m.phone && normalizePhone(m.phone) === normalizePhone(payload.phone))));
    if (existing) { Object.assign(existing, member); member = existing; }
    else { member.memberNo = `M-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; members.push(member); }
  }

  const optionLabels = {};
  payload.options.forEach((id) => { optionLabels[id] = optionLabel(id); });
  const now = new Date().toISOString();
  const existingReg = state.registrations.find((r) => normalizeKey(r.memberNo) === normalizeKey(member.memberNo));
  if (existingReg) {
    existingReg.options = payload.options;
    existingReg.optionLabels = optionLabels;
    existingReg.idCard = payload.idCard;
    existingReg.birthDate = payload.birthDate;
    existingReg.submittedAt = now;
  } else {
    state.registrations.push({ memberNo: member.memberNo, options: payload.options, optionLabels, idCard: payload.idCard, birthDate: payload.birthDate, submittedAt: now });
  }
  saveState();
  showResult(existingReg ? '報名已更新' : '報名成功', payload, now);
}

function showResult(title, payload, submittedAt) {
  const box = $('#result');
  box.classList.remove('hidden');
  box.innerHTML = '';
  const labels = payload.options.map((id) => optionLabel(id)).join('、');
  const tags = el('div', { class: 'result-tags' });
  payload.options.forEach((id) => { const option = state.config.options.find((o) => o.id === id); if (option) tags.append(el('span', { class: 'result-tag' }, option.label)); });
  box.append(
    el('div', { class: 'result-head' }, el('i', { 'data-lucide': 'circle-check-big' }), title),
    el('p', {}, `姓名：${payload.name}${payload.phone ? `｜手機：${payload.phone}` : ''}`),
    el('p', {}, `送出時間：${formatDateTime(submittedAt)}`),
    el('p', {}, `參加選項：${labels}`),
    tags
  );
  refreshIcons();
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showError(message) {
  const box = $('#formError');
  box.textContent = message;
  box.classList.remove('hidden');
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function handleSubmit(event) {
  event.preventDefault();
  $('#formError').classList.add('hidden');
  const name = $('#memberName').value.trim();
  const phone = $('#memberPhone').value.trim();
  const email = $('#memberEmail').value.trim();
  const idCard = $('#memberId').value.trim();
  const birthDate = $('#memberBirth').value;
  const options = $$('#options input:checked').map((input) => input.value);
  if (!name) return showError('請輸入姓名');
  if (options.length === 0) return showError('請選擇一個參加選項');
  if (options.length > 1) return showError('報名選項僅能選擇一項');
  if (idCard && !/^[A-Za-z][0-9]{9}$/.test(idCard)) return showError('身分證字號需為 10 碼（1 個英文字母 + 9 個數字）');
  const payload = { name, phone, email, idCard, birthDate, options };
  if (idCard || birthDate) showConfirm(payload);
  else await submitRegistration(payload);
}

async function submitPending() {
  closeConfirm();
  await submitRegistration(pendingPayload);
}

function statBlock(label, value, className) {
  return el('div', { class: `stat ${className}` }, el('span', {}, label), el('strong', {}, value));
}

function renderLastUpdated() {
  setText('#lastUpdated', `最後更新 ${formatDateTime(new Date().toISOString())}｜資料存於本機瀏覽器`);
}

function renderDeadlinePreview() {
  const members = state.members || [];
  const regs = uniqueRegistrations();
  const total = members.length;
  const registered = regs.length;
  const unregistered = Math.max(total - registered, 0);
  const rate = total ? Math.round((registered / total) * 100) : 0;
  const selections = regs.reduce((sum, reg) => sum + (reg.options || []).length, 0);
  const now = Date.now();
  const startAt = state.config.startAt ? new Date(state.config.startAt) : null;
  const deadline = state.config.deadline ? new Date(state.config.deadline) : null;
  let status = '未設定';
  if (startAt && !Number.isNaN(startAt.getTime()) && now < startAt.getTime()) status = '報名尚未開始';
  else if (deadline && !Number.isNaN(deadline.getTime())) {
    const diff = deadline.getTime() - now;
    status = diff > 0 ? `剩餘 ${Math.floor(diff / 86400000)} 天 ${Math.floor((diff % 86400000) / 3600000)} 小時` : '報名已截止';
  }
  const startText = startAt && !Number.isNaN(startAt.getTime()) ? formatDateTime(state.config.startAt) : '未設定';
  const deadlineText = deadline && !Number.isNaN(deadline.getTime()) ? formatDateTime(state.config.deadline) : '未設定';
  const preview = $('#deadlinePreview');
  preview.innerHTML = '';
  preview.append(
    el('div', { class: 'preview-head' }, el('strong', {}, el('i', { 'data-lucide': 'clipboard-list' }), '截止總覽預覽'), el('span', { class: 'muted' }, `報名期間 ${startText} 至 ${deadlineText}`)),
    el('div', { class: 'stat-grid' },
      statBlock('名冊總人數', total, 'stat-coral'),
      statBlock('已報名', registered, 'stat-teal'),
      statBlock('未報名', unregistered, 'stat-amber'),
      statBlock('報名率', `${rate}%`, 'stat-violet'),
      statBlock('選項累計人次', selections, 'stat-coral')
    ),
    el('div', { class: 'preview-meta' },
      el('span', {}, `報名開始：<strong>${startText}</strong>`),
      el('span', {}, `報名截止：<strong>${deadlineText}</strong>`),
      el('span', {}, `目前狀態：<strong>${status}</strong>`),
      el('span', {}, `名冊人數：<strong>${total}</strong> 人`),
      el('span', {}, `已報名：<strong>${registered}</strong> 人`),
      el('span', {}, `未報名：<strong>${unregistered}</strong> 人`)
    )
  );
  const bars = el('div', { class: 'option-bar-preview' });
  state.config.options.forEach((option) => {
    const count = regs.filter((reg) => (reg.options || []).includes(option.id)).length;
    const percent = registered ? Math.round((count / registered) * 100) : 0;
    bars.append(el('div', { class: 'mini-option-row' }, el('span', { class: 'mini-option-label' }, option.label, el('small', {}, `${count} 人`)), el('div', { class: 'bar' }, el('div', { class: 'bar-fill', style: `width:${percent}%;background:${option.color}` }))));
  });
  preview.append(bars);
  refreshIcons();
}

function renderOptionsReport() {
  const body = $('#optionsBody');
  const regs = uniqueRegistrations();
  const registered = regs.length;
  body.innerHTML = '';
  if (registered === 0) body.append(el('tr', {}, el('td', { colspan: '5' }, '尚無報名資料')));
  state.config.options.forEach((option) => {
    const selected = regs.filter((reg) => (reg.options || []).includes(option.id));
    const count = selected.length;
    const percent = registered ? Math.round((count / registered) * 100) : 0;
    const members = el('div', { class: 'member-list' });
    selected.forEach((reg) => {
      const member = findMember(reg.memberNo);
      members.append(el('span', { class: 'member-chip' }, member ? member.name : reg.memberNo, member && member.department ? el('span', {}, member.department) : null));
    });
    if (count === 0) members.append(el('span', { class: 'muted', style: 'font-size:13px' }, '尚無人選擇'));
    body.append(el('tr', {}, el('td', {}, el('strong', { style: `color:${option.color}` }, option.label)), el('td', {}, option.desc || '—'), el('td', {}, el('strong', {}, count)), el('td', {}, `${percent}%`, el('div', { class: 'bar' }, el('div', { class: 'bar-fill', style: `width:${percent}%;background:${option.color}` }))), el('td', {}, members)));
  });
}

function renderPeople() {
  const head = $('#peopleHead');
  const body = $('#peopleBody');
  const regs = uniqueRegistrations();
  const regByMember = new Map(regs.map((reg) => [normalizeKey(reg.memberNo), reg]));
  const members = state.members || [];
  const registered = members.filter((m) => regByMember.has(normalizeKey(m.memberNo))).map((m) => ({ ...m, reg: regByMember.get(normalizeKey(m.memberNo)) }));
  const unregistered = members.filter((m) => !regByMember.has(normalizeKey(m.memberNo)));
  const filter = (list) => list.filter((item) => {
    const haystack = [item.memberNo, item.name, item.department, item.phone, item.email].join(' ').toLowerCase();
    if (peopleSearch && !haystack.includes(peopleSearch.toLowerCase())) return false;
    if (peopleMode === 'registered' && peopleFilter !== 'all' && !(item.reg.options || []).includes(peopleFilter)) return false;
    return true;
  });
  const filterSelect = $('#peopleFilter');
  const currentFilter = peopleFilter;
  filterSelect.innerHTML = '';
  filterSelect.append(el('option', { value: 'all' }, '全部選項'));
  state.config.options.forEach((option) => filterSelect.append(el('option', { value: option.id }, option.label)));
  peopleFilter = state.config.options.some((o) => o.id === currentFilter) ? currentFilter : 'all';
  filterSelect.value = peopleFilter;

  let rows;
  let headers;
  if (peopleMode === 'registered') {
    headers = ['會員編號', '姓名', '部門', '手機', '身分證', '出生年月日', '參加選項', '報名時間'];
    rows = filter(registered).slice().sort((a, b) => new Date(b.reg.submittedAt) - new Date(a.reg.submittedAt));
  } else {
    headers = ['會員編號', '姓名', '部門', '手機', 'Email'];
    rows = filter(unregistered);
  }
  head.innerHTML = '';
  headers.forEach((header) => head.append(el('th', {}, header)));
  body.innerHTML = '';
  if (rows.length === 0) body.append(el('tr', {}, el('td', { colspan: headers.length }, '目前沒有符合條件的人員')));
  else rows.forEach((item) => {
    const tr = el('tr');
    if (peopleMode === 'registered') {
      const chips = el('div', { class: 'member-list' });
      (item.reg.options || []).forEach((id) => chips.append(el('span', { class: 'member-chip' }, optionLabel(id))));
      tr.append(el('td', {}, item.memberNo), el('td', {}, el('strong', {}, item.name || '—')), el('td', {}, item.department || '—'), el('td', {}, item.phone || '—'), el('td', {}, item.reg.idCard || '—'), el('td', {}, item.reg.birthDate ? toDateOnly(item.reg.birthDate) : '—'), el('td', {}, chips), el('td', {}, formatDateTime(item.reg.submittedAt)));
    } else {
      tr.append(el('td', {}, item.memberNo), el('td', {}, el('strong', {}, item.name || '—')), el('td', {}, item.department || '—'), el('td', {}, item.phone || '—'), el('td', {}, item.email || '—'));
    }
    body.append(tr);
  });
  setText('#peopleCount', `顯示 ${rows.length} / ${peopleMode === 'registered' ? registered.length : unregistered.length} 人`);
}

function renderRosterSummary() {
  const members = state.members || [];
  const registered = uniqueRegistrations().length;
  const box = $('#rosterSummary');
  box.innerHTML = '';
  box.append(statBlock('名冊人數', members.length, 'stat-teal'), statBlock('已報名', registered, 'stat-amber'), statBlock('未報名', Math.max(members.length - registered, 0), 'stat-coral'));
}

function renderDataCheck() {
  const box = $('#dataCheckResult');
  box.innerHTML = '';
  const issues = [];
  const members = state.members || [];
  const regs = state.registrations || [];
  const memberKeys = new Set();
  members.forEach((member) => {
    const key = normalizeKey(member.memberNo);
    if (!key) issues.push({ title: '名冊缺少會員編號', item: member.name || '未命名' });
    else if (memberKeys.has(key)) issues.push({ title: '名冊會員編號重複', item: `${member.name || '未命名'}（${member.memberNo}）` });
    memberKeys.add(key);
  });
  const configIds = new Set(state.config.options.map((o) => o.id));
  const regKeys = new Set();
  regs.forEach((reg) => {
    const key = normalizeKey(reg.memberNo);
    if (!memberKeys.has(key)) issues.push({ title: '報名資料找不到對應名冊', item: reg.memberNo });
    if (regKeys.has(key)) issues.push({ title: '同一會員重複報名', item: reg.memberNo });
    regKeys.add(key);
    if (reg.idCard && !/^[A-Za-z][0-9]{9}$/.test(reg.idCard)) issues.push({ title: '身分證字號不是 10 碼', item: `${reg.memberNo}：${reg.idCard}` });
    if (reg.birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(reg.birthDate)) issues.push({ title: '出生年月日格式異常', item: `${reg.memberNo}：${reg.birthDate}` });
    const stale = (reg.options || []).filter((id) => !configIds.has(id));
    if (stale.length) issues.push({ title: '報名選項已被刪除', item: `${reg.memberNo}：${stale.join('、')}` });
  });
  const grouped = new Map();
  issues.forEach((issue) => { if (!grouped.has(issue.title)) grouped.set(issue.title, []); grouped.get(issue.title).push(issue.item); });
  if (grouped.size === 0) box.append(el('div', { class: 'data-check-ok' }, el('i', { 'data-lucide': 'circle-check-big' }), el('strong', {}, '未發現資料問題'), el('span', {}, `已檢查 ${members.length} 位名冊、${regs.length} 筆報名資料`)));
  else grouped.forEach((items, title) => box.append(el('div', { class: 'issue-card' }, el('div', { class: 'issue-head' }, el('strong', {}, title), el('span', { class: 'issue-count' }, `${items.length} 筆`)), el('div', { class: 'issue-list' }, items.slice(0, 20).map((item) => el('span', { class: 'issue-item' }, item))))));
  refreshIcons();
}

async function renderQrStatus(forceCheck = false) {
  const box = $('#qrStatusBox');
  if (!box) return;
  const url = qrResolvedUrl();
  const source = state.config.qrUrl ? 'configured' : 'auto';
  box.innerHTML = '';
  const img = el('img', { class: 'qr-status-img', alt: '後台 QR Code' });
  try {
    const qr = qrcode(0, 'M');
    qr.addData(url || 'about:blank');
    qr.make();
    img.src = qr.createDataURL(8, 4);
  } catch { img.replaceWith(el('span', { class: 'muted' }, 'QR Code 產生器未載入')); }
  const info = el('div', { class: 'qr-status-info' }, el('div', { class: 'qr-status-url' }, el('span', {}, source === 'configured' ? '自訂網址' : '自動偵測網址'), el('strong', {}, url || '未設定')), el('span', { class: 'qr-status-badge qr-status-pending' }, '檢查中…'));
  box.append(img, info);
  refreshIcons();
  const status = await checkQrUrl(url);
  const badge = box.querySelector('.qr-status-badge');
  if (badge) {
    badge.textContent = status.ok ? '可用' : (status.ok === null ? '待確認' : '需設定');
    badge.className = `qr-status-badge ${status.ok ? 'qr-status-ok' : (status.ok === null ? 'qr-status-warn' : 'qr-status-bad')}`;
  }
  const hint = $('#qrStatusHint');
  if (hint && status.reason) hint.textContent = status.reason;
}

async function checkQrUrl(url) {
  if (!url) return { ok: false, reason: '尚未設定 QR 網址' };
  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) return { ok: false, reason: '目前不是網頁網址（file:// 無法分享），請在活動設定填入正式網址' };
  } catch { return { ok: false, reason: 'QR 網址格式不正確' }; }
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    if (response.type === 'opaque' || response.status < 500) return { ok: true, reason: '網址可開啟，QR Code 已更新' };
    return { ok: false, reason: '目前無法連線到該網址' };
  } catch { return { ok: null, reason: '無法即時連線檢查（可能是跨網域限制），網址格式正確且可於瀏覽器開啟' }; }
}

function renderAll() {
  renderLastUpdated();
  renderDeadlinePreview();
  renderOptionsReport();
  renderPeople();
  renderRosterSummary();
  renderDataCheck();
  void renderQrStatus();
}

function renderConfigForm() {
  const config = state.config;
  $('#siteTitle').value = config.siteTitle || '';
  $('#eventTitle').value = config.eventTitle || '';
  $('#description').value = config.description || '';
  $('#startDate').value = toDateOnly(config.startAt);
  $('#startTime').value = toTimeOnly(config.startAt) || '17:30';
  $('#endDate').value = toDateOnly(config.deadline);
  $('#endTime').value = toTimeOnly(config.deadline) || '17:30';
  $('#qrUrl').value = config.qrUrl || '';
  $('#openToggle').checked = Boolean(config.open);
  const editor = $('#optionEditor');
  editor.innerHTML = '';
  (config.options || []).forEach((option) => addOptionRow(option));
}

function addOptionRow(option) {
  const editor = $('#optionEditor');
  const row = el('div', { class: 'option-row' });
  row.dataset.id = option.id || '';
  const color = el('input', { type: 'color', value: option.color || '#003d79', 'aria-label': '選項顏色' });
  const labelInput = el('input', { type: 'text', value: option.label || '', placeholder: '選項名稱', maxlength: '80' });
  const descInput = el('input', { type: 'text', value: option.desc || '', placeholder: '說明（選填）', maxlength: '160' });
  const removeBtn = el('button', { class: 'btn btn-danger', type: 'button', 'aria-label': '刪除選項' }, el('i', { 'data-lucide': 'trash-2' }));
  removeBtn.addEventListener('click', () => { row.remove(); refreshIcons(); });
  row.append(color, labelInput, descInput, removeBtn);
  editor.append(row);
  refreshIcons();
}

function saveConfig() {
  const rows = $$('#optionEditor .option-row').map((row) => {
    const inputs = row.querySelectorAll('input');
    return { id: row.dataset.id || '', label: inputs[1].value.trim(), desc: inputs[2].value.trim(), color: inputs[0].value };
  });
  if (!rows.some((option) => option.label)) return toast('至少需要一個有名稱的活動選項', 'error');
  const combineEventTime = (dateId, timeId) => {
    const date = $(dateId).value;
    if (!date) return '';
    return `${date}T${$(timeId).value || '17:30'}`;
  };
  const startAt = combineEventTime('#startDate', '#startTime');
  const deadline = combineEventTime('#endDate', '#endTime');
  if (startAt && deadline && Date.parse(startAt) > Date.parse(deadline)) return toast('活動開始時間不能晚於截止時間', 'error');
  const qrUrl = $('#qrUrl').value.trim();
  if (qrUrl && !/^https?:\/\//i.test(qrUrl)) return toast('QR 網址格式不正確，需以 http:// 或 https:// 開頭', 'error');
  state.config = {
    siteTitle: $('#siteTitle').value.trim(),
    eventTitle: $('#eventTitle').value.trim(),
    description: $('#description').value.trim(),
    startAt,
    deadline,
    qrUrl,
    open: $('#openToggle').checked,
    options: rows.filter((option) => option.label)
  };
  saveState();
  toast('設定已儲存');
  renderConfigForm();
  renderPublic();
  renderAll();
}

function renderCsvPreview() {
  const box = $('#csvPreview');
  box.classList.remove('hidden');
  box.innerHTML = '';
  box.append(el('h3', {}, '欄位對應與預覽'), el('p', { class: 'muted', style: 'margin:0 0 12px' }, `偵測到 ${csvRows.length} 筆資料、${csvHeaders.length} 個欄位`));
  const tableEl = el('table', { class: 'data-table' });
  const thead = el('thead');
  const tbody = el('tbody');
  const headRow = el('tr');
  csvHeaders.forEach((header) => headRow.append(el('th', {}, header)));
  thead.append(headRow);
  csvRows.slice(0, 6).forEach((row) => {
    const tr = el('tr');
    csvHeaders.forEach((header, index) => {
      const cell = row[index] == null ? '' : String(row[index]);
      tr.append(el('td', {}, cell.length > 60 ? `${cell.slice(0, 60)}…` : cell));
    });
    tbody.append(tr);
  });
  tableEl.append(thead, tbody);
  box.append(el('div', { class: 'table-wrap' }, tableEl));
  if (csvRows.length > 6) box.append(el('p', { class: 'preview-note' }, `僅顯示前 6 筆，全部 ${csvRows.length} 筆都會匯入`));
  const mappingGrid = el('div', { class: 'mapping-grid' });
  CSV_FIELDS.forEach(({ key, label }) => {
    const select = el('select', { id: `map-${key}` });
    select.append(el('option', { value: '' }, '不匯入'));
    csvHeaders.forEach((header) => select.append(el('option', { value: header }, header)));
    select.value = detectMapping()[key] || '';
    mappingGrid.append(el('label', { class: 'field' }, el('span', {}, label), select));
  });
  box.append(mappingGrid);
  box.append(el('label', { class: 'toggle-field', style: 'margin-bottom:14px' }, el('span', {}, el('strong', {}, '取代現有名冊'), el('small', {}, '勾選後會以本次檔案取代名冊，並移除不在新名冊中的報名')), el('input', { id: 'replaceRoster', type: 'checkbox', role: 'switch' })));
  const importBtn = el('button', { class: 'btn btn-primary', type: 'button' }, el('i', { 'data-lucide': 'file-up' }), el('span', {}, '確認匯入名冊'));
  importBtn.addEventListener('click', doImport);
  box.append(importBtn);
  refreshIcons();
}

const CSV_FIELDS = [
  { key: 'memberNo', label: '會員編號（必填）' },
  { key: 'name', label: '姓名' },
  { key: 'phone', label: '手機' },
  { key: 'department', label: '部門' },
  { key: 'email', label: 'Email' }
];

const DETECT_RULES = {
  memberNo: ['會員編號', '會員號', '會員號碼', '編號', '員工編號', '員工號', '工號', '員編', '會員id', 'memberno', 'member_no', 'memberid', 'empno', 'id'],
  name: ['姓名', '中文姓名', '會員姓名', '員工姓名', '名稱', 'name'],
  phone: ['手機', '手機號碼', '手機號', '電話', '聯絡電話', '行動電話', 'phone', 'mobile', 'tel'],
  department: ['部門', '部門名稱', '單位', '科室', '組織', '分公司', 'department', 'dept'],
  email: ['email', 'e-mail', '電子郵件', '電子郵箱', '信箱', '郵件']
};

function normalizeHeader(header) {
  return header.toLowerCase().replace(/[\s()（）_\-.]/g, '');
}

function detectMapping() {
  const mapping = {};
  const normalizedHeaders = csvHeaders.map(normalizeHeader);
  CSV_FIELDS.forEach(({ key }) => {
    const rules = DETECT_RULES[key].map(normalizeHeader);
    for (let i = 0; i < normalizedHeaders.length; i += 1) {
      if (rules.includes(normalizedHeaders[i])) { mapping[key] = csvHeaders[i]; break; }
    }
  });
  return mapping;
}

function doImport() {
  const mapping = {};
  CSV_FIELDS.forEach(({ key }) => { mapping[key] = $(`#map-${key}`).value; });
  if (!mapping.memberNo) return toast('請先指定「會員編號」欄位', 'error');
  const replace = $('#replaceRoster').checked;
  const seen = new Set();
  const imported = [];
  let skipped = 0;
  const headerIndex = new Map(csvHeaders.map((h, i) => [h, i]));
  const pick = (row, field) => {
    const col = mapping[field];
    if (!col) return '';
    const index = headerIndex.get(col);
    return index == null ? '' : String(row[index] || '').trim();
  };
  csvRows.forEach((row) => {
    const memberNo = pick(row, 'memberNo');
    if (!memberNo) { skipped += 1; return; }
    const key = normalizeKey(memberNo);
    if (seen.has(key)) { skipped += 1; return; }
    seen.add(key);
    imported.push({ memberNo, name: pick(row, 'name'), phone: pick(row, 'phone'), department: pick(row, 'department'), email: pick(row, 'email') });
  });
  if (!imported.length) return toast('沒有可匯入的資料，請確認「會員編號」欄位', 'error');
  let added = 0;
  let updated = 0;
  if (replace) {
    const newKeys = new Set(imported.map((m) => normalizeKey(m.memberNo)));
    state.registrations = state.registrations.filter((reg) => newKeys.has(normalizeKey(reg.memberNo)));
    state.members = imported;
    added = imported.length;
  } else {
    const existing = new Map(state.members.map((m) => [normalizeKey(m.memberNo), m]));
    imported.forEach((member) => {
      const old = existing.get(normalizeKey(member.memberNo));
      if (old) { Object.assign(old, member); updated += 1; }
      else { state.members.push(member); added += 1; }
    });
  }
  saveState();
  toast(`匯入完成：新增 ${added} 筆、更新 ${updated} 筆、略過 ${skipped} 筆`);
  renderAll();
  renderRosterSummary();
}

function resetData(mode) {
  const label = mode === 'empty' ? '清空全部資料' : '重置範例資料';
  const message = mode === 'empty' ? '確定要清空名冊與全部報名資料嗎？此動作無法復原。' : '確定要重置為範例資料嗎？目前名冊與報名資料會被取代。';
  if (!window.confirm(message)) return;
  state = mode === 'empty' ? { config: defaultConfig(), members: [], registrations: [] } : defaultState();
  saveState();
  toast(`${label}完成`);
  renderAll();
  renderConfigForm();
}

function exportOptionsCsv() {
  const regs = uniqueRegistrations();
  const rows = [['活動選項', '說明', '會員編號', '姓名', '部門', '手機']];
  state.config.options.forEach((option) => {
    regs.forEach((reg) => {
      if ((reg.options || []).includes(option.id)) {
        const member = findMember(reg.memberNo);
        rows.push([option.label, option.desc || '', reg.memberNo, member ? member.name : '', member ? member.department : '', member ? member.phone : '']);
      }
    });
  });
  downloadCsv('活動選項報表.csv', rows.map((row) => row.map(csvCell).join(',')).join('\n'));
}

function exportPeopleCsv() {
  const regs = uniqueRegistrations();
  const regByMember = new Map(regs.map((reg) => [normalizeKey(reg.memberNo), reg]));
  const members = state.members || [];
  const list = peopleMode === 'registered' ? members.filter((m) => regByMember.has(normalizeKey(m.memberNo))) : members.filter((m) => !regByMember.has(normalizeKey(m.memberNo)));
  const headers = peopleMode === 'registered' ? ['會員編號', '姓名', '部門', '手機', 'Email', '身分證', '出生年月日', '參加選項', '報名時間'] : ['會員編號', '姓名', '部門', '手機', 'Email'];
  const rows = [headers];
  list.forEach((member) => {
    if (peopleMode === 'registered') {
      const reg = regByMember.get(normalizeKey(member.memberNo));
      rows.push([member.memberNo, member.name, member.department, member.phone, member.email, reg.idCard || '', reg.birthDate ? toDateOnly(reg.birthDate) : '', (reg.options || []).map((id) => optionLabel(id)).join('、'), formatDateTime(reg.submittedAt)]);
    } else rows.push([member.memberNo, member.name, member.department, member.phone, member.email]);
  });
  downloadCsv(peopleMode === 'registered' ? '已報名人員清冊.csv' : '未報名人員清冊.csv', rows.map((row) => row.map(csvCell).join(',')).join('\n'));
}

function showAdmin() {
  document.getElementById('publicPage').style.display = 'none';
  const adminPage = document.getElementById('adminPage');
  adminPage.classList.add('visible');
  const authed = sessionStorage.getItem('static_admin_authed') === '1';
  $('#loginScreen').classList.toggle('hidden', authed);
  $('#app').classList.toggle('hidden', !authed);
  if (authed) {
    renderAll();
    renderConfigForm();
  }
  refreshIcons();
  window.scrollTo(0, 0);
}

function showPublic() {
  document.getElementById('publicPage').style.display = '';
  document.getElementById('adminPage').classList.remove('visible');
  renderPublic();
  window.scrollTo(0, 0);
}

function route() {
  if (window.location.hash.startsWith('#/admin')) showAdmin();
  else showPublic();
}

function bindEvents() {
  $('#adminBtn').addEventListener('click', () => { window.location.hash = '#/admin'; });
  $('#backHome').addEventListener('click', () => { window.location.hash = ''; });
  $('#adminLoginForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const errorBox = $('#adminLoginError');
    errorBox.classList.add('hidden');
    if ($('#adminPassword').value === ADMIN_PASSWORD) {
      sessionStorage.setItem('static_admin_authed', '1');
      showAdmin();
    } else {
      errorBox.textContent = '帳號或密碼錯誤';
      errorBox.classList.remove('hidden');
    }
  });
  $('#logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('static_admin_authed');
    window.location.hash = '';
  });
  $('#refreshBtn').addEventListener('click', () => { renderAll(); void renderQrStatus(true); });
  $('#qrCheckBtn').addEventListener('click', () => { void renderQrStatus(true); });
  $('#runDataCheckBtn').addEventListener('click', renderAll);
  $$('.nav-item').forEach((button) => {
    button.addEventListener('click', () => {
      $$('.nav-item').forEach((item) => item.classList.toggle('active', item === button));
      $$('.section').forEach((section) => section.classList.toggle('hidden', section.id !== button.dataset.section));
    });
  });
  $('#saveConfigBtn').addEventListener('click', saveConfig);
  $('#addOptionBtn').addEventListener('click', () => addOptionRow({}));
  $('#csvFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    csvText = await file.text();
    const rows = parseCsv(csvText);
    if (rows.length < 2) return toast('CSV 需要至少一列標題與一列資料', 'error');
    csvHeaders = rows[0].map((cell) => String(cell).trim());
    csvRows = rows.slice(1);
    renderCsvPreview();
  });
  $('#resetSampleBtn').addEventListener('click', () => resetData('sample'));
  $('#clearAllBtn').addEventListener('click', () => resetData('empty'));
  $('#exportOptionsBtn').addEventListener('click', exportOptionsCsv);
  $('#exportPeopleBtn').addEventListener('click', exportPeopleCsv);
  $('#peopleSearch').addEventListener('input', (event) => { peopleSearch = event.target.value.trim(); renderPeople(); });
  $('#peopleFilter').addEventListener('change', (event) => { peopleFilter = event.target.value; renderPeople(); });
  $$('.seg').forEach((button) => button.addEventListener('click', () => {
    peopleMode = button.dataset.peopleMode;
    $$('.seg').forEach((seg) => seg.classList.toggle('active', seg === button));
    renderPeople();
  }));
  $('#regForm').addEventListener('submit', handleSubmit);
  $('#confirmClose').addEventListener('click', closeConfirm);
  $('#confirmBack').addEventListener('click', closeConfirm);
  $('#confirmSubmit').addEventListener('click', () => { void submitPending(); });
  $('#confirmModal').addEventListener('click', (event) => { if (event.target === event.currentTarget) closeConfirm(); });
  window.addEventListener('hashchange', route);
}

bindEvents();
route();
refreshIcons();
