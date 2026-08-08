'use strict';

const http = require('http');
const fsp = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const DATA_FILE = process.env.DATA_FILE || path.join(DATA_DIR, 'state.json');
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Wishadmin';
const COOKIE_SECURE = process.env.COOKIE_SECURE === '1';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 3 * 1024 * 1024;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

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
    open: true,
    options: SAMPLE_OPTIONS.map((o) => ({ ...o }))
  };
}

function defaultState() {
  return {
    mode: 'roster',
    config: defaultConfig(),
    members: SAMPLE_MEMBERS.map((m) => ({ ...m })),
    registrations: SAMPLE_REGISTRATIONS.map((r) => ({ ...r })),
    admin: null
  };
}

function normalizeKey(value) {
  return String(value || '').trim().toUpperCase();
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeEventTime(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return `${text}T17:30`;
  return text;
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function parseCookies(req) {
  const result = {};
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const index = part.indexOf('=');
    if (index > 0) {
      result[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return result;
}

function sessionCookie(token, maxAgeSeconds) {
  const secure = COOKIE_SECURE ? '; Secure' : '';
  return `reg_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const chunks = [];
    let size = 0;
    const fail = (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    };
    req.on('data', (chunk) => {
      if (settled) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        fail(httpError(413, '資料超過大小限制'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch {
        reject(httpError(400, 'JSON 格式錯誤'));
      }
    });
    req.on('error', fail);
  });
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
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => String(cell).trim() !== ''));
}

function createAdminRecord() {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(ADMIN_PASSWORD, salt, 64).toString('hex');
  return { salt, hash };
}

function checkPassword(state, password) {
  const candidate = crypto.scryptSync(String(password || ''), state.admin.salt, 64);
  const stored = Buffer.from(state.admin.hash, 'hex');
  return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
}

function sanitizeText(value, fallback = '', max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : fallback;
}

function sanitizeConfig(input, current) {
  const next = {
    siteTitle: sanitizeText(input.siteTitle, current.siteTitle, 80),
    eventTitle: sanitizeText(input.eventTitle, current.eventTitle, 120),
    description: sanitizeText(input.description, current.description, 1000),
    startAt: normalizeEventTime(typeof input.startAt === 'string' ? input.startAt : current.startAt),
    deadline: normalizeEventTime(typeof input.deadline === 'string' ? input.deadline : current.deadline),
    qrUrl: sanitizeText(input.qrUrl, current.qrUrl || '', 500),
    open: Boolean(input.open),
    options: Array.isArray(input.options) && input.options.length > 0 ? [] : current.options.map((o) => ({ ...o }))
  };

  if (next.qrUrl) {
    try {
      const parsedQrUrl = new URL(next.qrUrl);
      if (!/^https?:$/.test(parsedQrUrl.protocol)) {
        throw new Error('unsupported protocol');
      }
    } catch {
      throw httpError(400, 'QR 網址格式不正確');
    }
  }
  if (next.startAt && Number.isNaN(Date.parse(next.startAt))) {
    throw httpError(400, '活動開始時間格式不正確');
  }
  if (next.deadline && Number.isNaN(Date.parse(next.deadline))) {
    throw httpError(400, '活動截止時間格式不正確');
  }
  if (next.startAt && next.deadline && Date.parse(next.startAt) > Date.parse(next.deadline)) {
    throw httpError(400, '活動開始時間不能晚於截止時間');
  }

  if (Array.isArray(input.options) && input.options.length > 0) {
    const palette = ['#003d79', '#f26522', '#1f6fb2', '#ffb400', '#0e9f8a', '#b04a9e'];
    const used = new Set();
    input.options.forEach((option, index) => {
      const label = sanitizeText(option && option.label, '', 80);
      if (!label) return;
      let id = sanitizeText(option && option.id, '', 40);
      if (!id || used.has(id)) id = `opt${index + 1}`;
      used.add(id);
      next.options.push({
        id,
        label,
        desc: sanitizeText(option && option.desc, '', 160),
        color: sanitizeText(option && option.color, palette[index % palette.length], 30)
      });
    });
    if (next.options.length === 0) {
      throw httpError(400, '活動選項至少需要一項');
    }
  }

  return next;
}

function publicPayload(state) {
  return {
    config: state.config,
    hasRoster: state.mode === 'roster',
    serverTime: new Date().toISOString()
  };
}

function adminPayload(state) {
  return {
    config: state.config,
    members: state.members,
    registrations: state.registrations,
    serverTime: new Date().toISOString()
  };
}

function importMembers(state, csvText, mapping, replace) {
  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    throw httpError(400, 'CSV 需要至少一列標題與一列資料');
  }

  const headers = rows[0].map((h) => String(h).trim());
  const headerIndex = new Map(headers.map((h, i) => [h, i]));
  const fields = ['memberNo', 'name', 'phone', 'department', 'email'];

  for (const field of fields) {
    const col = mapping[field];
    if (col && !headerIndex.has(String(col).trim())) {
      throw httpError(400, `找不到欄位「${col}」`);
    }
  }

  const pick = (row, field) => {
    const col = mapping[field];
    if (!col) return '';
    const index = headerIndex.get(String(col).trim());
    return index == null ? '' : String(row[index] || '').trim();
  };

  const seen = new Set();
  const imported = [];
  let skipped = 0;

  for (let r = 1; r < rows.length; r += 1) {
    const memberNo = pick(rows[r], 'memberNo');
    if (!memberNo) {
      skipped += 1;
      continue;
    }
    const key = normalizeKey(memberNo);
    if (seen.has(key)) {
      skipped += 1;
      continue;
    }
    seen.add(key);
    imported.push({
      memberNo,
      name: pick(rows[r], 'name'),
      phone: pick(rows[r], 'phone'),
      department: pick(rows[r], 'department'),
      email: pick(rows[r], 'email')
    });
  }

  if (imported.length === 0) {
    throw httpError(400, '沒有可匯入的資料，請確認「會員編號」欄位');
  }

  let added = 0;
  let updated = 0;
  let removedRegistrations = 0;

  if (replace) {
    const newKeys = new Set(imported.map((m) => normalizeKey(m.memberNo)));
    const before = state.registrations.length;
    state.registrations = state.registrations.filter((reg) => newKeys.has(normalizeKey(reg.memberNo)));
    removedRegistrations = before - state.registrations.length;
    state.members = imported;
    added = imported.length;
  } else {
    const existing = new Map(state.members.map((m) => [normalizeKey(m.memberNo), m]));
    const merged = [...state.members];
    for (const member of imported) {
      const key = normalizeKey(member.memberNo);
      const old = existing.get(key);
      if (old) {
        Object.assign(old, member);
        updated += 1;
      } else {
        merged.push(member);
        added += 1;
      }
    }
    state.members = merged;
  }
  state.mode = 'roster';

  return {
    added,
    updated,
    skipped,
    replaced: Boolean(replace),
    removedRegistrations,
    total: state.members.length
  };
}

let state = null;
let writeChain = Promise.resolve();
const sessions = new Map();

async function saveState() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(state, null, 2), 'utf8');
  await fsp.rename(tmp, DATA_FILE);
}

function mutate(mutator) {
  const task = writeChain.then(async () => {
    const result = await mutator(state);
    await saveState();
    return result;
  });
  writeChain = task.catch(() => {});
  return task;
}

async function initState() {
  try {
    state = JSON.parse(await fsp.readFile(DATA_FILE, 'utf8'));
  } catch {
    state = defaultState();
    await saveState();
  }
  if (!state.admin || process.env.ADMIN_PASSWORD) {
    state.admin = createAdminRecord();
    await saveState();
  }
  if (!state.config || !Array.isArray(state.config.options) || state.config.options.length === 0) {
    state.config = defaultConfig();
    await saveState();
  }
  if (typeof state.config.startAt !== 'string') {
    state.config.startAt = '';
  }
  if (typeof state.mode !== 'string') {
    state.mode = state.members.length > 0 ? 'roster' : 'manual';
  }
  state.members = Array.isArray(state.members) ? state.members : [];
  state.registrations = Array.isArray(state.registrations) ? state.registrations : [];
}

function isAdminRequest(req) {
  const token = parseCookies(req).reg_session;
  if (!token) return false;
  const session = sessions.get(token);
  if (!session) return false;
  if (session.expires < Date.now()) {
    sessions.delete(token);
    return false;
  }
  session.expires = Date.now() + SESSION_TTL_MS;
  return true;
}

function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

async function handleRegister(req, res, body) {
  if (!originAllowed(req)) {
    return sendError(res, 403, '請求來源不被允許');
  }

  const cfg = state.config;
  if (!cfg.open) {
    return sendError(res, 403, '報名目前已關閉');
  }
  if (cfg.startAt && Date.parse(cfg.startAt) > Date.now()) {
    return sendError(res, 403, '報名尚未開始，請於開始時間後再送出');
  }
  if (cfg.deadline && Date.parse(cfg.deadline) <= Date.now()) {
    return sendError(res, 403, '報名已截止，無法再送出');
  }

  const name = sanitizeText(body.name, '', 80);
  const phone = sanitizeText(body.phone, '', 40);
  const email = sanitizeText(body.email, '', 120);
  const idCard = sanitizeText(body.idCard, '', 20);
  const birthDate = sanitizeText(body.birthDate, '', 10);
  const relationType = ['self', 'family', 'child'].includes(body.relationType) ? body.relationType : 'self';
  const guardianName = sanitizeText(body.guardianName, '', 80);
  const guardianPhone = sanitizeText(body.guardianPhone, '', 40);
  if (!name) {
    return sendError(res, 400, '請輸入姓名');
  }
  if (idCard && !/^[A-Za-z][0-9]{9}$/.test(idCard)) {
    return sendError(res, 400, '身分證字號需為 10 碼（1 個英文字母 + 9 個數字）');
  }
  if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return sendError(res, 400, '出生年月日格式不正確');
  }
  if (birthDate) {
    const [year, month, day] = birthDate.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      return sendError(res, 400, '出生年月日格式不正確');
    }
  }
  if (relationType !== 'self' && !guardianName) {
    return sendError(res, 400, '親屬或未滿12歲報名需填寫會員本人姓名');
  }

  const options = Array.isArray(body.options)
    ? [...new Set(body.options.map((o) => String(o).trim()).filter(Boolean))]
    : [];
  const validIds = new Set(cfg.options.map((o) => o.id));
  if (options.some((id) => !validIds.has(id))) {
    return sendError(res, 400, '包含不存在的活動選項，請重新整理後再試');
  }
  if (options.length === 0) {
    return sendError(res, 400, '請選擇一個參加選項');
  }
  if (options.length > 1) {
    return sendError(res, 400, '報名選項僅能選擇一項');
  }

  const result = await mutate(() => {
    const members = state.members;
    let member = null;
    let guardian = null;

    if (relationType === 'self') {
      if (state.mode === 'roster') {
        const nameMatches = members.filter(
          (m) => m.name && normalizeKey(m.name) === normalizeKey(name)
        );
        if (nameMatches.length === 0) {
          throw httpError(404, '此姓名不在名冊中');
        }
        if (nameMatches.length === 1) {
          member = nameMatches[0];
        } else {
          const phoneMatches = nameMatches.filter(
            (m) => m.phone && normalizePhone(m.phone) === normalizePhone(phone)
          );
          if (phoneMatches.length === 1) {
            member = phoneMatches[0];
          } else {
            throw httpError(400, '名冊中有同名會員，請輸入正確的手機號碼');
          }
        }
      } else {
        member = { memberNo: '', name, phone, email, idCard, birthDate, department: '' };
        const existingManual = members.find(
          (m) =>
            m.memberNo.startsWith('M-') &&
            normalizeKey(m.name) === normalizeKey(name) &&
            (!phone || (m.phone && normalizePhone(m.phone) === normalizePhone(phone)))
        );
        if (existingManual) {
          Object.assign(existingManual, member);
          member = existingManual;
        } else {
          member.memberNo = `M-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          state.members.push(member);
        }
      }
    } else {
      const guardianCandidates = members.filter(
        (m) => m.name && normalizeKey(m.name) === normalizeKey(guardianName)
      );
      if (state.mode === 'roster') {
        if (guardianCandidates.length === 0) {
          throw httpError(404, '找不到會員本人，請確認姓名');
        }
      } else {
        const selfKeys = new Set(
          state.registrations
            .filter((r) => !r.relationType || r.relationType === 'self')
            .map((r) => normalizeKey(r.memberNo))
        );
        const registeredCandidates = guardianCandidates.filter((m) => selfKeys.has(normalizeKey(m.memberNo)));
        if (registeredCandidates.length === 0) {
          throw httpError(403, '會員本人尚未完成報名，請先由會員本人報名');
        }
        guardianCandidates.length = 0;
        registeredCandidates.forEach((m) => guardianCandidates.push(m));
      }

      if (guardianCandidates.length === 1) {
        guardian = guardianCandidates[0];
      } else {
        const phoneMatches = guardianCandidates.filter(
          (m) => m.phone && normalizePhone(m.phone) === normalizePhone(guardianPhone)
        );
        if (phoneMatches.length === 1) {
          guardian = phoneMatches[0];
        } else {
          throw httpError(400, '名冊中有同名會員，請輸入正確的會員本人手機號碼');
        }
      }

      const guardianRegistered = state.registrations.some(
        (r) => normalizeKey(r.memberNo) === normalizeKey(guardian.memberNo) && (!r.relationType || r.relationType === 'self')
      );
      if (!guardianRegistered) {
        throw httpError(403, '會員本人尚未完成報名，請先由會員本人報名');
      }

      member = members.find(
        (m) =>
          m.memberNo.startsWith('D-') &&
          normalizeKey(m.name) === normalizeKey(name) &&
          (!phone || (m.phone && normalizePhone(m.phone) === normalizePhone(phone)))
      );
      if (member) {
        Object.assign(member, { name, phone, email, idCard, birthDate });
      } else {
        member = {
          memberNo: `D-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name,
          phone,
          email,
          idCard,
          birthDate,
          department: ''
        };
        state.members.push(member);
      }
    }

    const optionLabels = {};
    for (const id of options) {
      const option = cfg.options.find((o) => o.id === id);
      optionLabels[id] = option ? option.label : id;
    }

    const now = new Date().toISOString();
    const registrationFields = {
      relationType,
      guardianMemberNo: relationType === 'self' ? '' : guardian.memberNo,
      guardianName: relationType === 'self' ? '' : guardian.name
    };
    const existingRegistration = state.registrations.find(
      (r) => normalizeKey(r.memberNo) === normalizeKey(member.memberNo)
    );
    if (existingRegistration) {
      existingRegistration.options = options;
      existingRegistration.optionLabels = optionLabels;
      existingRegistration.idCard = idCard;
      existingRegistration.birthDate = birthDate;
      existingRegistration.relationType = registrationFields.relationType;
      existingRegistration.guardianMemberNo = registrationFields.guardianMemberNo;
      existingRegistration.guardianName = registrationFields.guardianName;
      existingRegistration.submittedAt = now;
      return { ok: true, updated: true, submittedAt: now };
    }

    state.registrations.push({
      memberNo: member.memberNo,
      options,
      optionLabels,
      idCard,
      birthDate,
      relationType: registrationFields.relationType,
      guardianMemberNo: registrationFields.guardianMemberNo,
      guardianName: registrationFields.guardianName,
      submittedAt: now
    });
    return { ok: true, updated: false, submittedAt: now };
  });

  return sendJson(res, 200, result);
}

async function handleApi(req, res, url) {
  const method = req.method;
  const pathname = url.pathname;

  if (pathname === '/api/config' && method === 'GET') {
    return sendJson(res, 200, publicPayload(state));
  }

  if (pathname === '/api/register' && method === 'POST') {
    const body = await readJsonBody(req);
    return handleRegister(req, res, body);
  }

  if (pathname === '/api/admin/session') {
    return sendJson(res, 200, { authed: isAdminRequest(req) });
  }

  if (pathname === '/api/admin/login' && method === 'POST') {
    const body = await readJsonBody(req);
    if (!checkPassword(state, body.password)) {
      return sendError(res, 401, '帳號或密碼錯誤');
    }
    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, { expires: Date.now() + SESSION_TTL_MS });
    res.setHeader('Set-Cookie', sessionCookie(token, Math.floor(SESSION_TTL_MS / 1000)));
    return sendJson(res, 200, { ok: true });
  }

  if (pathname === '/api/admin/logout' && method === 'POST') {
    const token = parseCookies(req).reg_session;
    if (token) sessions.delete(token);
    res.setHeader('Set-Cookie', 'reg_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return sendJson(res, 200, { ok: true });
  }

  if (!pathname.startsWith('/api/admin/')) {
    return sendError(res, 404, '找不到此 API');
  }
  if (!isAdminRequest(req)) {
    return sendError(res, 401, '請先登入後台');
  }
  if (!originAllowed(req)) {
    return sendError(res, 403, '請求來源不被允許');
  }

  if (pathname === '/api/admin/state' && method === 'GET') {
    return sendJson(res, 200, adminPayload(state));
  }

  if (pathname === '/api/admin/config' && method === 'POST') {
    const body = await readJsonBody(req);
    const result = await mutate((current) => {
      current.config = sanitizeConfig(body, current.config);
      return { ok: true, config: current.config };
    });
    return sendJson(res, 200, result);
  }

  if (pathname === '/api/admin/import' && method === 'POST') {
    const body = await readJsonBody(req);
    const result = await mutate((current) => importMembers(current, body.csv, body.mapping || {}, Boolean(body.replace)));
    return sendJson(res, 200, result);
  }

  if (pathname === '/api/admin/reset' && method === 'POST') {
    const body = await readJsonBody(req);
    const result = await mutate((current) => {
      if (body.mode === 'empty') {
        current.config = defaultConfig();
        current.members = [];
        current.registrations = [];
        current.mode = 'manual';
      } else {
        const fresh = defaultState();
        current.config = fresh.config;
        current.members = fresh.members;
        current.registrations = fresh.registrations;
        current.mode = 'roster';
      }
      return { ok: true };
    });
    return sendJson(res, 200, result);
  }

  return sendError(res, 404, '找不到此 API');
}

async function serveStatic(req, res, pathname) {
  const alias = { '/': '/index.html', '/admin': '/admin.html' };
  let relative = (alias[pathname] || pathname).replace(/^\/+/, '');
  try {
    relative = decodeURIComponent(relative);
  } catch {}
  const filePath = path.resolve(PUBLIC_DIR, relative);
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(`${PUBLIC_DIR}${path.sep}`)) {
    return sendError(res, 403, '禁止存取');
  }

  try {
    const data = await fsp.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  } catch {
    sendError(res, 404, '找不到頁面');
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url);
    } else {
      await serveStatic(req, res, url.pathname);
    }
  } catch (err) {
    if (!res.headersSent) {
      sendError(res, err.status || 500, err.message || '伺服器發生錯誤');
    } else {
      res.end();
    }
  }
});

initState()
  .then(() => {
    server.listen(PORT, HOST, () => {
      console.log(`報名系統已啟動: http://localhost:${PORT}`);
      console.log(`資料檔: ${DATA_FILE}`);
    });
  })
  .catch((err) => {
    console.error('啟動失敗:', err);
    process.exit(1);
  });
