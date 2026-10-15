const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs/promises');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const assets = new Map([
  ['/skilltree.html', ['skilltree.html', 'text/html']],
  ['/js/tree.js', ['js/tree.js', 'text/javascript']],
  ['/js/sync.js', ['js/sync.js', 'text/javascript']],
  ['/css/tree.css', ['css/tree.css', 'text/css']],
]);
const hostHtml = '<!doctype html><meta charset="utf-8"><button id="syncBtn"></button>'
  + '<iframe id="treeFrame" name="tree" src="/skilltree.html" style="width:100%;height:900px"></iframe>'
  + '<script src="/js/sync.js"></script>';
const practiced = Object.fromEntries(['bit', 'dsu', 'st', 'heap', 'seg1', 'offbit', 'timerev', 'bfs', 'topo'].map(id => [id, 1]));
let browser, server, dataDir, base, seed = 20261015;

before(async () => {
  dataDir = await fs.mkdtemp(path.join(process.env.ACM_TEST_TMPDIR || os.tmpdir(), 'acm-picks-'));
  const probe = net.createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  base = 'http://127.0.0.1:' + port;
  server = spawn(process.execPath, [path.join(root, 'server/server.js')], {
    cwd: root,
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', DATA_DIR: dataDir, REGISTER_MODE: 'open', STATIC_DIR: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await Promise.race([
    once(server.stdout, 'data'),
    once(server, 'exit').then(([code]) => { throw new Error('测试同步服务提前退出: ' + code); }),
    once(server, 'error').then(([error]) => { throw error; }),
  ]);
  browser = await chromium.launch({
    headless: true,
    channel: process.env.ACM_BROWSER_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined),
  });
});

after(async () => {
  try { if (browser) await browser.close(); }
  finally {
    if (server && server.exitCode === null) { const exited = once(server, 'exit'); server.kill(); await exited; }
    if (dataDir) await fs.rm(dataDir, { recursive: true, force: true });
  }
});

async function openTree(t, { levels = practiced, storage = {}, host = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  t.after(async () => { await context.close(); assert.deepEqual(errors, [], '页面不应抛出异常'); });
  await page.addInitScript(({ storage, seed }) => {
    let value = seed;
    Math.random = () => ((value = (Math.imul(value, 1664525) + 1013904223) >>> 0) / 4294967296);
    // 只初始化一次，刷新应使用页面实际保存的数据。
    if (!sessionStorage.getItem('fixture-ready')) {
      Object.entries(storage).forEach(([key, value]) => localStorage.setItem(key, value));
      sessionStorage.setItem('fixture-ready', '1');
    }
  }, { storage, seed: seed++ });
  await page.route(base + '/**', async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.startsWith('/api/')) return route.continue();
    if (pathname === '/test-host.html') return route.fulfill({ body: hostHtml, contentType: 'text/html' });
    const asset = assets.get(pathname);
    if (!asset) return route.fulfill({ status: 404, body: '' });
    await route.fulfill({ body: await fs.readFile(path.join(root, asset[0])), contentType: asset[1] });
  });
  await page.goto(base + (host ? '/test-host.html' : '/skilltree.html'));
  const tree = host ? page.frame({ name: 'tree' }) : page;
  await tree.waitForFunction(() => typeof openPickModal === 'function');
  if (host) await page.waitForFunction(() => !!window.ACMSync);
  await tree.evaluate(levels => {
    if (levels === 'all') LEAVES.forEach(n => { st(n.id).level = 1; });
    else Object.entries(levels).forEach(([id, level]) => { st(id).level = level; });
    render();
  }, levels);
  return { page, tree, context };
}
const ids = tree => tree.locator('.pick-card').evaluateAll(cards => cards.map(c => c.dataset.go));
const doc = tree => tree.evaluate(() => JSON.parse(localStorage.getItem('acm_skilltree_current')));
const selected = (tree, attr) => tree.locator('[' + attr + '].pri').getAttribute(attr);
async function waitDirection(tree, direction) {
  await tree.waitForFunction(dir => document.getElementById('dirSel').value === dir, direction);
}
async function sync(page, method) {
  await page.evaluate(method => ACMSync[method](), method);
  assert.equal(await page.evaluate(() => ACMSync.status), 'ok');
}

test('增加数量只补缺项，减少后再增加恢复原标签，刷新也保留', async t => {
  const { page, tree } = await openTree(t);
  await tree.click('#pickBtn');
  const before = await ids(tree);
  await tree.click('[data-cnt="5"]');
  const five = await ids(tree);
  assert.equal(five.length, 5);
  assert.deepEqual(five.slice(0, before.length), before);
  await tree.click('[data-cnt="3"]');
  assert.deepEqual(await ids(tree), five.slice(0, 3));
  await page.reload();
  await page.click('#pickBtn');
  assert.deepEqual(await ids(page), five.slice(0, 3));
  await page.click('[data-cnt="5"]');
  assert.deepEqual(await ids(page), five);
});

test('切换范围及重复点击当前设置不会替换已抽标签', async t => {
  const { tree } = await openTree(t);
  await tree.click('#pickBtn');
  const before = await ids(tree);
  for (const scope of ['frontier', 'frontier', 'practiced', 'practiced']) {
    await tree.click('[data-scope="' + scope + '"]');
    assert.deepEqual(await ids(tree), before);
  }
  await tree.click('[data-cnt="4"]');
  assert.deepEqual(await ids(tree), before);
});

test('记录第一题和第二题、关闭重开都不会重新抽批次', async t => {
  const { tree } = await openTree(t);
  await tree.click('#pickBtn');
  const before = await ids(tree);
  for (let i = 0; i < 2; i++) {
    await tree.locator('.pick-card').nth(i).click();
    await tree.click('#quick');
    await tree.click('#pickBtn');
    assert.deepEqual(await ids(tree), before);
  }
});

test('DS 候选不足时少推几个，不会为凑数混入数学', async t => {
  const { tree } = await openTree(t, { levels: { bit: 1, gcd: 1 } });
  await tree.selectOption('#dirSel', 'g');
  await tree.click('#pickBtn');
  assert.deepEqual(await ids(tree), ['bit']);
  await tree.click('[data-cnt="5"]');
  await tree.click('#pickReroll');
  assert.deepEqual(await ids(tree), ['bit']);
});

test('综合与个人方向各自保存批次、设置和历史', async t => {
  const { page, tree } = await openTree(t, { levels: 'all' });
  await tree.click('#pickBtn');
  const all = await ids(tree);
  await tree.click('[data-pick-dir="g"]');
  await tree.click('[data-cnt="3"]');
  await tree.click('[data-scope="frontier"]');
  const graph = await ids(tree), savedGraph = (await doc(tree)).byDir.g;
  await tree.click('[data-pick-dir="m"]');
  await tree.click('[data-cnt="5"]');
  const math = await ids(tree);
  await tree.click('[data-pick-dir="g"]');
  assert.deepEqual(await ids(tree), graph);
  assert.equal(await selected(tree, 'data-cnt'), '3');
  assert.equal(await selected(tree, 'data-scope'), 'frontier');
  assert.deepEqual((await doc(tree)).byDir.g, savedGraph);
  await tree.click('[data-pick-dir="all"]');
  assert.deepEqual(await ids(tree), all);
  await tree.click('[data-pick-dir="m"]');
  assert.deepEqual(await ids(tree), math);
  await page.reload();
  await page.click('#pickBtn');
  assert.deepEqual(await ids(page), math);
  assert.equal(await selected(page, 'data-pick-dir'), 'm');
});

test('新知识点与手动换批始终遵守各方向和前置限制', async t => {
  const { tree } = await openTree(t, { levels: {} });
  await tree.click('#pickBtn');
  for (const dir of ['g', 'm', 'd']) {
    await tree.click('[data-pick-dir="' + dir + '"]');
    await tree.click('[data-scope="frontier"]');
    for (let i = 0; i < 3; i++) {
      const batch = await tree.evaluate(() => pickList.map(n => ({ id: n.id, dir: n.dirv, locked: n.locked, tier: n.t })));
      assert.ok(batch.length > 0);
      assert.equal(new Set(batch.map(n => n.id)).size, batch.length);
      assert.ok(batch.every(n => (n.dir === dir || n.dir === 'a') && !n.locked && n.tier === 1));
      await tree.click('#pickReroll');
    }
  }
});

test('手动换批优先选旧批以外的知识点', async t => {
  const { tree } = await openTree(t);
  await tree.click('#pickBtn');
  const before = new Set(await ids(tree));
  await tree.click('#pickReroll');
  assert.ok((await ids(tree)).every(id => !before.has(id)));
});

test('少量候选也不会自动放宽板块和目标层级', async t => {
  const { tree } = await openTree(t, { levels: { bit: 1, gcd: 1, treap: 1 } });
  await tree.selectOption('#dirSel', 'g');
  await tree.selectOption('#blockSel', 'b_math');
  await tree.click('#pickBtn');
  assert.deepEqual(await ids(tree), []);
  await tree.click('#pickClose');
  await tree.selectOption('#blockSel', 'all');
  await tree.selectOption('#tierSel', '1');
  await tree.click('#pickBtn');
  assert.deepEqual(await ids(tree), ['bit']);
});

test('DS 的主攻层和新知识点层级不受未学数学拖低', async t => {
  const { tree } = await openTree(t, { levels: {} });
  await tree.evaluate(() => {
    const today = new Date().toISOString().slice(0, 10);
    LEAVES.filter(n => (n.dirv === 'g' || n.dirv === 'a') && n.t < 3).forEach(n => {
      const s = st(n.id); s.level = 3;
      s.logs = Array.from({ length: n.tg * 2 }, (_, i) => ({ id: n.id + '-' + i, r: 2100, d: today, how: 'ac' }));
    });
    render();
  });
  await tree.selectOption('#dirSel', 'g');
  await tree.click('#pickBtn');
  await tree.click('[data-scope="frontier"]');
  assert.deepEqual(await tree.evaluate(() => [focusTier(), frontierTier()]), [3, 3]);
});

test('旧版单批次迁入综合方向，切 DS 不会复用数学', async t => {
  const { tree } = await openTree(t, {
    levels: { gcd: 1 },
    storage: {
      acm_skilltree_current: JSON.stringify({ ids: ['gcd'], scope: 'practiced', count: 3, at: 123 }),
      acm_skilltree_picks: JSON.stringify(['gcd']),
    },
  });
  await tree.click('#pickBtn');
  assert.deepEqual(await ids(tree), ['gcd']);
  assert.equal(await selected(tree, 'data-cnt'), '3');
  await tree.click('[data-pick-dir="g"]');
  assert.deepEqual(await ids(tree), []);
  assert.deepEqual((await doc(tree)).byDir.all.ids, ['gcd']);
  assert.deepEqual((await doc(tree)).byDir.all.history, ['gcd']);
});

test('未开始也能抽新知识点，切回已练范围仍保留当前批次', async t => {
  const { tree } = await openTree(t, { levels: {} });
  await tree.click('#pickBtn');
  assert.deepEqual(await ids(tree), []);
  await tree.click('[data-scope="frontier"]');
  const before = await ids(tree);
  assert.equal(before.length, 4);
  await tree.click('[data-scope="practiced"]');
  assert.deepEqual(await ids(tree), before);
});

test('重置清空所有方向的批次与内存缓存', async t => {
  const { page, tree } = await openTree(t);
  await tree.click('#pickBtn');
  await tree.click('[data-pick-dir="g"]');
  await tree.click('#pickClose');
  page.once('dialog', dialog => dialog.accept());
  await tree.click('#resetBtn');
  await tree.click('#pickBtn');
  assert.deepEqual(await ids(tree), []);
  assert.ok(Object.values((await doc(tree)).byDir).every(e => e.ids.length === 0 && e.history.length === 0));
});

test('旧新结构与同时间冲突合并可收敛，且不同方向分别保留', async t => {
  const { page } = await openTree(t, { host: true });
  const result = await page.evaluate(() => {
    const a = { ids: ['gcd'], count: 3, scope: 'practiced', at: 10 };
    const b = { ver: 2, byDir: { g: { ids: ['bit'], count: 4, scope: 'frontier', history: ['bit'], at: 20 } } };
    const c = { ver: 2, byDir: { g: { ids: ['dsu'], count: 3, scope: 'practiced', history: ['dsu'], at: 20 } } };
    return {
      migrated: ACMSync.mergeCurrentPicks(a, b),
      forward: ACMSync.mergeCurrentPicks(b, c),
      reverse: ACMSync.mergeCurrentPicks(c, b),
      repeated: ACMSync.mergeCurrentPicks(b, b),
    };
  });
  assert.deepEqual(result.migrated.byDir.all.ids, ['gcd']);
  assert.deepEqual(result.migrated.byDir.g.ids, ['bit']);
  assert.deepEqual(result.forward, result.reverse);
  assert.deepEqual(result.repeated.byDir.g.ids, ['bit']);
});

test('两个独立浏览器登录同一账号，实时批次/设置一致且并发改不同方向不丢失', async t => {
  const a = await openTree(t, { host: true, levels: 'all' });
  const b = await openTree(t, { host: true, levels: {} });
  await a.page.evaluate(() => ACMSync.register('picks_shared', 'local-test-password'));
  await b.page.evaluate(() => ACMSync.login('picks_shared', 'local-test-password'));
  await a.tree.click('#pickBtn');
  await a.tree.click('[data-pick-dir="g"]');
  await a.tree.click('[data-cnt="5"]');
  await a.tree.click('[data-scope="frontier"]');
  const graph = await ids(a.tree), graphEntry = (await doc(a.tree)).byDir.g;
  // B 的弹窗保持打开，拉取后必须直接反映 A 的当前方向与批次。
  await b.tree.click('#pickBtn');
  await sync(a.page, 'doPush');
  await sync(b.page, 'doPull');
  await waitDirection(b.tree, 'g');
  assert.deepEqual(await ids(b.tree), graph);
  assert.equal(await selected(b.tree, 'data-cnt'), '5');
  assert.equal(await selected(b.tree, 'data-scope'), 'frontier');
  assert.deepEqual((await doc(b.tree)).byDir.g, graphEntry);
  await sync(a.page, 'doPull');
  // 两边从同一版本分别改 g 与 m，第二个 PUT 会走真实服务端 409 合并。
  await a.tree.click('[data-cnt="3"]');
  const graphThree = (await doc(a.tree)).byDir.g;
  await b.tree.click('[data-pick-dir="m"]');
  await b.tree.click('[data-cnt="5"]');
  const math = (await doc(b.tree)).byDir.m;
  await sync(a.page, 'doPush');
  await sync(b.page, 'doPush');
  await sync(a.page, 'doPull');
  await waitDirection(a.tree, 'm');
  const merged = await doc(a.tree);
  assert.deepEqual(merged.byDir.g, graphThree);
  assert.deepEqual(merged.byDir.m, math);
  assert.deepEqual(await doc(b.tree), merged);
  assert.deepEqual(await ids(a.tree), await ids(b.tree));
});

test('拉取后立即修改方向也会自动推送，另一电脑获取相同数据', async t => {
  const a = await openTree(t, { host: true, levels: 'all' });
  const b = await openTree(t, { host: true, levels: {} });
  await a.page.evaluate(() => ACMSync.register('picks_auto', 'local-test-password'));
  await a.tree.selectOption('#dirSel', 'g');
  await a.tree.click('#pickBtn');
  await sync(a.page, 'doPush');
  await b.page.evaluate(() => ACMSync.login('picks_auto', 'local-test-password'));
  await waitDirection(b.tree, 'g');
  await b.tree.click('#pickBtn');
  const rev = await b.page.evaluate(() => ACMSync.baseRev);
  await b.tree.click('[data-pick-dir="d"]');
  await b.tree.click('[data-cnt="3"]');
  await b.tree.click('[data-scope="frontier"]');
  const expected = (await doc(b.tree)).byDir.d;
  await b.page.waitForFunction(rev => ACMSync.baseRev > rev && ACMSync.status === 'ok', rev, { timeout: 15000 });
  await sync(a.page, 'doPull');
  await waitDirection(a.tree, 'd');
  assert.deepEqual(await ids(a.tree), await ids(b.tree));
  assert.deepEqual((await doc(a.tree)).byDir.d, expected);
  assert.equal(await selected(a.tree, 'data-cnt'), '3');
  assert.equal(await selected(a.tree, 'data-scope'), 'frontier');
});
