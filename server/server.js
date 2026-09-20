#!/usr/bin/env node
/* ACM 训练台同步服务：账号 + 个人/团队进度同步（零依赖，Node 18+） */
'use strict';
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const util = require('util');

const PORT = +(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const REGISTER_MODE = (process.env.REGISTER_MODE || 'open').toLowerCase(); // open | invite | closed
const INVITE_CODES = (process.env.INVITE_CODES || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim()).filter(Boolean);
const SESSION_DAYS = +(process.env.SESSION_DAYS || 30);
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
const MAX_STATE = +(process.env.MAX_STATE || 5 * 1024 * 1024);
const STATIC_DIR = process.env.STATIC_DIR ? path.resolve(process.env.STATIC_DIR) : '';

fs.mkdirSync(DATA_DIR, { recursive: true });
const log = (...a) => console.log(new Date().toISOString(), ...a);

/* ---------------- 原子 JSON 存储 ---------------- */
function store(name, initial) {
  const file = path.join(DATA_DIR, name + '.json');
  let data = JSON.parse(JSON.stringify(initial));
  try {
    if (fs.existsSync(file)) data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    const bak = file + '.corrupt-' + Date.now();
    try { fs.renameSync(file, bak); } catch (_) { }
    log('FATAL: ' + file + ' 损坏，已备份至 ' + bak + '（' + e.message + '），请人工恢复后重启');
    process.exit(1);
  }
  let chain = Promise.resolve();
  return {
    data,
    save() {
      const snapshot = JSON.stringify(data);
      chain = chain.catch(() => { }).then(() => {
        const tmp = file + '.tmp';
        fs.writeFileSync(tmp, snapshot);
        fs.renameSync(tmp, file);
      });
      return chain;
    }
  };
}
const accounts = store('accounts', { users: {}, byName: {}, usedInvites: {} });
const sessions = store('sessions', {});
const teams = store('teams', { teams: {}, codes: {}, members: {} });
const stateStores = new Map();
function stateStore(id) {
  if (!stateStores.has(id)) stateStores.set(id, store('state_' + id, { rev: 0, doc: null, updatedAt: 0, updatedBy: null }));
  return stateStores.get(id);
}

/* ---------------- 工具 ---------------- */
const uid = () => crypto.randomBytes(8).toString('hex');
const teamCode = () => {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.randomBytes(6)).map(b => a[b % a.length]).join('');
};
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const scryptAsync = util.promisify(crypto.scrypt);
const scrypt = async (pass, salt) => (await scryptAsync(pass, salt, 64)).toString('hex');
const safeEq = (a, b) => {
  const ba = Buffer.from(a), bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};
function cors(req, res) {
  const origin = req.headers.origin || '';
  let allow = '';
  if (ALLOWED_ORIGINS.includes('*')) allow = '*';
  else if (ALLOWED_ORIGINS.includes(origin)) allow = origin;
  if (allow) { res.setHeader('Access-Control-Allow-Origin', allow); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Max-Age', '86400');
}
function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}
function body(req, limit) {
  return new Promise((ok, no) => {
    let n = 0; const chunks = [];
    req.on('data', c => {
      n += c.length;
      if (n > limit) { no(Object.assign(new Error('请求体过大'), { status: 413 })); req.destroy(); }
      else chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return ok({});
      try { ok(JSON.parse(Buffer.concat(chunks))); }
      catch (e) { no(Object.assign(new Error('JSON 格式错误'), { status: 400 })); }
    });
    req.on('error', no);
  });
}
function auth(req) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!m) return null;
  const th = sha(m[1]);
  const s = sessions.data[th];
  if (!s) return null;
  if (s.expiresAt < Date.now()) { delete sessions.data[th]; sessions.save(); return null; }
  const u = accounts.data.users[s.userId];
  if (!u) return null;
  s.expiresAt = Date.now() + SESSION_DAYS * 864e5;
  s.seenAt = Date.now();
  sessions.save().catch(() => { });
  return { id: s.userId, user: u };
}
setInterval(() => {
  const now = Date.now(); let changed = false;
  for (const k of Object.keys(sessions.data)) {
    if (sessions.data[k].expiresAt < now) { delete sessions.data[k]; changed = true; }
  }
  if (changed) sessions.save().catch(() => { });
}, 3600000).unref();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rl) if (now - v.t > 300000) rl.delete(k);
}, 300000).unref();
const rl = new Map();
function limited(ip, key, max = 30, win = 60000) {
  const k = ip + '|' + key, now = Date.now();
  const e = rl.get(k) || { n: 0, t: now };
  if (now - e.t > win) { e.n = 0; e.t = now; }
  e.n++; rl.set(k, e);
  return e.n > max;
}
function publicUser(u) { return { id: u.id, name: u.name, createdAt: u.createdAt }; }
function spacesOf(u) {
  const list = [{ id: 'u_' + u.id, name: '个人', type: 'personal' }];
  for (const tid of Object.keys(teams.data.teams)) {
    const members = teams.data.members[tid] || [];
    if (members.includes(u.id)) list.push({ id: tid, name: teams.data.teams[tid].name, type: 'team', members: members.length });
  }
  return list;
}
function spaceAccess(userId, spaceId) {
  if (spaceId.startsWith('u_')) {
    if (spaceId === 'u_' + userId) return { ok: true };
    return { ok: false, code: 403, error: '无权访问该个人空间' };
  }
  if (spaceId.startsWith('t_')) {
    const t = teams.data.teams[spaceId];
    if (!t) return { ok: false, code: 404, error: '团队不存在' };
    if (!(teams.data.members[spaceId] || []).includes(userId)) return { ok: false, code: 403, error: '不是该团队成员' };
    return { ok: true, team: t };
  }
  return { ok: false, code: 404, error: '空间不存在' };
}

/* ---------------- CLI：重置密码 ---------------- */
async function resetPassword(name, pass) {
  const id = accounts.data.byName[String(name).toLowerCase()];
  const u = id && accounts.data.users[id];
  if (!u) { console.error('用户不存在：' + name); process.exit(1); }
  if (String(pass).length < 6) { console.error('密码至少 6 位'); process.exit(1); }
  u.salt = crypto.randomBytes(16).toString('hex');
  u.hash = await scrypt(pass, u.salt);
  await accounts.save();
  console.log('已重置密码：' + u.name);
}

/* ---------------- MIME（静态托管） ---------------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8' };

/* ---------------- 路由 ---------------- */
const server = http.createServer(async (req, res) => {
  cors(req, res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const u = new URL(req.url, 'http://localhost');
  const p = u.pathname;
  const ip = (TRUST_PROXY && (req.headers['x-forwarded-for'] || '').split(',').pop().trim()) || req.socket.remoteAddress || '?';
  try {
    if (p === '/api/health') return send(res, 200, { ok: true, time: Date.now(), register: REGISTER_MODE });

    if (p === '/api/register' && req.method === 'POST') {
      if (REGISTER_MODE === 'closed') return send(res, 403, { error: '服务器已关闭注册' });
      if (limited(ip, 'reg', 10)) return send(res, 429, { error: '操作太频繁，请稍后再试' });
      const b = await body(req, 65536);
      const name = String(b.username || '').trim();
      const pass = String(b.password || '');
      if (!/^[A-Za-z0-9_-]{3,24}$/.test(name)) return send(res, 400, { error: '用户名需 3-24 位字母 / 数字 / _ / -' });
      if (pass.length < 6 || pass.length > 128) return send(res, 400, { error: '密码长度需 6-128 位' });
      if (accounts.data.byName[name.toLowerCase()]) return send(res, 409, { error: '用户名已被占用' });
      if (REGISTER_MODE === 'invite') {
        const code = String(b.invite || '').trim().toUpperCase();
        if (!INVITE_CODES.includes(code)) return send(res, 403, { error: '邀请码无效' });
        if (accounts.data.usedInvites[code]) return send(res, 403, { error: '邀请码已被使用' });
        accounts.data.usedInvites[code] = name;
      }
      const id = uid();
      const salt = crypto.randomBytes(16).toString('hex');
      const user = { id, name, salt, hash: await scrypt(pass, salt), createdAt: Date.now() };
      accounts.data.users[id] = user;
      accounts.data.byName[name.toLowerCase()] = id;
      await accounts.save();
      const raw = crypto.randomBytes(32).toString('base64url');
      sessions.data[sha(raw)] = { userId: id, createdAt: Date.now(), expiresAt: Date.now() + SESSION_DAYS * 864e5 };
      await sessions.save();
      log('register', name);
      return send(res, 200, { token: raw, user: publicUser(user), spaces: spacesOf(user) });
    }

    if (p === '/api/login' && req.method === 'POST') {
      if (limited(ip, 'login')) return send(res, 429, { error: '操作太频繁，请稍后再试' });
      const b = await body(req, 65536);
      const id = accounts.data.byName[String(b.username || '').trim().toLowerCase()];
      const user = id && accounts.data.users[id];
      if (!user || !safeEq(user.hash, await scrypt(String(b.password || ''), user.salt))) return send(res, 401, { error: '用户名或密码错误' });
      const raw = crypto.randomBytes(32).toString('base64url');
      sessions.data[sha(raw)] = { userId: user.id, createdAt: Date.now(), expiresAt: Date.now() + SESSION_DAYS * 864e5 };
      await sessions.save();
      return send(res, 200, { token: raw, user: publicUser(user), spaces: spacesOf(user) });
    }

    const me = auth(req);
    if (p.startsWith('/api/') && !me) return send(res, 401, { error: '未登录或登录已过期' });

    if (p === '/api/logout' && req.method === 'POST') {
      const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
      if (m) { delete sessions.data[sha(m[1])]; await sessions.save(); }
      return send(res, 200, { ok: true });
    }
    if (p === '/api/me' && req.method === 'GET') {
      return send(res, 200, { user: publicUser(me.user), spaces: spacesOf(me.user) });
    }
    if (p === '/api/spaces' && req.method === 'GET') {
      return send(res, 200, { spaces: spacesOf(me.user) });
    }
    if (p === '/api/teams' && req.method === 'POST') {
      if (limited(ip, 'team', 5)) return send(res, 429, { error: '操作太频繁，请稍后再试' });
      if (Object.values(teams.data.teams).filter(t => t.ownerId === me.id).length >= 20) return send(res, 400, { error: '每人最多创建 20 个团队' });
      const b = await body(req, 65536);
      const name = String(b.name || '').trim();
      if (!name || name.length > 32) return send(res, 400, { error: '团队名需 1-32 字' });
      const id = 't_' + uid();
      let code = teamCode();
      while (teams.data.codes[code]) code = teamCode();
      teams.data.teams[id] = { id, name, code, ownerId: me.id, createdAt: Date.now() };
      teams.data.codes[code] = id;
      teams.data.members[id] = [me.id];
      await teams.save();
      log('team create', name, id);
      return send(res, 200, { team: { id, name, code }, spaces: spacesOf(me.user) });
    }
    if (p === '/api/teams/join' && req.method === 'POST') {
      if (limited(ip, 'join', 10)) return send(res, 429, { error: '操作太频繁，请稍后再试' });
      const b = await body(req, 65536);
      const code = String(b.code || '').trim().toUpperCase();
      const tid = teams.data.codes[code];
      if (!tid || !teams.data.teams[tid]) return send(res, 404, { error: '邀请码无效' });
      const members = teams.data.members[tid] || (teams.data.members[tid] = []);
      if (!members.includes(me.id)) { members.push(me.id); await teams.save(); }
      return send(res, 200, { team: teams.data.teams[tid], spaces: spacesOf(me.user) });
    }

    const ms = /^\/api\/spaces\/([^/]+)\/state$/.exec(p);
    if (ms) {
      let spaceId;
      try { spaceId = decodeURIComponent(ms[1]); }
      catch (e) { return send(res, 400, { error: '非法空间标识' }); }
      const acc = spaceAccess(me.id, spaceId);
      if (!acc.ok) return send(res, acc.code, { error: acc.error });
      const st = stateStore(spaceId);
      if (req.method === 'GET') {
        return send(res, 200, { rev: st.data.rev, doc: st.data.doc, updatedAt: st.data.updatedAt });
      }
      if (req.method === 'PUT') {
        if (limited(ip, 'put_' + me.id, 60)) return send(res, 429, { error: '操作太频繁，请稍后再试' });
        const b = await body(req, MAX_STATE + 65536);
        const baseRev = +(b.baseRev || 0);
        if (!b.doc || typeof b.doc !== 'object') return send(res, 400, { error: '缺少 doc' });
        if (baseRev !== st.data.rev) return send(res, 409, { error: '版本冲突', rev: st.data.rev, doc: st.data.doc, updatedAt: st.data.updatedAt });
        const next = st.data.rev + 1;
        st.data.rev = next;
        st.data.doc = b.doc;
        st.data.updatedAt = Date.now();
        st.data.updatedBy = me.id;
        await st.save();
        return send(res, 200, { rev: next, updatedAt: st.data.updatedAt });
      }
      return send(res, 405, { error: '方法不支持' });
    }

    /* 静态托管（可选，方便同机部署前端） */
    if (STATIC_DIR && req.method === 'GET') {
      let rel;
      try { rel = decodeURIComponent(p); }
      catch (e) { return send(res, 400, { error: '非法路径编码' }); }
      if (rel === '/' || rel === '') rel = '/index.html';
      if (rel.split('/').some(seg => seg.startsWith('.'))) return send(res, 403, { error: 'forbidden' });
      const file = path.normalize(path.join(STATIC_DIR, rel));
      const relToBase = path.relative(STATIC_DIR, file);
      if (!relToBase || relToBase.startsWith('..') || path.isAbsolute(relToBase)) return send(res, 403, { error: 'forbidden' });
      const dataRoot = path.resolve(DATA_DIR);
      if (file === dataRoot || file.startsWith(dataRoot + path.sep)) return send(res, 403, { error: 'forbidden' });
      if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        res.writeHead(200, {
          'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
          'Cache-Control': 'no-store'
        });
        return fs.createReadStream(file).pipe(res);
      }
    }
    return send(res, 404, { error: 'not found' });
  } catch (e) {
    if (e && e.status) return send(res, e.status, { error: e.message });
    log('server error', e && e.stack || e);
    return send(res, 500, { error: '服务器内部错误' });
  }
});

if (process.argv[2] === '--reset-password') {
  resetPassword(process.argv[3], process.argv[4])
    .then(() => process.exit(0))
    .catch(e => { console.error('重置失败：' + (e && e.message)); process.exit(1); });
} else {
  server.listen(PORT, HOST, () => {
    log('ACM sync server on http://' + HOST + ':' + PORT + '  data=' + DATA_DIR + '  register=' + REGISTER_MODE + (STATIC_DIR ? '  static=' + STATIC_DIR : ''));
  });
}
