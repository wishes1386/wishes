'use strict';

let state = null;
let peopleMode = 'registered';
let peopleSearch = '';
let peopleFilter = 'all';
let csvText = '';
let csvHeaders = [];
let csvRows = [];
let refreshing = false;

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

function uniqueRegistrations() {
  const map = new Map();
  (state.registrations || []).forEach((reg) => {
    map.set(normalizeKey(reg.memberNo), reg);
  });
  return [...map.values()];
}

function findMember(memberNo) {
  return (state.members || []).find((member) => normalizeKey(member.memberNo) === normalizeKey(memberNo));
}

function optionLabel(id) {
  const option = (state.config.options || []).find((o) => o.id === id);
  return option ? option.label : id;
}

function registrationOptions(reg) {
  return (reg.options || []).map((id) => optionLabel(id)).join('、') || '無';
}

function relationLabel(relationType) {
  if (relationType === 'family') return '親屬';
  if (relationType === 'child') return '未滿12歲';
  return '會員本人';
}

async function initAdmin() {
  bindStaticEvents();
  try {
    const session = await api('/api/admin/session');
    if (session.authed) {
      showApp();
    } else {
      showLogin();
    }
  } catch {
    showLogin();
  }
}

function bindStaticEvents() {
  $('#adminLoginForm').addEventListener('submit', handleAdminLogin);
  $('#adminPassword').addEventListener('input', () => $('#adminLoginError').classList.add('hidden'));
  $('#backHome').addEventListener('click', () => {
    window.location.href = '/';
  });
  $('#logoutBtn').addEventListener('click', async () => {
    await api('/api/admin/logout', { method: 'POST' });
    window.location.href = '/';
  });
  $('#refreshBtn').addEventListener('click', () => {
    refreshState();
    void renderQrStatus(true);
  });
  $('#qrCheckBtn').addEventListener('click', () => {
    void renderQrStatus(true);
  });
  $('#runDataCheckBtn').addEventListener('click', refreshState);

  $$('.nav-item').forEach((button) => {
    button.addEventListener('click', () => {
      $$('.nav-item').forEach((item) => item.classList.toggle('active', item === button));
      const target = button.dataset.section;
      $$('.section').forEach((section) => section.classList.toggle('hidden', section.id !== target));
    });
  });

  $('#saveConfigBtn').addEventListener('click', saveConfig);
  $('#addOptionBtn').addEventListener('click', () => addOptionRow({}));
  $('#csvFile').addEventListener('change', handleCsvFile);
  $('#resetSampleBtn').addEventListener('click', () => resetData('sample'));
  $('#clearAllBtn').addEventListener('click', () => resetData('empty'));
  $('#exportOptionsBtn').addEventListener('click', exportOptionsCsv);
  $('#exportPeopleBtn').addEventListener('click', exportPeopleCsv);
  $('#peopleSearch').addEventListener('input', (event) => {
    peopleSearch = event.target.value.trim();
    renderPeople();
  });
  $('#peopleFilter').addEventListener('change', (event) => {
    peopleFilter = event.target.value;
    renderPeople();
  });
  $$('.seg').forEach((button) => {
    button.addEventListener('click', () => {
      peopleMode = button.dataset.peopleMode;
      $$('.seg').forEach((seg) => seg.classList.toggle('active', seg === button));
      renderPeople();
    });
  });
}

async function refreshState() {
  if (refreshing) return;
  refreshing = true;
  try {
    state = await api('/api/admin/state');
    renderAll();
  } catch (err) {
    if (err.status === 401) {
      showLogin();
    } else {
      toast(err.message, 'error');
    }
  } finally {
    refreshing = false;
  }
}

async function reloadState() {
  try {
    state = await api('/api/admin/state');
    renderAll();
  } catch (err) {
    if (err.status === 401) {
      showLogin();
    } else {
      toast(err.message, 'error');
    }
  }
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

function resolveQrUrl() {
  const configured = state.config.qrUrl;
  const url = configured || (window.location.href || '').split('#')[0];
  return { url, source: configured ? 'configured' : 'auto' };
}

async function checkQrUrl(url) {
  if (!url) {
    return { ok: false, reason: '尚未設定 QR 網址' };
  }
  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) {
      return { ok: false, reason: '目前不是網頁網址（file:// 無法分享），請在活動設定填入正式網址' };
    }
  } catch {
    return { ok: false, reason: 'QR 網址格式不正確' };
  }
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    if (response.type === 'opaque' || response.status < 500) {
      return { ok: true, reason: '網址可開啟，QR Code 已更新' };
    }
    return { ok: false, reason: '目前無法連線到該網址' };
  } catch {
    return { ok: null, reason: '無法即時連線檢查（可能是跨網域限制），網址格式正確且可於瀏覽器開啟' };
  }
}

async function renderQrStatus(forceCheck = false) {
  const box = $('#qrStatusBox');
  if (!box) return;
  const { url, source } = resolveQrUrl();
  box.innerHTML = '';

  const img = el('img', { class: 'qr-status-img', alt: '後台 QR Code' });
  try {
    const qr = qrcode(0, 'M');
    qr.addData(url || 'about:blank');
    qr.make();
    img.src = qr.createDataURL(8, 4);
  } catch {
    img.replaceWith(el('span', { class: 'muted' }, 'QR Code 產生器未載入'));
  }

  const info = el('div', { class: 'qr-status-info' },
    el('div', { class: 'qr-status-url' },
      el('span', {}, source === 'configured' ? '自訂網址' : '自動偵測網址'),
      el('strong', {}, url || '未設定')
    ),
    el('span', { class: 'qr-status-badge qr-status-pending' }, '檢查中…')
  );
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

function renderLastUpdated() {
  const time = state.serverTime ? formatDateTime(state.serverTime) : '';
  setText('#lastUpdated', `最後更新 ${time}｜每 15 秒自動更新`);
}

function renderDeadlinePreview() {
  const members = state.members || [];
  const regs = uniqueRegistrations();
  const total = members.length;
  const registered = regs.length;
  const unregistered = Math.max(total - registered, 0);
  const rate = total ? Math.round((registered / total) * 100) : 0;
  const selections = regs.reduce((sum, reg) => sum + (reg.options || []).length, 0);

  const startAt = state.config.startAt ? new Date(state.config.startAt) : null;
  const deadline = state.config.deadline ? new Date(state.config.deadline) : null;
  const now = Date.now();
  let status = '未設定';
  if (startAt && !Number.isNaN(startAt.getTime()) && now < startAt.getTime()) {
    status = '報名尚未開始';
  } else if (deadline && !Number.isNaN(deadline.getTime())) {
    const diff = deadline.getTime() - now;
    if (diff > 0) {
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      status = `剩餘 ${days} 天 ${hours} 小時`;
    } else {
      status = '報名已截止';
    }
  }
  const startText = startAt && !Number.isNaN(startAt.getTime()) ? formatDateTime(state.config.startAt) : '未設定';
  const deadlineText = deadline && !Number.isNaN(deadline.getTime()) ? formatDateTime(state.config.deadline) : '未設定';

  const preview = $('#deadlinePreview');
  preview.innerHTML = '';
  preview.append(
    el('div', { class: 'preview-head' },
      el('strong', {}, el('i', { 'data-lucide': 'clipboard-list' }), '截止總覽預覽'),
      el('span', { class: 'muted' }, `報名期間 ${startText} 至 ${deadlineText}`)
    ),
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
      el('span', {}, `未報名：<strong>${unregistered}</strong> 人`),
      el('span', {}, `報名率：<strong>${rate}%</strong>`)
    )
  );

  const barPreview = el('div', { class: 'option-bar-preview' });
  (state.config.options || []).forEach((option) => {
    const count = regs.filter((reg) => (reg.options || []).includes(option.id)).length;
    const percent = registered ? Math.round((count / registered) * 100) : 0;
    barPreview.append(
      el('div', { class: 'mini-option-row' },
        el('span', { class: 'mini-option-label' }, option.label, el('small', {}, `${count} 人`)),
        el('div', { class: 'bar' }, el('div', { class: 'bar-fill', style: `width:${percent}%;background:${option.color}` }))
      )
    );
  });
  preview.append(barPreview);
  refreshIcons();
}

function statBlock(label, value, className) {
  return el('div', { class: `stat ${className}` }, el('span', {}, label), el('strong', {}, value));
}

function renderOptionsReport() {
  const body = $('#optionsBody');
  const regs = uniqueRegistrations();
  const registered = regs.length;
  body.innerHTML = '';

  if (registered === 0) {
    body.append(el('tr', {}, el('td', { colspan: '5' }, '尚無報名資料')));
  }

  (state.config.options || []).forEach((option) => {
    const selected = regs.filter((reg) => (reg.options || []).includes(option.id));
    const count = selected.length;
    const percent = registered ? Math.round((count / registered) * 100) : 0;
    const members = el('div', { class: 'member-list' });
    selected.forEach((reg) => {
      const member = findMember(reg.memberNo);
      members.append(
        el('span', { class: 'member-chip' },
          member ? member.name : reg.memberNo,
          member && member.department ? el('span', {}, member.department) : null
        )
      );
    });
    if (count === 0) members.append(el('span', { class: 'muted', style: 'font-size:13px' }, '尚無人選擇'));

    body.append(
      el('tr', {},
        el('td', {}, el('strong', { style: `color:${option.color}` }, option.label)),
        el('td', {}, option.desc || '—'),
        el('td', {}, el('strong', {}, count)),
        el('td', {}, `${percent}%`, el('div', { class: 'bar' }, el('div', { class: 'bar-fill', style: `width:${percent}%;background:${option.color}` }))),
        el('td', {}, members)
      )
    );
  });

  const configIds = new Set((state.config.options || []).map((o) => o.id));
  const staleIds = new Set();
  regs.forEach((reg) => (reg.options || []).forEach((id) => {
    if (!configIds.has(id)) staleIds.add(id);
  }));
  if (staleIds.size > 0) {
    const selected = regs.filter((reg) => (reg.options || []).some((id) => staleIds.has(id)));
    const members = el('div', { class: 'member-list' });
    selected.forEach((reg) => {
      const member = findMember(reg.memberNo);
      members.append(el('span', { class: 'member-chip' }, member ? member.name : reg.memberNo));
    });
    body.append(
      el('tr', {},
        el('td', {}, el('strong', { style: 'color:#b32e28' }, '已移除選項')),
        el('td', {}, '選項已從活動設定中刪除'),
        el('td', {}, el('strong', {}, selected.length)),
        el('td', {}, '—'),
        el('td', {}, members)
      )
    );
  }
}

function renderPeople() {
  const head = $('#peopleHead');
  const body = $('#peopleBody');
  const regs = uniqueRegistrations();
  const regByMember = new Map(regs.map((reg) => [normalizeKey(reg.memberNo), reg]));
  const members = state.members || [];

  const registered = members
    .filter((member) => regByMember.has(normalizeKey(member.memberNo)))
    .map((member) => ({ ...member, reg: regByMember.get(normalizeKey(member.memberNo)) }));
  const unregistered = members.filter((member) => !regByMember.has(normalizeKey(member.memberNo)));

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
  (state.config.options || []).forEach((option) => {
    filterSelect.append(el('option', { value: option.id }, option.label));
  });
  peopleFilter = (state.config.options || []).some((o) => o.id === currentFilter) ? currentFilter : 'all';
  filterSelect.value = peopleFilter;

  let rows;
  let headers;
  if (peopleMode === 'registered') {
    headers = ['會員編號', '姓名', '部門', '手機', '報名對象', '會員本人', '身分證', '出生年月日(民國)', '參加選項', '報名時間'];
    rows = filter(registered).slice().sort((a, b) => new Date(b.reg.submittedAt) - new Date(a.reg.submittedAt));
  } else {
    headers = ['會員編號', '姓名', '部門', '手機', 'Email'];
    rows = filter(unregistered);
  }

  head.innerHTML = '';
  headers.forEach((header) => head.append(el('th', {}, header)));
  body.innerHTML = '';

  if (rows.length === 0) {
    body.append(el('tr', {}, el('td', { colspan: headers.length }, '目前沒有符合條件的人員')));
  } else {
    rows.forEach((item) => {
      const tr = el('tr');
      if (peopleMode === 'registered') {
        const chips = el('div', { class: 'member-list' });
        (item.reg.options || []).forEach((id) => {
          chips.append(el('span', { class: 'member-chip' }, optionLabel(id)));
        });
        tr.append(
          el('td', {}, item.memberNo),
          el('td', {}, el('strong', {}, item.name || '—')),
          el('td', {}, item.department || '—'),
          el('td', {}, item.phone || '—'),
          el('td', {}, relationLabel(item.reg.relationType)),
          el('td', {}, item.reg.guardianName ? `${item.reg.guardianName}（${item.reg.guardianMemberNo}）` : '—'),
          el('td', {}, item.reg.idCard || '—'),
          el('td', {}, item.reg.birthDate ? formatRocDate(item.reg.birthDate) : '—'),
          el('td', {}, chips),
          el('td', {}, formatDateTime(item.reg.submittedAt))
        );
      } else {
        tr.append(
          el('td', {}, item.memberNo),
          el('td', {}, el('strong', {}, item.name || '—')),
          el('td', {}, item.department || '—'),
          el('td', {}, item.phone || '—'),
          el('td', {}, item.email || '—')
        );
      }
      body.append(tr);
    });
  }

  const totalInMode = peopleMode === 'registered' ? registered.length : unregistered.length;
  setText('#peopleCount', `顯示 ${rows.length} / ${totalInMode} 人`);
}

function renderRosterSummary() {
  const members = state.members || [];
  const registered = uniqueRegistrations().length;
  const box = $('#rosterSummary');
  box.innerHTML = '';
  box.append(
    statBlock('名冊人數', members.length, 'stat-teal'),
    statBlock('已報名', registered, 'stat-amber'),
    statBlock('未報名', Math.max(members.length - registered, 0), 'stat-coral')
  );
}

function renderDataCheck() {
  const box = $('#dataCheckResult');
  if (!box) return;
  box.innerHTML = '';

  const issues = [];
  const members = state.members || [];
  const regs = state.registrations || [];
  const memberKeys = new Set();

  members.forEach((member) => {
    const key = normalizeKey(member.memberNo);
    if (!key) {
      issues.push({ title: '名冊缺少會員編號', item: member.name || '未命名' });
      return;
    }
    if (memberKeys.has(key)) {
      issues.push({ title: '名冊會員編號重複', item: `${member.name || '未命名'}（${member.memberNo}）` });
    }
    memberKeys.add(key);
  });

  const configIds = new Set((state.config.options || []).map((o) => o.id));
  const regKeys = new Set();
  regs.forEach((reg) => {
    const key = normalizeKey(reg.memberNo);
    if (!memberKeys.has(key)) {
      issues.push({ title: '報名資料找不到對應名冊', item: reg.memberNo });
    }
    if (regKeys.has(key)) {
      issues.push({ title: '同一會員重複報名', item: reg.memberNo });
    }
    regKeys.add(key);
    if (reg.idCard && !/^[A-Za-z][0-9]{9}$/.test(reg.idCard)) {
      issues.push({ title: '身分證字號不是 10 碼', item: `${reg.memberNo}：${reg.idCard}` });
    }
    if (reg.birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(reg.birthDate)) {
      issues.push({ title: '出生年月日格式異常', item: `${reg.memberNo}：${reg.birthDate}` });
    }
    const relationType = reg.relationType || 'self';
    if (relationType !== 'self') {
      if (!reg.guardianMemberNo || !memberKeys.has(normalizeKey(reg.guardianMemberNo))) {
        issues.push({ title: '親屬/未滿12歲找不到會員本人', item: `${reg.memberNo}：${reg.name || ''}` });
      } else {
        const guardianRegistered = regs.some(
          (r) => normalizeKey(r.memberNo) === normalizeKey(reg.guardianMemberNo) && (!r.relationType || r.relationType === 'self')
        );
        if (!guardianRegistered) {
          issues.push({ title: '會員本人尚未報名', item: `${reg.guardianName || reg.guardianMemberNo} 的 ${reg.name || reg.memberNo}` });
        }
      }
    }
    const stale = (reg.options || []).filter((id) => !configIds.has(id));
    if (stale.length > 0) {
      issues.push({ title: '報名選項已被刪除', item: `${reg.memberNo}：${stale.join('、')}` });
    }
  });

  const grouped = new Map();
  issues.forEach((issue) => {
    if (!grouped.has(issue.title)) grouped.set(issue.title, []);
    grouped.get(issue.title).push(issue.item);
  });

  if (grouped.size === 0) {
    box.append(
      el('div', { class: 'data-check-ok' },
        el('i', { 'data-lucide': 'circle-check-big' }),
        el('strong', {}, '未發現資料問題'),
        el('span', {}, `已檢查 ${members.length} 位名冊、${regs.length} 筆報名資料`)
      )
    );
  } else {
    grouped.forEach((items, title) => {
      box.append(
        el('div', { class: 'issue-card' },
          el('div', { class: 'issue-head' },
            el('strong', {}, title),
            el('span', { class: 'issue-count' }, `${items.length} 筆`)
          ),
          el('div', { class: 'issue-list' },
            items.slice(0, 20).map((item) => el('span', { class: 'issue-item' }, item))
          )
        )
      );
    });
    if (issues.length > 20) {
      box.append(el('p', { class: 'muted' }, `僅顯示前 20 筆，共 ${issues.length} 筆問題`));
    }
  }
  refreshIcons();
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

  const color = el('input', { type: 'color', value: option.color || '#0e9f8a', 'aria-label': '選項顏色' });
  const labelInput = el('input', { type: 'text', value: option.label || '', placeholder: '選項名稱', maxlength: '80' });
  const descInput = el('input', { type: 'text', value: option.desc || '', placeholder: '說明（選填）', maxlength: '160' });
  const removeBtn = el('button', { class: 'btn btn-danger', type: 'button', 'aria-label': '刪除選項' }, el('i', { 'data-lucide': 'trash-2' }));
  removeBtn.addEventListener('click', () => {
    row.remove();
    refreshIcons();
  });

  row.append(color, labelInput, descInput, removeBtn);
  editor.append(row);
  refreshIcons();
}

async function saveConfig() {
  const combineEventTime = (dateId, timeId) => {
    const date = $(dateId).value;
    if (!date) return '';
    const time = $(timeId).value || '17:30';
    return `${date}T${time}`;
  };

  const rows = $$('#optionEditor .option-row').map((row) => {
    const inputs = row.querySelectorAll('input');
    return {
      id: row.dataset.id || '',
      label: inputs[1].value.trim(),
      desc: inputs[2].value.trim(),
      color: inputs[0].value
    };
  });
  if (!rows.some((option) => option.label)) {
    toast('至少需要一個有名稱的活動選項', 'error');
    return;
  }

  const payload = {
    siteTitle: $('#siteTitle').value.trim(),
    eventTitle: $('#eventTitle').value.trim(),
    description: $('#description').value.trim(),
    startAt: combineEventTime('#startDate', '#startTime'),
    deadline: combineEventTime('#endDate', '#endTime'),
    qrUrl: $('#qrUrl').value.trim(),
    open: $('#openToggle').checked,
    options: rows.filter((option) => option.label)
  };
  if (!payload.siteTitle || !payload.eventTitle) {
    toast('請填寫名稱抬頭與活動標題', 'error');
    return;
  }

  try {
    await api('/api/admin/config', { method: 'POST', body: JSON.stringify(payload) });
    toast('設定已儲存');
    await reloadState();
    renderConfigForm();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function handleCsvFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    csvText = await file.text();
    const rows = parseCsv(csvText);
    if (rows.length < 2) {
      toast('CSV 需要至少一列標題與一列資料', 'error');
      return;
    }
    csvHeaders = rows[0].map((cell) => String(cell).trim());
    csvRows = rows.slice(1);
    renderCsvPreview();
  } catch {
    toast('無法讀取 CSV 檔案', 'error');
  }
}

function normalizeHeader(header) {
  return header.toLowerCase().replace(/[\s()（）_\-.]/g, '');
}

function detectMapping() {
  const mapping = {};
  const normalizedHeaders = csvHeaders.map(normalizeHeader);
  CSV_FIELDS.forEach(({ key }) => {
    const rules = DETECT_RULES[key].map(normalizeHeader);
    let matched = '';
    for (let i = 0; i < normalizedHeaders.length; i += 1) {
      if (rules.includes(normalizedHeaders[i])) {
        matched = csvHeaders[i];
        break;
      }
    }
    mapping[key] = matched;
  });
  return mapping;
}

function renderCsvPreview() {
  const box = $('#csvPreview');
  box.classList.remove('hidden');
  box.innerHTML = '';

  box.append(
    el('h3', {}, '欄位對應與預覽'),
    el('p', { class: 'muted', style: 'margin:0 0 12px' }, `偵測到 ${csvRows.length} 筆資料、${csvHeaders.length} 個欄位`)
  );

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
  if (csvRows.length > 6) {
    box.append(el('p', { class: 'preview-note' }, `僅顯示前 6 筆，全部 ${csvRows.length} 筆都會匯入`));
  }

  const mapping = detectMapping();
  const mappingGrid = el('div', { class: 'mapping-grid' });
  CSV_FIELDS.forEach(({ key, label }) => {
    const select = el('select', { id: `map-${key}` });
    select.append(el('option', { value: '' }, '不匯入'));
    csvHeaders.forEach((header) => {
      select.append(el('option', { value: header }, header));
    });
    if (mapping[key]) select.value = mapping[key];
    mappingGrid.append(el('label', { class: 'field' }, el('span', {}, label), select));
  });
  box.append(mappingGrid);

  const replaceLabel = el('label', { class: 'toggle-field', style: 'margin-bottom:14px' },
    el('span', {}, el('strong', {}, '取代現有名冊'), el('small', {}, '勾選後會以本次檔案取代名冊，並移除不在新名冊中的報名')),
    el('input', { id: 'replaceRoster', type: 'checkbox', role: 'switch' })
  );
  box.append(replaceLabel);

  const importBtn = el('button', { id: 'doImportBtn', class: 'btn btn-primary', type: 'button' },
    el('i', { 'data-lucide': 'file-up' }),
    el('span', {}, '確認匯入名冊')
  );
  importBtn.addEventListener('click', doImport);
  box.append(importBtn);
  refreshIcons();
}

async function doImport() {
  const mapping = {};
  CSV_FIELDS.forEach(({ key }) => {
    mapping[key] = $(`#map-${key}`).value;
  });
  if (!mapping.memberNo) {
    toast('請先指定「會員編號」欄位', 'error');
    return;
  }

  const button = $('#doImportBtn');
  button.disabled = true;
  try {
    const result = await api('/api/admin/import', {
      method: 'POST',
      body: JSON.stringify({
        csv: csvText,
        mapping,
        replace: $('#replaceRoster').checked
      })
    });
    const removedNote = result.removedRegistrations ? `，移除 ${result.removedRegistrations} 筆不在新名冊的報名` : '';
    const message = `匯入完成：新增 ${result.added} 筆、更新 ${result.updated} 筆、略過 ${result.skipped} 筆；名冊總數 ${result.total} 人${removedNote}`;
    const resultBox = el('p', { class: 'import-result' }, message);
    $('#csvPreview').append(resultBox);
    toast('名冊匯入成功');
    await reloadState();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    button.disabled = false;
  }
}

async function resetData(mode) {
  const label = mode === 'empty' ? '清空全部資料' : '重置範例資料';
  const message = mode === 'empty'
    ? '確定要清空名冊與全部報名資料嗎？此動作無法復原。'
    : '確定要重置為範例資料嗎？目前名冊與報名資料會被取代。';
  if (!window.confirm(message)) return;
  try {
    await api('/api/admin/reset', { method: 'POST', body: JSON.stringify({ mode }) });
    toast(`${label}完成`);
    await reloadState();
    renderConfigForm();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function exportOptionsCsv() {
  const regs = uniqueRegistrations();
  const rows = [['活動選項', '說明', '會員編號', '姓名', '部門', '手機']];
  (state.config.options || []).forEach((option) => {
    regs.forEach((reg) => {
      if ((reg.options || []).includes(option.id)) {
        const member = findMember(reg.memberNo);
        rows.push([
          option.label,
          option.desc || '',
          reg.memberNo,
          member ? member.name : '',
          member ? member.department : '',
          member ? member.phone : ''
        ]);
      }
    });
  });
  downloadCsv('活動選項報表.csv', rows.map((row) => row.map(csvCell).join(',')).join('\n'));
}

function exportPeopleCsv() {
  const regs = uniqueRegistrations();
  const regByMember = new Map(regs.map((reg) => [normalizeKey(reg.memberNo), reg]));
  const members = state.members || [];
  const list = peopleMode === 'registered'
    ? members.filter((m) => regByMember.has(normalizeKey(m.memberNo)))
    : members.filter((m) => !regByMember.has(normalizeKey(m.memberNo)));

  const headers = peopleMode === 'registered'
    ? ['會員編號', '姓名', '部門', '手機', 'Email', '報名對象', '會員本人', '身分證', '出生年月日(民國)', '參加選項', '報名時間']
    : ['會員編號', '姓名', '部門', '手機', 'Email'];
  const rows = [headers];
  list.forEach((member) => {
    if (peopleMode === 'registered') {
      const reg = regByMember.get(normalizeKey(member.memberNo));
      rows.push([
        member.memberNo,
        member.name,
        member.department,
        member.phone,
        member.email,
        relationLabel(reg.relationType),
        reg.guardianName ? `${reg.guardianName}（${reg.guardianMemberNo}）` : '',
        reg.idCard || '',
        reg.birthDate ? formatRocDate(reg.birthDate) : '',
        registrationOptions(reg),
        formatDateTime(reg.submittedAt)
      ]);
    } else {
      rows.push([member.memberNo, member.name, member.department, member.phone, member.email]);
    }
  });
  const filename = peopleMode === 'registered' ? '已報名人員清冊.csv' : '未報名人員清冊.csv';
  downloadCsv(filename, rows.map((row) => row.map(csvCell).join(',')).join('\n'));
}

async function showApp() {
  $('#loginScreen').classList.add('hidden');
  $('#app').classList.remove('hidden');
  refreshIcons();
  await refreshState();
  renderConfigForm();
  setInterval(() => {
    if (!document.hidden) refreshState();
  }, 15000);
}

function showLogin() {
  $('#app').classList.add('hidden');
  $('#loginScreen').classList.remove('hidden');
  refreshIcons();
}

async function handleAdminLogin(event) {
  event.preventDefault();
  const errorBox = $('#adminLoginError');
  errorBox.classList.add('hidden');
  try {
    await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: $('#adminPassword').value })
    });
    await showApp();
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove('hidden');
  }
}

function toast(message, type = 'ok') {
  const box = el('div', { class: `toast ${type}`, textContent: message });
  document.body.append(box);
  setTimeout(() => box.remove(), 2600);
}

initAdmin();
