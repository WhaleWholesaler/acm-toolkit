/* ================= ACM 账号同步（个人 / 团队） =================
   零依赖：状态存 localStorage，服务端只做鉴权与版本控制，客户端负责合并。
   同步键：技能树进度 / 模板关联 / 各方向的抽题批次与设置 / 个人方向 / 主题等偏好 */
(function () {
'use strict';

const API_KEY = 'acm_sync_api', TOKEN_KEY = 'acm_sync_token', USER_KEY = 'acm_sync_user',
  SPACE_KEY = 'acm_sync_space', DEVICE_KEY = 'acm_sync_device', META_KEY = 'acm_sync_meta';
const SYNC_KEYS = ['acm_skilltree_v2', 'acm_link_map', 'acm_skilltree_picks', 'acm_skilltree_current',
  'acm_skilltree_scope', 'acm_skilltree_direction', 'skilltree_theme', 'codeTheme'];
const PUSH_DELAY = 2500, POLL_MS = 1500, PULL_MS = 120000;

const ls = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };
const lsDel = k => { try { localStorage.removeItem(k); } catch (e) { } };

let token = ls(TOKEN_KEY) || '';
let user = null; try { user = JSON.parse(ls(USER_KEY) || 'null'); } catch (e) { }
let space = ls(SPACE_KEY) || '';
let spaces = [];
let device = ls(DEVICE_KEY);
if (!device) { device = Math.random().toString(36).slice(2) + Date.now().toString(36); lsSet(DEVICE_KEY, device); }
let meta = {}; try { meta = JSON.parse(ls(META_KEY) || '{}'); } catch (e) { }
let baseRev = 0, status = 'idle', applying = false, dirty = false, pushing = false;
let lastSync = 0, pushTimer = null, retryTimer = null, snap = null, modal = null, health = null;

const apiBase = () => String((window.ACM_SYNC_API !== undefined && window.ACM_SYNC_API) || ls(API_KEY) || '').replace(/\/+$/, '');

/* ---------------- 工具：稳定序列化 / 哈希 ---------------- */
function sortObj(o) {
  if (Array.isArray(o)) return o.map(sortObj);
  if (o && typeof o === 'object') { const r = {}; Object.keys(o).sort().forEach(k => r[k] = sortObj(o[k])); return r; }
  return o;
}
function canon(v) {
  if (v == null) return null;
  try { return JSON.stringify(sortObj(JSON.parse(v))); } catch (e) { return v; }
}
function strHash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
function logKey(l) {
  if (l && l.id) return String(l.id);
  return 'L' + strHash([(l && l.p) || '', (l && l.r) || '', (l && l.d) || '', (l && l.how) || ''].join('|'));
}
const parse = s => { if (s == null) return null; if (typeof s === 'object') return s; try { return JSON.parse(s); } catch (e) { return null; } };

/* ---------------- 合并：技能树 ---------------- */
function fieldAt(x, key) { const v = Number(x && x[key]); return Number.isFinite(v) && v > 0 ? v : 0; }
function pickField(x, y, field, atKey, cmp) {
  const xv = x[field], yv = y[field];
  if (xv === yv) return xv;
  if (xv === undefined) return yv;
  if (yv === undefined) return xv;
  const xa = fieldAt(x, atKey), ya = fieldAt(y, atKey);
  if (xa !== ya) return xa > ya ? xv : yv;
  return cmp ? cmp(xv, yv) : xv;
}
function mergeTreeState(a, b) {
  if (!a) return b;
  if (!b) return a;
  const an = a.nodes || {}, bn = b.nodes || {};
  const out = { ver: 2, nodes: {}, collapsed: {}, sel: null, at: Math.max(a.at || 0, b.at || 0) };
  const ids = new Set(Object.keys(an).concat(Object.keys(bn)));
  ids.forEach(id => {
    const x = an[id], y = bn[id];
    if (!x) { out.nodes[id] = y; return; }
    if (!y) { out.nodes[id] = x; return; }
    const logs = new Map();
    [x, y].forEach(src => (src.logs || []).forEach(l => {
      const k = logKey(l), cur = logs.get(k);
      if (!cur || (l.at || 0) > (cur.at || 0)) logs.set(k, Object.assign({}, l, { id: l.id || k.replace(/^L/, '') }));
    }));
    out.nodes[id] = {
      level: pickField(x, y, 'level', 'lvlAt', (p, q) => Math.max(Number(p) || 0, Number(q) || 0)),
      target: pickField(x, y, 'target', 'tgtAt', (p, q) => Math.max(Number(p) || 0, Number(q) || 0)),
      note: pickField(x, y, 'note', 'noteAt', (p, q) => {
        const sp = String(p || ''), sq = String(q || '');
        if ((sp ? 1 : 0) !== (sq ? 1 : 0)) return sp ? p : q;
        if (sp.length !== sq.length) return sp.length > sq.length ? p : q;
        return sp >= sq ? p : q;
      }),
      lvlAt: Math.max(fieldAt(x, 'lvlAt'), fieldAt(y, 'lvlAt')),
      tgtAt: Math.max(fieldAt(x, 'tgtAt'), fieldAt(y, 'tgtAt')),
      noteAt: Math.max(fieldAt(x, 'noteAt'), fieldAt(y, 'noteAt')),
      at: Math.max(Number(x.at) || 0, Number(y.at) || 0),
      logs: Array.from(logs.values()).sort((p, q) => { const a = p.d || '', b = q.d || ''; return a < b ? -1 : a > b ? 1 : 0; })
    };
  });
  const fresh = (a.at || 0) >= (b.at || 0) ? a : b;
  out.collapsed = Object.assign({}, fresh.collapsed || {});
  out.sel = fresh.sel || null;
  return out;
}

/* ---------------- 合并：其它键 ---------------- */
function mergePicks(a, b) {
  const seen = new Set(), out = [];
  [].concat(a || [], b || []).forEach(x => {
    const k = typeof x === 'string' ? x : JSON.stringify(x);
    if (!seen.has(k) && out.length < 40) { seen.add(k); out.push(x); }
  });
  return out;
}
function mergeCurrentPicks(a, b) {
  const entries = doc => {
    if (doc && doc.ver === 2 && doc.byDir && typeof doc.byDir === 'object') return doc.byDir;
    return doc && Array.isArray(doc.ids) ? { all: doc } : {};
  };
  const left = entries(a), right = entries(b), out = { ver: 2, byDir: {}, at: 0 };
  for (const dir of ['all', 'g', 'm', 'd']) {
    const valid = e => e && typeof e === 'object' && Array.isArray(e.ids);
    const x = valid(left[dir]) ? left[dir] : null, y = valid(right[dir]) ? right[dir] : null;
    if (!x && !y) continue;
    const xa = fieldAt(x, 'at'), ya = fieldAt(y, 'at');
    // 同一方向整批选较新的；不同方向分别保留。时间相同也必须确定性收敛。
    out.byDir[dir] = !x ? y : !y ? x : xa !== ya ? (xa > ya ? x : y)
      : (JSON.stringify(sortObj(x)) >= JSON.stringify(sortObj(y)) ? x : y);
    out.at = Math.max(out.at, xa, ya);
  }
  return out;
}
function mergeLinks(a, b) {
  a = a || {}; b = b || {};
  const paths = Object.assign({}, a.paths || {}, b.paths || {});
  const nodes = {};
  for (const p of Object.keys(paths)) {
    const id = paths[p];
    if (!id) { delete paths[p]; continue; }
    (nodes[id] = nodes[id] || []).push(p);
  }
  return { paths, nodes };
}
function keysEquivalent(a, b) {
  const ka = Object.keys(a || {}), kb = Object.keys(b || {});
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!Object.prototype.hasOwnProperty.call(b || {}, k)) return false;
    if (canon(a[k]) !== canon(b[k])) return false;
  }
  return true;
}
function mergeDocs(a, b) {
  if (!a) return b;
  if (!b) return a;
  const out = { v: 1, device, savedAt: Math.max(a.savedAt || 0, b.savedAt || 0), keys: {}, meta: {} };
  const ma = a.meta || {}, mb = b.meta || {};
  const keys = new Set(Object.keys(a.keys || {}).concat(Object.keys(b.keys || {})));
  keys.forEach(k => {
    const av = a.keys[k], bv = b.keys[k];
    if (av === undefined) { out.keys[k] = bv; return; }
    if (bv === undefined) { out.keys[k] = av; return; }
    if (k === 'acm_skilltree_v2') out.keys[k] = JSON.stringify(mergeTreeState(parse(av), parse(bv)));
    else if (k === 'acm_skilltree_picks') out.keys[k] = JSON.stringify(mergePicks(parse(av), parse(bv)));
    else if (k === 'acm_link_map') out.keys[k] = JSON.stringify(mergeLinks(parse(av), parse(bv)));
    else if (k === 'acm_skilltree_current') {
      out.keys[k] = JSON.stringify(mergeCurrentPicks(parse(av), parse(bv)));
    } else {
      const ta = ma[k] || 0, tb = mb[k] || 0;
      out.keys[k] = ta > tb ? av : (tb > ta ? bv : k === 'acm_skilltree_direction' && String(bv) > String(av) ? bv : av);
    }
  });
  Object.keys(ma).concat(Object.keys(mb)).forEach(k => { out.meta[k] = Math.max(ma[k] || 0, mb[k] || 0); });
  return out;
}

/* ---------------- 本地读写 ---------------- */
function collectDoc() {
  captureLocalChanges();
  const keys = {};
  SYNC_KEYS.forEach(k => { const v = ls(k); if (v !== null) keys[k] = v; });
  return { v: 1, device, savedAt: Date.now(), keys, meta: Object.assign({}, meta) };
}
function applyDoc(doc, replace) {
  applying = true;
  const changed = [];
  try {
    SYNC_KEYS.forEach(k => {
      const has = doc && doc.keys && Object.prototype.hasOwnProperty.call(doc.keys, k);
      if (has) {
        if (ls(k) !== doc.keys[k]) { lsSet(k, doc.keys[k]); changed.push(k); }
      } else if (replace && ls(k) !== null) {
        lsDel(k); changed.push(k);
      }
    });
    if (doc && doc.meta) { meta = Object.assign({}, doc.meta); lsSet(META_KEY, JSON.stringify(meta)); }
  } finally { applying = false; }
  snap = snapshot();
  if (changed.length) notifyChanged(changed);
  return changed;
}
function notifyChanged(keys) {
  if (keys.includes('codeTheme')) document.body.classList.toggle('theme-light', ls('codeTheme') === 'light');
  try { window.dispatchEvent(new CustomEvent('acm-sync-applied', { detail: { keys } })); } catch (e) { }
  const f = document.getElementById('treeFrame');
  if (f && f.contentWindow) { try { f.contentWindow.postMessage({ src: 'acm-bridge', type: 'stateChanged', keys }, '*'); } catch (e) { } }
}

/* ---------------- 网络 ---------------- */
async function api(method, p, payload, opts) {
  const res = await fetch(apiBase() + p, {
    method,
    headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
    body: payload ? JSON.stringify(payload) : undefined,
    keepalive: !!(opts && opts.keepalive)
  });
  let data = null; try { data = await res.json(); } catch (e) { }
  if (!res.ok) { const err = new Error((data && data.error) || ('HTTP ' + res.status)); err.status = res.status; err.data = data; throw err; }
  return data;
}

/* ---------------- 状态与推送 ---------------- */
function setStatus(s) {
  status = s; renderButton();
  if (!modal) return;
  const line = modal.querySelector('[data-status]');
  if (line) line.textContent = '状态：' + STATUS_TEXT[status] + ' · 上次同步：' + fmtTime(lastSync);
  else renderModal();
}
function markSynced() { lastSync = Date.now(); dirty = false; clearTimeout(pushTimer); pushTimer = null; }
function schedulePush(delay) {
  dirty = true;
  if (!token || !space) return;
  if (status !== 'syncing') setStatus(navigator.onLine ? 'pending' : 'offline');
  clearTimeout(pushTimer);
  pushTimer = setTimeout(doPush, delay == null ? PUSH_DELAY : delay);
}
async function doPush() {
  if (!token || !space || pushing) return;
  if (!navigator.onLine) { setStatus('offline'); return; }
  pushing = true;
  if (status !== 'syncing') setStatus('syncing');
  try {
    for (let i = 0; i < 3; i++) {
      const doc = collectDoc();
      try {
        const r = await api('PUT', '/api/spaces/' + encodeURIComponent(space) + '/state', { baseRev, doc });
        baseRev = r.rev; markSynced(); setStatus('ok');
        return;
      } catch (e) {
        if (e.status !== 409) throw e;
        const merged = mergeDocs(doc, e.data.doc || { v: 1, keys: {}, meta: {} });
        applyDoc(merged);
        baseRev = e.data.rev;
      }
    }
    setStatus('error');
  } catch (e) {
    if (e.status === 401) { clearAuth(); setStatus('auth'); }
    else { setStatus(navigator.onLine ? 'error' : 'offline'); scheduleRetry(); }
  } finally { pushing = false; }
}
function scheduleRetry() { clearTimeout(retryTimer); retryTimer = setTimeout(() => { if (dirty) doPush(); }, 8000); }
async function doPull(silent) {
  if (!token || !space) return;
  if (!navigator.onLine) { setStatus('offline'); return; }
  if (status !== 'syncing') setStatus('syncing');
  try {
    const r = await api('GET', '/api/spaces/' + encodeURIComponent(space) + '/state');
    baseRev = r.rev;
    if (r.doc) {
      const merged = mergeDocs(collectDoc(), r.doc);
      applyDoc(merged);
      // 只比较业务 keys（device/savedAt/meta 属环境元数据，否则会跨设备无限互推）
      if (!keysEquivalent(merged.keys, r.doc.keys)) { dirty = true; await doPush(); return; }
    } else {
      dirty = true; await doPush(); return;
    }
    markSynced(); setStatus('ok');
  } catch (e) {
    if (e.status === 401) { clearAuth(); setStatus('auth'); }
    else { setStatus(navigator.onLine ? 'error' : 'offline'); scheduleRetry(); }
  }
}
function syncNow() { return dirty ? doPush() : doPull(); }

/* ---------------- 本地变更监听 ---------------- */
function snapshot() {
  const o = {};
  SYNC_KEYS.forEach(k => { o[k] = canon(ls(k)); });
  return o;
}
function captureLocalChanges() {
  const now = snapshot();
  let changed = false;
  if (snap && token && !applying) {
    SYNC_KEYS.forEach(k => {
      if (now[k] !== snap[k]) {
        meta[k] = Math.max(Date.now(), (Number(meta[k]) || 0) + 1); changed = true;
      }
    });
    if (changed) lsSet(META_KEY, JSON.stringify(meta));
  }
  snap = now;
  return changed;
}
function watch() { if (captureLocalChanges()) schedulePush(); }
setInterval(watch, POLL_MS);
window.addEventListener('storage', e => {
  if (e.key === null || SYNC_KEYS.includes(e.key)) schedulePush(400);
});

/* ---------------- 登录 / 空间 ---------------- */
function saveAuth() {
  token ? lsSet(TOKEN_KEY, token) : lsDel(TOKEN_KEY);
  user ? lsSet(USER_KEY, JSON.stringify(user)) : lsDel(USER_KEY);
}
function clearAuth() { token = ''; user = null; spaces = []; space = ''; lsDel(TOKEN_KEY); lsDel(USER_KEY); lsDel(SPACE_KEY); }
async function afterLogin() {
  const me = await api('GET', '/api/me');
  user = me.user; spaces = me.spaces || []; saveAuth();
  if (!space || !spaces.some(s => s.id === space)) { space = spaces.length ? spaces[0].id : ''; space ? lsSet(SPACE_KEY, space) : lsDel(SPACE_KEY); }
  await doPull();
  renderButton(); if (modal) renderModal();
}
async function login(name, pass) {
  const r = await api('POST', '/api/login', { username: name, password: pass });
  token = r.token; user = r.user; spaces = r.spaces || []; saveAuth();
  await afterLogin();
}
async function register(name, pass, invite) {
  const r = await api('POST', '/api/register', { username: name, password: pass, invite: invite || undefined });
  token = r.token; user = r.user; spaces = r.spaces || []; saveAuth();
  await afterLogin();
}
async function logout(remote) {
  if (remote !== false && token) { try { await api('POST', '/api/logout'); } catch (e) { } }
  clearAuth(); setStatus('idle'); renderButton();
}
async function switchSpace(id) {
  if (id === space) return;
  setStatus('syncing');
  if (dirty) {
    await doPush();
    if (dirty) {
      setStatus('error');
      if (typeof toast === 'function') toast('当前空间还有未同步的改动，已取消切换', true);
      return;
    }
  }
  space = id; lsSet(SPACE_KEY, space);
  // 先清空本地同步键：空空间从零开始，避免把个人数据播种进团队空间
  applying = true;
  try { SYNC_KEYS.forEach(k => lsDel(k)); } finally { applying = false; }
  snap = null;
  try {
    const r = await api('GET', '/api/spaces/' + encodeURIComponent(space) + '/state');
    baseRev = r.rev;
    if (r.doc) { applyDoc(r.doc, true); markSynced(); setStatus('ok'); }
    else { notifyChanged(['acm_skilltree_v2']); dirty = true; await doPush(); }
  } catch (e) {
    setStatus(e.status === 401 ? 'auth' : 'error');
    if (e.status === 401) clearAuth();
  }
  renderButton(); renderModal();
}
async function refreshSpaces() {
  const r = await api('GET', '/api/spaces');
  spaces = r.spaces || [];
  renderModal();
}

/* ---------------- 定时与生命周期 ---------------- */
setInterval(() => { if (token && space && Date.now() - lastSync > PULL_MS) doPull(true); }, 30000);
window.addEventListener('focus', () => { if (token && space && Date.now() - lastSync > 60000) doPull(true); });
window.addEventListener('online', () => { if (dirty) doPush(); else if (token) doPull(true); });
window.addEventListener('offline', () => setStatus('offline'));
window.addEventListener('beforeunload', () => {
  if (!dirty || !token || !space) return;
  try {
    // keepalive 请求体上限约 64KB：进度很大时这次兜底可能失败，正常情况 2.5s 防抖已推送完成
    fetch(apiBase() + '/api/spaces/' + encodeURIComponent(space) + '/state', {
      method: 'PUT', keepalive: true,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ baseRev, doc: collectDoc() })
    });
  } catch (e) { }
});

/* ---------------- UI ---------------- */
const STATUS_TEXT = { idle: '未登录', syncing: '同步中…', ok: '已同步', pending: '待同步', error: '同步出错', offline: '离线', auth: '登录失效' };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function fmtTime(t) {
  if (!t) return '—';
  const d = new Date(t);
  return d.toLocaleString('zh-CN', { hour12: false });
}
function renderButton() {
  const b = document.getElementById('syncBtn');
  if (!b) return;
  const who = user ? user.name : '未登录';
  b.textContent = '☁ ' + who + ' · ' + STATUS_TEXT[status];
  b.classList.toggle('sync-ok', status === 'ok');
  b.classList.toggle('sync-bad', status === 'error' || status === 'auth');
}
function openSyncModal() {
  if (modal) return;
  modal = document.createElement('div');
  modal.className = 'sync-mask';
  modal.innerHTML = '<div class="sync-box"><h3>账号同步</h3><div id="syncBody"></div></div>';
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) closeSyncModal(); });
  renderModal();
  fetch(apiBase() + '/api/health').then(r => r.json()).then(h => {
    health = h;
    const el = modal && modal.querySelector('[data-health]');
    if (el) el.textContent = h.register === 'invite' ? '该服务器需要邀请码注册' : h.register === 'closed' ? '该服务器已关闭注册' : '该服务器开放注册';
    else if (modal) renderModal();
  }).catch(() => { });
}
function closeSyncModal() { if (modal) { modal.remove(); modal = null; } }
function renderModal() {
  const body = modal && modal.querySelector('#syncBody');
  if (!body) return;
  const apiVal = apiBase();
  if (!token) {
    body.innerHTML =
      '<label class="sync-field">服务器地址<input id="syApi" placeholder="https://你的域名（同源部署可留空）" value="' + esc(apiVal) + '"></label>'
      + '<label class="sync-field">用户名<input id="syName" autocomplete="username" placeholder="3-24 位字母 / 数字 / _ / -"></label>'
      + '<label class="sync-field">密码<input id="syPass" type="password" autocomplete="current-password" placeholder="至少 6 位"></label>'
      + '<label class="sync-field">邀请码（服务器要求时填写）<input id="syInvite" placeholder="可留空"></label>'
      + '<div class="sync-status" data-health>' + (health ? (health.register === 'invite' ? '该服务器需要邀请码注册' : health.register === 'closed' ? '该服务器已关闭注册' : '该服务器开放注册') : '正在连接服务器…') + '</div>'
      + '<div class="sync-btns"><button class="pri" id="syLogin">登录</button><button id="syReg">注册</button><button id="syCancel">关闭</button></div>'
      + '<div class="sync-hint">首次登录会自动把本机进度与云端合并（刷题记录按唯一 id 去重，不会丢失）。</div>';
    body.querySelector('#syCancel').onclick = closeSyncModal;
    const cred = () => {
      const a = body.querySelector('#syApi').value.trim().replace(/\/+$/, '');
      lsSet(API_KEY, a);
      return { name: body.querySelector('#syName').value.trim(), pass: body.querySelector('#syPass').value, invite: body.querySelector('#syInvite').value.trim() };
    };
    body.querySelector('#syLogin').onclick = async () => {
      const c = cred();
      if (!c.name || !c.pass) return toast('请填写用户名和密码', true);
      try { setStatus('syncing'); await login(c.name, c.pass); setStatus('ok'); toast('已登录并同步'); renderModal(); }
      catch (e) { setStatus('idle'); toast(e.message || '登录失败', true); }
    };
    body.querySelector('#syReg').onclick = async () => {
      const c = cred();
      if (!c.name || !c.pass) return toast('请填写用户名和密码', true);
      try { setStatus('syncing'); await register(c.name, c.pass, c.invite); setStatus('ok'); toast('注册成功，已同步'); renderModal(); }
      catch (e) { setStatus('idle'); toast(e.message || '注册失败', true); }
    };
    return;
  }
  const rows = spaces.map(s =>
    '<label class="sync-space"><input type="radio" name="sySpace" value="' + esc(s.id) + '"' + (s.id === space ? ' checked' : '') + '> '
    + (s.type === 'personal' ? '👤 ' : '👥 ') + esc(s.name) + (s.members ? '（' + s.members + ' 人）' : '') + '</label>').join('')
    || '<div class="sync-status">暂无可用空间</div>';
  body.innerHTML =
    '<div class="sync-who">当前账号：<b>' + esc(user.name) + '</b> <button class="mini" id="syLogout">退出登录</button></div>'
    + '<div class="sync-label">同步空间</div><div class="sync-spaces">' + rows + '</div>'
    + '<div class="sync-team"><input id="syTeamName" placeholder="新团队名"><button class="mini" id="syCreate">创建团队</button>'
    + '<input id="syJoinCode" placeholder="邀请码" maxlength="8"><button class="mini" id="syJoin">加入团队</button></div>'
    + '<div class="sync-status" data-status>状态：' + STATUS_TEXT[status] + ' · 上次同步：' + fmtTime(lastSync) + '</div>'
    + '<div class="sync-btns"><button class="pri" id="syNow">立即同步</button><button id="syClose">关闭</button></div>'
    + '<label class="sync-field">服务器地址<input id="syApi" value="' + esc(apiVal) + '"></label>'
    + '<div class="sync-hint">同一账号在多台设备登录即可同步；「换一批」场景若正在编辑，改动会自动合并。</div>';
  body.querySelector('#syClose').onclick = closeSyncModal;
  body.querySelector('#syLogout').onclick = async () => { await logout(); renderModal(); };
  body.querySelector('#syNow').onclick = async () => { try { await syncNow(); toast('同步完成'); } catch (e) { toast('同步失败：' + e.message, true); } };
  body.querySelector('#syApi').onchange = e => { lsSet(API_KEY, e.target.value.trim().replace(/\/+$/, '')); toast('已保存服务器地址'); };
  body.querySelectorAll('input[name=sySpace]').forEach(r => r.onchange = async () => {
    try { await switchSpace(r.value); toast('已切换到「' + (spaces.find(s => s.id === r.value) || {}).name + '」'); }
    catch (e) { toast('切换失败：' + e.message, true); }
  });
  body.querySelector('#syCreate').onclick = async () => {
    const name = body.querySelector('#syTeamName').value.trim();
    if (!name) return toast('请输入团队名', true);
    try {
      const r = await api('POST', '/api/teams', { name });
      toast('团队已创建，邀请码：' + r.team.code);
      spaces = r.spaces; renderModal();
    } catch (e) { toast(e.message, true); }
  };
  body.querySelector('#syJoin').onclick = async () => {
    const code = body.querySelector('#syJoinCode').value.trim();
    if (!code) return toast('请输入邀请码', true);
    try {
      const r = await api('POST', '/api/teams/join', { code });
      toast('已加入「' + r.team.name + '」');
      spaces = r.spaces; renderModal();
    } catch (e) { toast(e.message, true); }
  };
}

/* ---------------- 初始化 ---------------- */
function init() {
  const b = document.getElementById('syncBtn');
  if (b) b.onclick = openSyncModal;
  renderButton();
  if (token) {
    sleep(800).then(() => {
      afterLogin().catch(e => {
        if (e.status === 401) { clearAuth(); setStatus('idle'); }
        else setStatus(navigator.onLine ? 'error' : 'offline');
        renderButton();
      });
    });
  } else if (space) { space = ''; lsDel(SPACE_KEY); }
  snap = snapshot();
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

/* 供测试与调试使用 */
window.ACMSync = {
  mergeDocs, mergeTreeState, mergePicks, mergeCurrentPicks, mergeLinks, collectDoc, applyDoc, canon, logKey, keysEquivalent,
  login, register, logout, switchSpace, syncNow, doPush, doPull, refreshSpaces,
  get status() { return status; }, get space() { return space; }, get user() { return user; },
  get baseRev() { return baseRev; }, get lastSync() { return lastSync; },
  setApi: v => lsSet(API_KEY, v)
};
})();
