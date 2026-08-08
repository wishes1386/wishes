'use strict';

let config = null;
let hasRoster = false;
let pendingPayload = null;

async function initApp() {
  try {
    const data = await api('/api/config');
    config = data.config;
    hasRoster = data.hasRoster;
    renderConfig();
    renderQrCode();
    refreshIcons();
    bindEvents();
  } catch (err) {
    showError(err.message);
  }
}

function renderQrCode() {
  const url = config && config.qrUrl
    ? config.qrUrl
    : (window.location.href || '').split('#')[0];
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

function renderConfig() {
  document.title = config.siteTitle || '報名統計系統';
  setText('#footerTitle', config.siteTitle);
  setText('#eventTitle', config.eventTitle);
  setText('#eventDesc', config.description);

  const startText = config.startAt ? formatDateTime(config.startAt) : '未設定開始時間';
  const deadlineText = config.deadline ? formatDateTime(config.deadline) : '未設定截止時間';
  setText('#startText', `報名開始：${startText}`);
  setText('#deadlineText', `報名截止：${deadlineText}`);

  const statusChip = $('#statusChip');
  const statusText = $('#statusText');
  const now = Date.now();
  const notStarted = config.startAt && new Date(config.startAt).getTime() > now;
  const ended = config.deadline && new Date(config.deadline).getTime() <= now;
  statusChip.classList.remove('status-live', 'status-wait', 'status-ended', 'status-closed');
  let statusLabel = '報名進行中';
  if (!config.open) {
    statusLabel = '報名已關閉';
  } else if (notStarted) {
    statusLabel = '報名尚未開始';
  } else if (ended) {
    statusLabel = '報名已截止';
  }
  statusText.textContent = statusLabel;
  if (statusLabel === '報名進行中') {
    statusChip.classList.add('status-live');
  } else if (statusLabel === '報名尚未開始') {
    statusChip.classList.add('status-wait');
  } else if (statusLabel === '報名已截止') {
    statusChip.classList.add('status-ended');
  } else {
    statusChip.classList.add('status-closed');
  }

  $('#manualFields').classList.toggle('hidden', hasRoster);

  const grid = $('#options');
  grid.innerHTML = '';
  config.options.forEach((option) => {
    const label = el('label', { class: 'option-card', style: `--opt-color:${option.color}` });
    const input = el('input', { type: 'radio', name: 'event-option', value: option.id });
    const body = el('span', { class: 'option-body' });
    body.append(el('span', { class: 'option-title' }, option.label));
    if (option.desc) {
      body.append(el('span', { class: 'option-desc' }, option.desc));
    }
    input.addEventListener('change', () => {
      label.classList.toggle('checked', input.checked);
    });
    label.append(input, body);
    grid.append(label);
  });
}

function bindEvents() {
  $('#regForm').addEventListener('submit', handleSubmit);
  $('#adminBtn').addEventListener('click', () => {
    $('#loginModal').classList.remove('hidden');
    setTimeout(() => $('#loginPassword').focus(), 30);
  });
  $('#loginClose').addEventListener('click', () => {
    $('#loginModal').classList.add('hidden');
    hideLoginError();
  });
  $('#loginModal').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      $('#loginModal').classList.add('hidden');
      hideLoginError();
    }
  });
  $('#loginForm').addEventListener('submit', handleLogin);
  $('#confirmClose').addEventListener('click', closeConfirm);
  $('#confirmBack').addEventListener('click', closeConfirm);
  $('#confirmSubmit').addEventListener('click', submitPending);
  $('#confirmModal').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeConfirm();
  });
  $$('input[name="relationType"]').forEach((input) => {
    input.addEventListener('change', () => {
      const needGuardian = input.checked && input.value !== 'self';
      $('#guardianField').classList.toggle('hidden', !needGuardian);
    });
  });
}

async function handleSubmit(event) {
  event.preventDefault();
  hideError();

  const name = $('#memberName').value.trim();
  const phone = $('#memberPhone').value.trim();
  const email = $('#memberEmail').value.trim();
  const idCard = $('#memberId').value.trim();
  const birthText = $('#memberBirth').value.trim();
  const birthDate = birthText ? parseRocDateToIso(birthText) : '';
  const relationType = ($('input[name="relationType"]:checked') || { value: 'self' }).value;
  const guardianName = $('#guardianName').value.trim();
  const guardianPhone = $('#guardianPhone').value.trim();
  const options = $$('#options input:checked').map((input) => input.value);

  if (!name) {
    showError('請輸入姓名');
    return;
  }
  if (options.length === 0) {
    showError('請選擇一個參加選項');
    return;
  }
  if (idCard && !/^[A-Za-z][0-9]{9}$/.test(idCard)) {
    showError('身分證字號需為 10 碼（1 個英文字母 + 9 個數字）');
    return;
  }
  if (birthText && !birthDate) {
    showError('出生年月日格式不正確，請輸入民國年，例如 113/05/20');
    return;
  }
  if (relationType !== 'self' && !guardianName) {
    showError('親屬或未滿12歲報名需填寫會員本人姓名');
    return;
  }

  const payload = { name, phone, email, idCard, birthDate, relationType, guardianName, guardianPhone, options };
  if (idCard || birthDate || relationType !== 'self') {
    showConfirm(payload);
  } else {
    await submitRegistration(payload);
  }
}

async function submitRegistration(payload) {
  const button = $('#submitBtn');
  button.disabled = true;
  button.querySelector('span').textContent = '送出中…';
  try {
    const result = await api('/api/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    showResult(result, payload);
  } catch (err) {
    showError(err.message);
  } finally {
    button.disabled = false;
    button.querySelector('span').textContent = '確認送出報名';
  }
}

function showConfirm(payload) {
  pendingPayload = payload;
  const summary = $('#confirmSummary');
  summary.innerHTML = '';
  const selectedLabels = payload.options
    .map((id) => {
      const option = config.options.find((o) => o.id === id);
      return option ? option.label : id;
    })
    .join('、');
  const rows = [
    ['姓名', payload.name],
    ['手機', payload.phone || '未填寫'],
    ['身分證', payload.idCard || '未填寫'],
    ['出生年月日（民國）', payload.birthDate ? formatRocDate(payload.birthDate) : '未填寫'],
    ['報名對象', relationLabel(payload.relationType)],
    ['會員本人', payload.guardianName || '—'],
    ['參加選項', selectedLabels]
  ];
  rows.forEach(([label, value]) => {
    summary.append(el('div', { class: 'confirm-row' }, el('span', {}, label), el('strong', {}, value)));
  });
  $('#confirmModal').classList.remove('hidden');
  refreshIcons();
}

function relationLabel(relationType) {
  if (relationType === 'family') return '親屬';
  if (relationType === 'child') return '未滿12歲';
  return '會員本人';
}

function closeConfirm() {
  $('#confirmModal').classList.add('hidden');
}

async function submitPending() {
  closeConfirm();
  await submitRegistration(pendingPayload);
}

function showResult(result, submitted) {
  const box = $('#result');
  box.classList.remove('hidden');
  box.innerHTML = '';

  const selectedLabels = submitted.options
    .map((id) => {
      const option = config.options.find((o) => o.id === id);
      return option ? option.label : id;
    })
    .join('、');

  const tags = el('div', { class: 'result-tags' });
  submitted.options.forEach((id) => {
    const option = config.options.find((o) => o.id === id);
    if (option) tags.append(el('span', { class: 'result-tag' }, option.label));
  });

  box.append(
    el('div', { class: 'result-head' }, el('i', { 'data-lucide': 'circle-check-big' }), result.updated ? '報名已更新' : '報名成功'),
    el('p', {}, `姓名：${submitted.name}${submitted.phone ? `｜手機：${submitted.phone}` : ''}`),
    el('p', {}, `報名對象：${relationLabel(submitted.relationType)}${submitted.guardianName ? `｜會員本人：${submitted.guardianName}` : ''}`),
    el('p', {}, `出生年月日：${submitted.birthDate ? formatRocDate(submitted.birthDate) : '未填寫'}`),
    el('p', {}, `送出時間：${formatDateTime(result.submittedAt)}`),
    el('p', {}, `參加選項：${selectedLabels}`),
    tags
  );
  refreshIcons();
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function handleLogin(event) {
  event.preventDefault();
  hideLoginError();
  try {
    await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: $('#loginPassword').value })
    });
    window.location.href = '/admin';
  } catch (err) {
    const errorBox = $('#loginError');
    errorBox.textContent = err.message;
    errorBox.classList.remove('hidden');
  }
}

function showError(message) {
  const errorBox = $('#formError');
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
  errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideError() {
  $('#formError').classList.add('hidden');
}

function hideLoginError() {
  $('#loginError').classList.add('hidden');
}

initApp();
