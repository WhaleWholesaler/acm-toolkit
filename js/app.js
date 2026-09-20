
/* ================= 全局状态 ================= */
const state = { rootHandle:null, degraded:false, categories:new Map(), currentCategory:null, search:'', selectedFile:null, editing:false, order:{categories:[], files:{}}, _catDrag:null, _fileDrag:null };
const CODE_EXTS = ['c','cpp','cc','cxx','h','hpp','py','java','js','ts','go','rs','rb','kt','pas'];

const $ = s => document.querySelector(s);

/* ================= 1. 存储层（IndexedDB 持久化目录句柄） ================= */
function openDB(){
  return new Promise((res, rej) => {
    const rq = indexedDB.open('acmTpl', 1);
    rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });
}
async function saveHandle(handle){
  const db = await openDB();
  await new Promise((res, rej) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(handle, 'rootDir'); // FileSystemDirectoryHandle 可结构化克隆，直接存
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
  db.close();
}
async function loadHandle(){
  const db = await openDB();
  const v = await new Promise((res, rej) => {
    const rq = db.transaction('kv').objectStore('kv').get('rootDir');
    rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error);
  });
  db.close();
  return v || null;
}
async function verifyPermission(handle){
  const opts = { mode:'readwrite' };
  if (await handle.queryPermission(opts) === 'granted') return true;
  return (await handle.requestPermission(opts)) === 'granted';
}
async function pickDirectory(){
  try{
    const h = await showDirectoryPicker({ mode:'readwrite' });
    state.rootHandle = h;
    $('#dirLabel').textContent = h.name;
    await saveHandle(h);
    await scanDirectory();
    toast('已加载目录「' + h.name + '」');
  }catch(e){
    if (e && e.name !== 'AbortError') toast('选择目录失败：' + e.message, true);
  }
}

/* ================= 2. 文件系统层 ================= */
function extOf(name){ const i = name.lastIndexOf('.'); return i < 0 ? '' : name.slice(i + 1).toLowerCase(); }
function isCodeFile(name){ return CODE_EXTS.includes(extOf(name)); }

async function scanDirectory(){
  if (!state.rootHandle) return;
  state.categories = new Map();
  state.selectedFile = null;
  try{
    await walk(state.rootHandle, null, '');
    for (const arr of state.categories.values()) arr.sort((a, b) => a.name.localeCompare(b.name));
    await loadOrder();
    applyOrder();
    updateCount(); renderCategories(); renderFiles(); renderPreview();
    pruneLinks();
  }catch(e){ toast('扫描目录失败：' + e.message, true); }
}
/* ---- 拖拽排序：自定义顺序持久化到根目录 .acm-order.json ---- */
async function loadOrder(){
  state.order = { categories:[], files:{} };
  if (!state.rootHandle) return;
  try{
    const fh = await state.rootHandle.getFileHandle('.acm-order.json');
    const o = JSON.parse(await (await fh.getFile()).text());
    if (o && typeof o === 'object'){
      state.order.categories = Array.isArray(o.categories) ? o.categories : [];
      state.order.files = (o.files && typeof o.files === 'object') ? o.files : {};
    }
  }catch(e){ /* 无文件用默认顺序 */ }
}
async function saveOrder(){
  if (!state.rootHandle || state.degraded) return;
  try{
    const fh = await state.rootHandle.getFileHandle('.acm-order.json', {create:true});
    const w = await fh.createWritable();
    await w.write(JSON.stringify(state.order, null, 2));
    await w.close();
  }catch(e){ toast('顺序保存失败：' + e.message, true); }
}
// 按自定义序重排分类 Map 键与各分类文件数组；未记录的条目按原规则排尾（未分类置顶）
function applyOrder(){
  const oc = state.order.categories || [];
  const keys = [...state.categories.keys()].sort((a, b) => {
    const ia = oc.indexOf(a), ib = oc.indexOf(b);
    if (ia < 0 && ib < 0) return a === '未分类' ? -1 : b === '未分类' ? 1 : a.localeCompare(b, 'zh');
    if (ia < 0) return 1;
    if (ib < 0) return -1;
    return ia - ib;
  });
  const m = new Map();
  for (const k of keys) m.set(k, state.categories.get(k));
  state.categories = m;
  for (const [cat, arr] of state.categories){
    const ord = (state.order.files || {})[cat] || [];
    arr.sort((x, y) => {
      const ix = ord.indexOf(x.name), iy = ord.indexOf(y.name);
      if (ix < 0 && iy < 0) return x.name.localeCompare(y.name);
      if (ix < 0) return 1;
      if (iy < 0) return -1;
      return ix - iy;
    });
  }
}
function reorderCategory(from, to){
  let oc = state.order.categories.filter(c => c !== from && state.categories.has(c));
  for (const k of state.categories.keys()) if (!oc.includes(k) && k !== from) oc.push(k);
  const ti = oc.indexOf(to);
  oc.splice(ti < 0 ? oc.length : ti, 0, from);
  state.order.categories = oc;
  applyOrder(); renderCategories(); renderFiles(); saveOrder();
}
function reorderFile(target, before){
  if (target === state._fileDrag.node) return; // 自落（原地松手）无需调整
  const cat = target.category;
  const arr = state.categories.get(cat);
  if (!arr) return; // 目标分类不存在于索引（异常场景）直接放弃
  const from = arr.indexOf(state._fileDrag.node); // 用节点引用定位被拖文件，避免同名文件拖错
  if (from < 0) return;
  const [it] = arr.splice(from, 1);
  let ti = arr.indexOf(target);
  if (ti < 0) return; // target 不在同数组（异常场景）直接放弃，不兜底挤尾
  arr.splice(before ? ti : ti + 1, 0, it);
  state.order.files[cat] = arr.map(x => x.name);
  renderFiles(); renderCategories(); saveOrder();
}
function clearDropMarks(except){
  document.querySelectorAll('.cat-insert,.drop-before,.drop-after').forEach(el => { if (el !== except) el.classList.remove('cat-insert','drop-before','drop-after'); });
}
// 递归遍历：一级子目录名作为分类，根目录文件归「未分类」；跳过 . 开头与 git
async function walk(dirHandle, category, prefix){
  for await (const [name, entry] of dirHandle.entries()){
    if (name.startsWith('.') || name === 'git') continue;
    if (entry.kind === 'directory'){
      await walk(entry, category === null ? name : category, prefix + name + '/');
    } else {
      if (!isCodeFile(name)) continue;
      pushNode({ name, category: category === null ? '未分类' : category, handle: entry, file: null, content: null, path: prefix + name });
    }
  }
}
function pushNode(node){
  if (!state.categories.has(node.category)) state.categories.set(node.category, []);
  state.categories.get(node.category).push(node);
}
async function readContent(node){
  if (node.content != null) return node.content;
  if (node.file) { node.content = await node.file.text(); return node.content; } // 降级模式
  const fh = await node.handle.getFile();
  node.content = await fh.text();
  return node.content;
}
async function getCatDir(category){
  if (category === '未分类') return state.rootHandle;
  return state.rootHandle.getDirectoryHandle(category, { create:true });
}
async function writeFile(category, name, content){
  try{
    const dir = await getCatDir(category);
    const fh = await dir.getFileHandle(name, { create:true });
    const w = await fh.createWritable();
    await w.write(content);
    await w.close();
    return true;
  }catch(e){ toast('写入失败：' + e.message, true); return false; }
}
// 按相对路径（相对 rootHandle，如「分类/子目录/a.cpp」）定位父目录；无子目录时即 rootHandle
async function parentDirOf(path){
  const segs = path.split('/');
  segs.pop(); // 去掉文件名
  let dir = state.rootHandle;
  for (const seg of segs) dir = await dir.getDirectoryHandle(seg); // 不带 create
  return dir;
}
function baseNameOf(path){ return path.split('/').pop(); }
async function writeFileByPath(path, content){
  try{
    const dir = await parentDirOf(path);
    const fh = await dir.getFileHandle(baseNameOf(path), { create:true });
    const w = await fh.createWritable();
    await w.write(content);
    await w.close();
    return true;
  }catch(e){ toast('写入失败：' + e.message, true); return false; }
}
async function deleteFileByPath(path){
  const dir = await parentDirOf(path);
  await dir.removeEntry(baseNameOf(path));
}
async function renameFileByPath(path, newName){
  // 先按旧 path 逐级解析读出内容
  const oldDir = await parentDirOf(path);
  const oldName = baseNameOf(path);
  const oldFh = await oldDir.getFileHandle(oldName);
  const content = await (await oldFh.getFile()).text();
  // 写入前探测同名文件，防止静默覆盖
  try{ await oldDir.getFileHandle(newName); toast('已存在同名文件', true); return false; }
  catch(e){ if (e && e.name !== 'NotFoundError') throw e; }
  // 同一父目录内写新文件、删旧文件
  const fh = await oldDir.getFileHandle(newName, { create:true });
  const w = await fh.createWritable();
  await w.write(content);
  await w.close();
  await oldDir.removeEntry(oldName);
  return true;
}
function invalidCatName(name){
  if (!name) return '分类名不能为空';
  if (/[\\/:*?"<>|]/.test(name)) return '分类名不能包含 \\ / : * ? " < > |';
  if (name === '.' || name === '..') return '分类名不能为 . 或 ..';
  return '';
}
async function createCategory(name){
  name = (name || '').trim();
  const err = invalidCatName(name);
  if (err){ toast(err, true); return; }
  try{
    await state.rootHandle.getDirectoryHandle(name, { create:true });
    toast('已创建分类「' + name + '」');
    await scanDirectory();
  }catch(e){ toast('创建分类失败：' + e.message, true); }
}
async function deleteCategory(category){
  if (category === '未分类'){ toast('「未分类」不可删除', true); return; }
  if (!confirm('确定删除分类「' + category + '」及其全部文件？此操作不可恢复。')) return;
  try{
    await state.rootHandle.removeEntry(category, { recursive:true });
    if (state.currentCategory === category) state.currentCategory = null;
    if (state.selectedFile && state.selectedFile.category === category) state.selectedFile = null;
    // 先清理内存顺序并落盘（否则 scanDirectory→loadOrder 会从磁盘读回旧顺序）
    state.order.categories = state.order.categories.filter(c => c !== category);
    delete state.order.files[category];
    await saveOrder();
    toast('已删除分类「' + category + '」');
    await scanDirectory();
  }catch(e){ toast('删除分类失败：' + e.message, true); }
}
async function deleteFile(node){
  if (!confirm('确定删除文件「' + node.name + '」？')) return;
  try{
    await deleteFileByPath(node.path); // 按 node.path 定位（支持深层子目录）
    if (state.selectedFile === node) state.selectedFile = null;
    toast('已删除 ' + node.name);
    await scanDirectory();
  }catch(e){ toast('删除失败：' + e.message, true); }
}
async function renameFile(node, newName){
  newName = (newName || '').trim();
  if (!newName || /[\\/:*?"<>|]/.test(newName)){ toast('文件名不合法', true); return false; }
  try{
    if (!await renameFileByPath(node.path, newName)) return false; // 同一父目录内重命名
    if (state.selectedFile === node) state.selectedFile = null;
    // 同步自定义顺序里的旧文件名（先改内存 → 落盘 → 再扫描，避免 loadOrder 读回旧名）
    const ord = state.order.files[node.category];
    if (ord){
      const i = ord.indexOf(node.name);
      if (i >= 0) ord[i] = newName;
      await saveOrder();
    }
    toast('已重命名为 ' + newName);
    await scanDirectory();
    return true;
  }catch(e){ toast('重命名失败：' + e.message, true); return false; }
}
async function uploadFiles(category, files){
  const list = [...files].filter(f => isCodeFile(f.name));
  const skipped = files.length - list.length;
  if (!list.length){ toast('没有可导入的代码文件', true); return; }
  let ok = 0;
  for (const f of list){
    const text = await f.text();
    if (await writeFile(category, f.name, text)) ok++;
  }
  toast('已导入 ' + ok + '/' + list.length + ' 个文件到「' + category + '」' + (skipped ? '（跳过 ' + skipped + ' 个非代码文件）' : ''));
  await scanDirectory();
}
// 降级模式：从 folderInput 的 File 列表构建只读索引
function importFromFiles(files){
  state.categories = new Map();
  state.order = { categories:[], files:{} }; // 降级只读，不持久化自定义顺序
  state.selectedFile = null; state.currentCategory = null;
  let n = 0;
  for (const f of files){
    let parts = (f.webkitRelativePath || f.name).split('/');
    if (parts.length > 1) parts = parts.slice(1); // 去掉所选目录名本身
    const dirs = parts.slice(0, -1);
    if (dirs.some(seg => seg.startsWith('.') || seg === 'git')) continue; // 跳过隐藏目录 / git
    const name = parts[parts.length - 1];
    if (name.startsWith('.') || !isCodeFile(name)) continue;
    pushNode({ name, category: dirs.length ? dirs[0] : '未分类', handle: null, file: f, content: null, path: parts.join('/') });
    n++;
  }
  for (const arr of state.categories.values()) arr.sort((a, b) => a.name.localeCompare(b.name));
  updateCount(); renderCategories(); renderFiles(); renderPreview();
  toast('已导入 ' + n + ' 个代码文件（只读模式）');
}

/* ================= 3. 语法高亮器（占位符法） ================= */
function escapeHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
const KW = {
  c: ('auto break case const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while bool true false nullptr NULL class namespace template typename using public private protected virtual new delete operator try catch throw this std size_t uint64_t int64_t').split(/\s+/),
  py: ('and as assert async await break class continue def del elif else False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield print self range len').split(/\s+/),
  java: ('abstract boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while var record true false null').split(/\s+/)
};
function langOf(ext){
  if (ext === 'py') return 'py';
  if (['java','js','ts','go','rs','rb','kt'].includes(ext)) return 'java';
  return 'c'; // c/cpp/h/pas 等统一按 C 系处理
}
const kwReCache = {};
function kwRegex(lang){
  if (!kwReCache[lang]) kwReCache[lang] = new RegExp('\\b(?:' + KW[lang].join('|') + ')\\b', 'g');
  return kwReCache[lang];
}
// 高亮流程：先把字符串/注释提取为 \u0000 编号占位符（编号用大写字母编码：关键字表全为小写
// 且正则无 i 标志，可避免占位符被关键字规则污染；两侧 \u0000 定界确保还原不误配真实文本），
// 再对剩余文本转义并处理关键字/数字，最后还原占位符
function highlight(code, ext){
  const lang = langOf(ext);
  const store = [];
  const stash = (raw, cls) => raw.split('\n').map(part => {
    store.push('<span class="tok-' + cls + '">' + escapeHtml(part) + '</span>');
    return '\u0000' + String(store.length - 1).replace(/\d/g, d => String.fromCharCode(65 + +d)) + '\u0000';
  }).join('\n');
  let s = code;
  s = s.replace(/(?<=\d)'(?=\d)/g, '\u0001'); // C++14 数字分隔符先占位，避免被当成字符字面量
  if (ext === 'py') s = s.replace(/"""[\s\S]*?"""|'''[\s\S]*?'''/g, m => stash(m, 'str')); // Python 三引号
  s = s.replace(/"(?:[^"\\\n]|\\[\s\S])*"/g, m => stash(m, 'str'));   // 双引号字符串
  s = s.replace(/'(?:[^'\\\n]|\\[\s\S])*'/g, m => stash(m, 'str'));   // 单引号字符串
  s = s.replace(/\/\*[\s\S]*?\*\//g, m => stash(m, 'cmt'));           // 块注释
  s = s.replace(/\/\/[^\n]*/g, m => stash(m, 'cmt'));                 // 行注释
  if (ext === 'py' || ext === 'rb') s = s.replace(/#[^\n]*/g, m => stash(m, 'cmt')); // 脚本系 # 注释
  if (lang === 'c') s = s.replace(/^[ \t]*#\s*\w+/gm, m => stash(m, 'pre'));         // C 系预处理指令
  s = escapeHtml(s);                                                  // 剩余文本统一转义
  s = s.replace(kwRegex(lang), m => '<span class="tok-kw">' + m + '</span>');        // 关键字先于数字
  s = s.replace(/(^|[^\w&#])(0[xX][0-9a-fA-F]+|\d+(?:\.\d+)?)/gm,
    (m, p, n) => p + '<span class="tok-num">' + n + '</span>');       // 排除 &#39; 中转义产生的数字
  // 循环还原：注释可能吞入字符串占位符形成嵌套，单遍 replace 不会重扫替换产物
  for (let i = 0; i < 50 && /\u0000[A-Z]+\u0000/.test(s); i++){
    s = s.replace(/\u0000([A-Z]+)\u0000/g, (_, id) =>
      store[parseInt(id.split('').map(c => c.charCodeAt(0) - 65).join(''), 10)]);
  }
  return s.replace(/\u0001/g, "'");
}

/* ================= 4. UI 渲染层 ================= */
function updateCount(){
  $('#fileCount').textContent = countFiles() ? (countFiles() + ' 个文件 · ' + state.categories.size + ' 个分类') : '';
}
function countFiles(){
  let n = 0;
  for (const arr of state.categories.values()) n += arr.length;
  return n;
}
function renderCategories(){
  const ul = $('#categoryList');
  ul.innerHTML = '';
  if (!state.categories.size){
    ul.innerHTML = '<li class="empty">暂无分类<br>请先选择模板目录</li>';
    return;
  }
  const all = document.createElement('li');
  all.className = 'cat' + (state.currentCategory === null ? ' active' : '');
  all.innerHTML = '<span class="cat-name">全部</span><span class="cat-n">' + countFiles() + '</span>';
  all.onclick = () => { state.currentCategory = null; renderCategories(); renderFiles(); };
  ul.appendChild(all);
  const cats = [...state.categories.keys()]; // 顺序已由 applyOrder 决定（自定义序优先）
  for (const cat of cats){
    const files = state.categories.get(cat);
    const li = document.createElement('li');
    li.className = 'cat' + (state.currentCategory === cat ? ' active' : '');
    li.innerHTML = '<span class="cat-name">' + escapeHtml(cat) + '</span><span class="cat-n">' + files.length + '</span>'
      + (cat !== '未分类' && !state.degraded ? '<button class="mini danger cat-del" title="删除分类">×</button>' : '');
    li.onclick = e => {
      if (e.target.closest('.cat-del')) return;
      state.currentCategory = cat; renderCategories(); renderFiles();
    };
    const del = li.querySelector('.cat-del');
    if (del) del.onclick = e => { e.stopPropagation(); deleteCategory(cat); };
    if (!state.degraded){
      li.draggable = true; // 分类项支持拖拽排序
      li.addEventListener('dragstart', e => {
        state._catDrag = cat;
        state._fileDrag = null; // 互清对方指针，防 dragend 丢失时状态残留
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'cat');
      });
      li.addEventListener('dragend', () => { state._catDrag = null; clearDropMarks(); });
      li.ondragover = e => {
        if (state._catDrag){ // 内部拖拽：排序插入标记
          if (state._catDrag === cat) return;
          e.preventDefault(); e.stopPropagation();
          li.classList.add('cat-insert');
          return;
        }
        if (state._fileDrag) return; // 文件排序拖拽经过时不显示上传高亮
        e.preventDefault(); li.classList.add('drag'); // 外部文件拖入上传高亮
      };
      li.ondragleave = () => li.classList.remove('drag', 'cat-insert');
      li.ondrop = e => {
        e.preventDefault(); li.classList.remove('drag', 'cat-insert');
        if (state._catDrag){ // 内部拖拽：移动分类顺序
          e.stopPropagation();
          if (state._catDrag !== cat) reorderCategory(state._catDrag, cat);
          state._catDrag = null;
          return;
        }
        if (state._fileDrag) return; // 文件排序拖拽落到分类项上不触发上传
        if (e.dataTransfer.files.length) uploadFiles(cat, e.dataTransfer.files); // 外部文件上传
      };
    }
    ul.appendChild(li);
  }
}
function renderFiles(){
  const ul = $('#fileList');
  ul.innerHTML = '';
  const q = state.search.trim().toLowerCase();
  const items = [];
  for (const [cat, files] of state.categories){
    if (state.currentCategory && cat !== state.currentCategory) continue;
    for (const f of files){
      if (q){
        const inName = f.name.toLowerCase().includes(q);
        const inContent = f.content != null && f.content.toLowerCase().includes(q); // 内容仅匹配已加载文件
        if (!inName && !inContent) continue;
      }
      items.push(f);
    }
  }
  if (!items.length){ ul.innerHTML = '<li class="empty">' + (state.categories.size ? '无匹配文件' : '暂无文件') + '</li>'; return; }
  const canReorder = !!state.currentCategory && !state.degraded && !state.search.trim(); // 仅具体分类、非降级、非搜索时可排序
  for (const f of items){
    const li = document.createElement('li');
    li.className = 'fitem' + (state.selectedFile === f ? ' active' : '');
    li.innerHTML = '<span class="ficon">' + escapeHtml(extOf(f.name) || 'txt') + '</span>'
      + '<span class="fname">' + escapeHtml(f.name) + '</span>'
      + (state.currentCategory ? '' : '<span class="fcat">' + escapeHtml(f.category) + '</span>');
    li.onclick = () => { state.selectedFile = f; renderFiles(); renderPreview(); };
    if (canReorder){
      li.draggable = true;
      li.addEventListener('dragstart', e => {
        state._fileDrag = { cat: f.category, node: f }; // 存节点引用，避免同名文件拖错
        state._catDrag = null; // 互清对方指针，防 dragend 丢失时状态残留
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'file');
      });
      li.addEventListener('dragend', () => { state._fileDrag = null; clearDropMarks(); });
      li.addEventListener('dragover', e => {
        if (!state._fileDrag || state._fileDrag.cat !== f.category) return;
        e.preventDefault(); e.stopPropagation();
        const r = li.getBoundingClientRect();
        clearDropMarks(li); // 先清全部标记再对自身 toggle，保证互斥
        li.classList.toggle('drop-before', e.clientY < r.top + r.height / 2);
        li.classList.toggle('drop-after', e.clientY >= r.top + r.height / 2);
      });
      li.addEventListener('drop', e => {
        if (!state._fileDrag || state._fileDrag.cat !== f.category) return;
        e.preventDefault(); e.stopPropagation();
        reorderFile(f, e.clientY < li.getBoundingClientRect().top + li.offsetHeight / 2);
        state._fileDrag = null;
      });
    }
    ul.appendChild(li);
  }
}
function renderMeta(node){
  const meta = $('#previewMeta');
  if (!node){ meta.innerHTML = '<span class="dim">在左侧选择文件查看代码</span>'; return; }
  const lines = node.content != null ? node.content.split('\n').length : 0;
  let btns = '';
  if (!state.degraded){
    btns = state.editing
      ? '<button class="mini pri" id="btnSaveEdit">保存</button><button class="mini" id="btnCancelEdit">取消</button>'
      : '<button class="mini" id="btnEdit">编辑</button><button class="mini" id="btnRename">重命名</button><button class="mini danger" id="btnDel">删除</button><button class="mini" id="btnTheme"></button><button class="mini" id="btnLinkNode">关联知识点</button>';
  }
  meta.innerHTML = '<b class="mname">' + escapeHtml(node.name) + '</b>'
    + '<span id="metaLink"></span>'
    + '<span class="dim">' + escapeHtml(node.category) + ' · ' + lines + ' 行</span>'
    + '<span class="mbtns">' + btns + '</span>';
  const be = $('#btnEdit');       if (be) be.onclick = startEdit;
  const bs = $('#btnSaveEdit');   if (bs) bs.onclick = saveEdit;
  const bc = $('#btnCancelEdit'); if (bc) bc.onclick = cancelEdit;
  const br = $('#btnRename');     if (br) br.onclick = () => askRename(node);
  const bd = $('#btnDel');        if (bd) bd.onclick = () => deleteFile(node);
  const bt = $('#btnTheme');
  if (bt){
    bt.textContent = document.body.classList.contains('theme-light') ? '深色' : '浅色';
    bt.onclick = () => {
      const light = document.body.classList.toggle('theme-light');
      try{ localStorage.setItem('codeTheme', light ? 'light' : 'dark'); }catch(e){} // 隐私模式等场景下可能抛错
      bt.textContent = light ? '深色' : '浅色';
    };
  }
  const bl = $('#btnLinkNode');
  if (bl) bl.onclick = () => openNodePicker(node);
  refreshMetaLink(node);
}
function refreshMetaLink(node){
  const el = $('#metaLink');
  if (!el || !node) return;
  const lid = getLinks().paths[node.path];
  if (!lid){ el.textContent = ''; return; }
  getLeaves(list => {
    if (state.selectedFile !== node) return;
    const nm = (list.find(x => x.id === lid) || {}).name;
    el.innerHTML = '<button class="mini pri" id="btnViewNode" title="跳转到技能树">📚 ' + (nm ? escapeHtml(nm) : lid) + '</button>'
      + '<button class="mini danger" id="btnUnlinkNode" title="解除关联">×</button>';
    const bv = $('#btnViewNode'); if (bv) bv.onclick = () => { switchView('tree'); postTree({ type:'selectNode', id: lid }); };
    const bu = $('#btnUnlinkNode'); if (bu) bu.onclick = () => {
      const L = getLinks();
      L.nodes[lid] = (L.nodes[lid] || []).filter(p => p !== node.path);
      if (!L.nodes[lid].length) delete L.nodes[lid];
      delete L.paths[node.path];
      setLinks(L); refreshMetaLink(node);
    };
  });
}
function openNodePicker(node){
  getLeaves(list => {
    if (state.selectedFile !== node) return;
    const groups = new Map();
    list.forEach(x => { if (!groups.has(x.group)) groups.set(x.group, []); groups.get(x.group).push(x); });
    const linked = getLinks().paths[node.path];
    const rows = [...groups.entries()].map(([g, xs]) =>
      '<p class="dim">' + escapeHtml(g) + '</p>'
      + xs.map(x => '<label class="opt"><input type="radio" name="npk" value="' + escapeHtml(x.id) + '"'
        + (x.id === linked ? ' checked' : '') + '> <span class="tag-like">' + (['','铜','银','金'][x.tier] || '') + '</span> ' + escapeHtml(x.name) + '</label>').join('')
    ).join('');
    openModal('<h3>关联知识点</h3><p class="dim">为该模板选择对应技能树知识点（可后续修改）</p>' + rows
      + '<label class="opt">解除关联：<input type="checkbox" id="npkClear"></label>',
      () => {
        const clear = $('#npkClear') && $('#npkClear').checked;
        const sel = document.querySelector('input[name="npk"]:checked');
        const L = getLinks();
        const old = L.paths[node.path];
        if (old){ L.nodes[old] = (L.nodes[old] || []).filter(p => p !== node.path); if (!L.nodes[old].length) delete L.nodes[old]; delete L.paths[node.path]; }
        if (!clear && sel){
          const id = sel.value;
          if (!L.nodes[id]) L.nodes[id] = [];
          if (!L.nodes[id].includes(node.path)) L.nodes[id].push(node.path);
          L.paths[node.path] = id;
        }
        setLinks(L);
        toast(clear ? '已解除关联' : '已关联知识点');
        refreshMetaLink(node);
      }, true);
  });
}
async function renderPreview(){
  const node = state.selectedFile;
  state.editing = false;
  $('#editArea').classList.add('hidden');
  $('#codeView').classList.remove('hidden');
  if (!node){ renderMeta(null); $('#codeView').querySelector('code').innerHTML = ''; return; }
  try{
    const content = await readContent(node);
    if (state.selectedFile !== node) return; // 期间用户已切换文件
    renderMeta(node);
    const lines = highlight(content, extOf(node.name)).split('\n').map(l => '<div class="ln">' + (l || ' ') + '</div>').join('');
    $('#codeView').querySelector('code').innerHTML = lines;
  }catch(e){ toast('读取文件失败：' + e.message, true); }
}
function startEdit(){
  const node = state.selectedFile;
  if (!node) return;
  state.editing = true;
  renderMeta(node);
  $('#codeView').classList.add('hidden');
  const ta = $('#editArea');
  ta.value = node.content ?? '';
  ta.classList.remove('hidden');
  ta.focus();
}
async function saveEdit(){
  const node = state.selectedFile;
  if (!node) return;
  const ta = $('#editArea');
  if (!await writeFileByPath(node.path, ta.value)) return; // 按 node.path 写回原位置
  node.content = ta.value;
  toast('已保存 ' + node.name);
  renderPreview();
}
function cancelEdit(){ renderPreview(); }
function askRename(node){
  openModal('<h3>重命名文件</h3><label>新文件名<input id="renName" value="' + escapeHtml(node.name) + '"></label><p class="dim">请保留扩展名，否则高亮会失效</p>',
    async () => {
      const v = $('#renName').value;
      if (!v.trim() || v.trim() === node.name) return false;
      return await renameFile(node, v);
    });
}
// 新建模板：① 选分类 → ② 命名 → ③ 代码来源（粘贴 / 上传）
function openNewTemplateModal(prefillCode){
  if (!state.rootHandle){ toast('请先选择模板目录', true); return; } // 降级模式下按钮已隐藏，全局粘贴另行守卫
  let tplFileObj = null; // 所选代码文件（file 来源模式）
  const cats = [...state.categories.keys()];
  const curOk = cats.includes(state.currentCategory);
  const radios = cats.length
    ? cats.map((c, i) => '<label class="opt"><input type="radio" name="tplcat" value="' + escapeHtml(c) + '"' + (c === state.currentCategory || (!curOk && i === 0) ? ' checked' : '') + '> ' + escapeHtml(c) + '</label>').join('')
    : '<p class="dim">暂无分类，将保存到「未分类」</p>';
  openModal('<h3>新建模板</h3>'
    + '<p class="dim">① 选择分类</p>'
    + radios
    + '<label class="opt">新建分类：<input type="text" id="tplNewCat" placeholder="填写则优先使用"></label>'
    + '<p class="dim">② 命名模板</p>'
    + '<label>模板名<input id="tplName" placeholder="如 segtree.cpp"></label>'
    + '<p class="dim">扩展名决定语法高亮（.cpp/.py/.java 等）</p>'
    + '<p class="dim">③ 选择代码来源</p>'
    + '<label class="opt"><input type="radio" name="tplsrc" value="paste" checked> 粘贴代码</label>'
    + '<label class="opt"><input type="radio" name="tplsrc" value="file"> 上传文件</label>'
    + '<textarea id="tplCode" placeholder="在此粘贴代码…" spellcheck="false"></textarea>'
    + '<div id="tplFileRow" class="hidden"><button type="button" class="mini" id="tplFileBtn">选择代码文件…</button><span id="tplFileName" class="dim"></span></div>',
    async () => {
      const name = $('#tplName').value.trim();
      if (!name || /[\\/:*?"<>|]/.test(name)){ toast('文件名不合法', true); return false; }
      if (!isCodeFile(name)){ toast('仅支持代码文件（' + CODE_EXTS.join('/') + '），请补全扩展名', true); return false; }
      if (name.startsWith('.')){ toast('文件名不能以 . 开头', true); return false; }
      if (/[. ]$/.test(name)){ toast('文件名不能以点号或空格结尾', true); return false; }
      let cat;
      const nc = $('#tplNewCat').value.trim();
      if (nc){
        const err = invalidCatName(nc);
        if (err){ toast(err, true); return false; }
        cat = nc;
      } else {
        const sel = document.querySelector('input[name="tplcat"]:checked');
        cat = (sel && sel.value) || '未分类';
      }
      // 内容获取：粘贴文本或所选文件
      const src = document.querySelector('input[name="tplsrc"]:checked').value;
      let code;
      if (src === 'file'){
        if (!tplFileObj){ toast('请先选择代码文件', true); return false; }
        code = await tplFileObj.text();
      } else {
        code = $('#tplCode').value;
      }
      if (!code){ toast('代码不能为空', true); return false; }
      // 覆盖探测：不经过 getCatDir（避免 create:true 隐式建出空分类）；分类不存在则必然无同名文件
      let existDir = null;
      try{ existDir = cat === '未分类' ? state.rootHandle : await state.rootHandle.getDirectoryHandle(cat); }
      catch(e){ existDir = null; }
      if (existDir){
        try{ await existDir.getFileHandle(name); if (!confirm('「' + name + '」已存在，是否覆盖？')) return false; }
        catch(e){ if (e && e.name !== 'NotFoundError') throw e; }
      }
      if (!await writeFile(cat, name, code)) return false;
      await scanDirectory();
      const arr = state.categories.get(cat);
      const expectPath = cat === '未分类' ? name : cat + '/' + name;
      const nf = arr && arr.find(x => x.path === expectPath); // 按 path 精确匹配，避免深层同名文件误选
      if (nf){ state.selectedFile = nf; state.currentCategory = cat; }
      renderCategories(); renderFiles(); renderPreview();
      toast('已保存 ' + name);
      return true;
    }, true);
  $('#tplCode').value = prefillCode || ''; // 全局粘贴带入剪贴板内容
  setTimeout(() => { const tn = $('#tplName'); if (tn) tn.focus(); }, 40); // 稍晚于 openModal 默认聚焦，覆盖为模板名输入框
  // 来源切换：粘贴 / 上传
  const codeBox = $('#tplCode'), fileRow = $('#tplFileRow');
  document.querySelectorAll('input[name="tplsrc"]').forEach(r => r.onchange = () => {
    const useFile = r.value === 'file' && r.checked;
    if (r.checked){
      codeBox.classList.toggle('hidden', useFile);
      fileRow.classList.toggle('hidden', !useFile);
    }
  });
  // 模态内动态文件选择：选中后自动补全模板名
  const fi = document.createElement('input');
  fi.type = 'file'; fi.hidden = true;
  fi.accept = '.' + CODE_EXTS.join(',.'); // 文件选择器优先展示代码文件
  $('#modalBody').appendChild(fi);
  $('#tplFileBtn').onclick = () => fi.click();
  fi.onchange = e => {
    tplFileObj = e.target.files[0] || null;
    $('#tplFileName').textContent = tplFileObj ? tplFileObj.name : '';
    if (tplFileObj && !$('#tplName').value.trim()) $('#tplName').value = tplFileObj.name;
  };
}
/* ---- 通用模态框 ---- */
function openModal(html, onOk, wide){
  $('#modalBody').innerHTML = html;
  $('#modal').classList.remove('hidden');
  $('#modalBox').classList.toggle('wide', !!wide);
  $('#modal')._onOk = onOk || null;
  setTimeout(() => { const i = $('#modalBody').querySelector('input,select'); if (i) i.focus(); }, 30);
}
function closeModal(){
  $('#modal').classList.add('hidden');
  $('#modalBox').classList.remove('wide');
  $('#modalBody').innerHTML = '';
  $('#modal')._onOk = null;
}
function toast(msg, isErr){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.toggle('err', !!isErr);
  t.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove('show'), 2600);
}
function bindEvents(){
  $('#btnPickDir').onclick = () => state.degraded ? $('#folderInput').click() : pickDirectory();
  $('#btnNew').onclick = () => {
    if (!state.rootHandle){ toast('请先选择模板目录', true); return; }
    openNewTemplateModal('');
  };
  $('#btnNewCat').onclick = () => {
    if (!state.rootHandle){ toast('请先选择模板目录', true); return; }
    openModal('<h3>新建分类</h3><label>分类名<input id="catName" placeholder="如：图论 / 数据结构"></label>',
      async () => { const v = $('#catName').value.trim(); if (!v) return false; createCategory(v); });
  };
  $('#btnPrint').onclick = openPrintOptions;
  $('#searchBox').oninput = e => { state.search = e.target.value; renderFiles(); };
  $('#folderInput').onchange = e => {
    const files = [...e.target.files];
    e.target.value = '';
    if (files.length) importFromFiles(files);
  };
  $('#modalOk').onclick = async () => {
    $('#modalOk').disabled = true; // 防重入：onOk 执行期间禁用确定按钮
    try{
      const fn = $('#modal')._onOk;
      if (!fn) return closeModal();
      try{ const r = await fn(); if (r !== false) closeModal(); }
      catch(e){ toast('操作失败：' + e.message, true); }
    } finally {
      $('#modalOk').disabled = false;
    }
  };
  $('#modalCancel').onclick = closeModal;
  $('#modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  // 文件面板整块接受拖拽上传到当前分类
  const fp = $('#filePanel');
  fp.addEventListener('dragover', e => {
    if (state._fileDrag || state._catDrag) return; // 内部拖拽（文件排序/分类排序）不触发面板上传高亮
    e.preventDefault(); fp.classList.add('drag');
  });
  fp.addEventListener('dragleave', () => fp.classList.remove('drag'));
  fp.addEventListener('drop', e => {
    if (state._fileDrag || state._catDrag) return; // 内部拖拽交给对应项处理
    e.preventDefault(); fp.classList.remove('drag');
    if (state.degraded) return;
    if (!state.rootHandle){ toast('请先选择模板目录', true); return; }
    if (e.dataTransfer.files.length) uploadFiles(state.currentCategory || '未分类', e.dataTransfer.files);
  });
  // 全局粘贴：焦点不在输入控件时直接弹出粘贴代码弹窗（Ctrl+V）
  document.addEventListener('paste', e => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (!$('#modal').classList.contains('hidden')) return; // 已有模态打开时不顶掉
    if (state.degraded){ toast('只读模式不支持写入', true); return; }
    if (!state.rootHandle){ toast('请先选择模板目录', true); return; }
    const text = (e.clipboardData || window.clipboardData).getData('text');
    if (text && text.trim()){ e.preventDefault(); openNewTemplateModal(text); }
  });
}

/* ================= 5. 打印引擎 ================= */
function openPrintOptions(){
  if (!countFiles()){ toast('暂无文件可打印，请先选择目录或导入文件', true); return; }
  openModal(
    '<h3>打印选项</h3>'
    + '<label>标题<input id="optTitle" value="ACM 算法模板集"></label>'
    + '<label>列数<select id="optCols"><option value="1">单栏</option><option value="2">双栏</option></select></label>'
    + '<label>字号<select id="optFont"><option value="10">小</option><option value="12" selected>中</option><option value="14">大</option></select></label>'
    + '<label class="chk"><input type="checkbox" id="optNewPage"> 每个文件新起一页</label>'
    + '<label class="chk"><input type="checkbox" id="optToc" checked> 包含目录</label>',
    async () => {
      const o = {
        title: $('#optTitle').value.trim() || 'ACM 算法模板集',
        cols: +$('#optCols').value,
        font: +$('#optFont').value,
        newPage: $('#optNewPage').checked,
        toc: $('#optToc').checked
      };
      const html = await buildPrintHTML(o);
      const url = URL.createObjectURL(new Blob([html], { type:'text/html' }));
      if (state.degraded){
        const a = document.createElement('a');
        a.href = url; a.download = 'acm-print.html'; a.click();
        toast('已导出打印视图 HTML，用浏览器打开后点击页内「打印」按钮');
      } else {
        openPrintOverlay(url);
      }
    });
}
function openPrintOverlay(url){
  $('#printFrame').src = url;
  $('#printOverlay').classList.remove('hidden');
}
$('#printClose').onclick = () => {
  $('#printOverlay').classList.add('hidden');
  $('#printFrame').src = 'about:blank';
};
$('#printDo').onclick = () => {
  try{
    const fw = $('#printFrame').contentWindow;
    fw.focus();
    fw.print();
  }catch(e){ toast('打印调用失败，请重试', true); }
};
async function buildPrintHTML(o){
  const cats = [...state.categories.entries()].filter(([, fs]) => fs.length);
  let tocHtml = '', bodyHtml = '', nf = 0, nl = 0;
  for (const [cat, files] of cats){
    let chap = '';
    for (const f of files){
      const code = await readContent(f);
      nl += code ? code.split('\n').length : 0;
      nf++;
      const lines = highlight(code, extOf(f.name)).split('\n').map(l => '<div class="ln">' + (l || ' ') + '</div>').join('');
      chap += '<section class="tpl"><h3 class="pfname">' + escapeHtml(f.name) + '</h3><pre class="code">' + lines + '</pre></section>';
    }
    bodyHtml += '<section class="chapter"><h2 class="ptitle">' + escapeHtml(cat) + '</h2>' + chap + '</section>';
    tocHtml += '<li><span class="tcat">' + escapeHtml(cat) + '（' + files.length + '）</span><ul class="tfiles">'
      + files.map(f => '<li>' + escapeHtml(f.name) + '</li>').join('') + '</ul></li>';
  }
  const date = new Date().toLocaleString('zh-CN');
  // 页眉不使用 position:fixed（不占文档流，第 2 页起会与正文重叠）；
  // 页眉页脚/页码交给浏览器打印对话框自带选项
  const css = [
    '@page{size:' + (o.cols === 2 ? 'A4 landscape' : 'A4') + ';margin:16mm 12mm}',
    '*{box-sizing:border-box}',
    'body{margin:0;padding:24px 28px;font-family:"Segoe UI","Microsoft YaHei",sans-serif;color:#1c2733;background:#fff}',
    '.toolbar{position:sticky;top:0;z-index:9;display:flex;justify-content:space-between;align-items:center;gap:12px;background:#1f2937;color:#fff;padding:10px 16px;border-radius:8px;margin-bottom:18px;font-size:13px}',
    '.toolbar button{background:#2563eb;border:0;color:#fff;padding:7px 22px;font-size:14px;border-radius:6px;cursor:pointer}',
    '.toolbar button:hover{background:#1d4ed8}',
    '@media print{.toolbar{display:none}}',
    '.cover{min-height:' + (o.cols === 2 ? '150mm' : '230mm') + ';display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;break-after:page}',
    '.cover h1{font-size:30pt;margin:0 0 14mm}',
    '.cover p{color:#555;margin:3mm 0;font-size:12pt}',
    '.toc{break-after:page}',
    '.ptitle{font-size:16pt;border-bottom:2pt solid #1f2937;padding-bottom:2mm;margin:0 0 5mm}',
    '.toc ul{list-style:none;padding-left:0}',
    '.tcat{font-weight:600;font-size:12pt}',
    '.tfiles{padding-left:6mm}',
    '.tfiles li{font-size:10.5pt;color:#333;line-height:1.9}',
    '.chapter{break-before:page}',
    '.tpl{break-inside:avoid}',
    '.tpl .pfname{font-size:11.5pt;background:#eef2f7;padding:2mm 3mm;border-left:3mm solid #2563eb;margin:6mm 0 0}',
    'pre.code{white-space:pre-wrap;overflow-wrap:anywhere;margin:0;padding:2mm 2mm;border:.5pt solid #d0d7de;border-radius:2mm;background:#fff;tab-size:4;font-family:Consolas,"Courier New",monospace;font-size:' + o.font + 'px;line-height:1.45;counter-reset:ln}',
    'pre.code .ln{counter-increment:ln;min-height:1.45em}',
    'pre.code .ln::before{content:counter(ln);display:inline-block;width:2.4em;text-align:right;border-right:.5pt solid #e4e9f0;padding-right:1em;margin-right:1.4em;color:#9aa4b0;user-select:none}',
    '.two pre.code{columns:2;column-gap:6mm;column-fill:auto}',
    '.two .tpl{break-inside:auto}',
    '.tok-cmt{color:#6e7781}',
    '.tok-str{color:#0a3069}',
    '.tok-pre{color:#8250df}',
    '.tok-num{color:#0550ae}',
    '.tok-kw{color:#cf222e}'
  ].join('\n');
  const extra = o.newPage ? '\n.tpl{break-before:page;break-inside:auto}' : '';
  return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>' + escapeHtml(o.title) + '</title>'
    + '<style>' + css + extra + '</style></head>'
    + '<body class="' + (o.cols === 2 ? 'two' : '') + '">'
    + '<div class="toolbar"><span>' + escapeHtml(o.title) + ' · 生成于 ' + date + '</span>'
    + '<button onclick="window.print()">打印 / 保存为 PDF</button></div>'
    + '<section class="cover"><h1>' + escapeHtml(o.title) + '</h1>'
    + '<p>生成日期：' + date + '</p>'
    + '<p>共 ' + cats.length + ' 个分类 · ' + nf + ' 个模板 · ' + nl + ' 行代码</p></section>'
    + (o.toc ? '<section class="toc"><h2 class="ptitle">目录</h2><ul>' + tocHtml + '</ul></section>' : '')
    + bodyHtml
    + '</body></html>';
}

/* ================= 6. 初始化与降级模式 ================= */
async function init(){
  bindEvents();
  try{ if (localStorage.getItem('codeTheme') === 'light') document.body.classList.add('theme-light'); }catch(e){}
  if (!('showDirectoryPicker' in window)){
    state.degraded = true;
    document.body.classList.add('degraded');
    $('#degradedBar').classList.remove('hidden');
    $('#dirLabel').textContent = '只读模式';
  } else {
    try{
      const h = await loadHandle();
      if (h){
        if (await verifyPermission(h)){
          state.rootHandle = h;
          $('#dirLabel').textContent = h.name;
          await scanDirectory();
        } else {
          toast('上次目录的访问权限已失效，请重新选择目录', true);
        }
      }
    }catch(e){ toast('恢复上次目录失败，请重新选择', true); }
  }
  renderCategories(); renderFiles(); renderPreview();
}
init();

/* ================= 视图切换 ================= */
function switchView(v){
  const tpl = v === 'tpl';
  $('#viewTpl').classList.toggle('hidden', !tpl);
  $('#viewTree').classList.toggle('hidden', tpl);
  $('#swTpl').classList.toggle('active', tpl);
  $('#swTree').classList.toggle('active', !tpl);
}
$('#swTpl').onclick = () => switchView('tpl');
$('#swTree').onclick = () => switchView('tree');

/* ================= 技能树桥接 ================= */
const LINK_KEY = 'acm_link_map';
function getLinks(){ try{ const o = JSON.parse(localStorage.getItem(LINK_KEY)); return (o && typeof o === 'object') ? { paths: o.paths||{}, nodes: o.nodes||{} } : { paths:{}, nodes:{} }; }catch(e){ return { paths:{}, nodes:{} }; } }
function setLinks(L){ try{ localStorage.setItem(LINK_KEY, JSON.stringify(L)); }catch(e){} postTree({ type:'linksChanged' }); }
function postTree(msg){ const f = document.getElementById('treeFrame'); try{ (f && f.contentWindow ? f.contentWindow : window).postMessage(Object.assign({ src:'acm-bridge' }, msg), '*'); }catch(e){} }
let treeReady = false, treeWaiters = [];
function whenTreeReady(fn){ if (treeReady) fn(); else treeWaiters.push(fn); }
let leafCache = null, leafWaiters = [], reqSeq = 0, leafReqs = {};
function getLeaves(cb){
  if (leafCache) return cb(leafCache);
  leafWaiters.push(cb);
  if (leafWaiters.length > 1) return;
  whenTreeReady(() => {
    const req = ++reqSeq;
    leafReqs[req] = list => { leafCache = list; const ws = leafWaiters; leafWaiters = []; ws.forEach(f => f(list)); };
    postTree({ type:'getLeaves', req });
  });
}
function allTemplatePaths(){
  const a = [];
  for (const arr of state.categories.values()) for (const f of arr) a.push(f.path);
  return a;
}
function pruneLinks(){
  if (state.degraded) return; // 降级导入可能不完整，不修剪
  const paths = allTemplatePaths();
  if (!paths.length) return; // 扫描结果为空时禁止修剪：误选空目录/掉盘/授权失效时保护历史关联
  const valid = new Set(paths);
  const L = getLinks();
  let dirty = false;
  for (const p of Object.keys(L.paths)){
    if (valid.has(p)) continue;
    const id = L.paths[p];
    delete L.paths[p]; dirty = true;
    if (L.nodes[id]){
      L.nodes[id] = L.nodes[id].filter(x => x !== p);
      if (!L.nodes[id].length) delete L.nodes[id];
    }
  }
  for (const id of Object.keys(L.nodes)) L.nodes[id] = (L.nodes[id] || []).filter(p => valid.has(p));
  if (dirty){ try{ localStorage.setItem(LINK_KEY, JSON.stringify(L)); }catch(e){} postTree({ type:'linksChanged' }); }
}
function openTemplateByPath(path){
  switchView('tpl');
  if (!path) return;
  const segs = path.split('/');
  const cat = segs.length > 1 ? segs[0] : '未分类';
  const arr = state.categories.get(cat);
  const f = arr && arr.find(x => x.path === path);
  if (!f){ toast('找不到模板：' + path + '（可能已改名或未选择该目录）', true); return; }
  state.search = ''; $('#searchBox').value = '';
  state.currentCategory = cat; state.selectedFile = f;
  renderCategories(); renderFiles(); renderPreview();
}
window.addEventListener('message', e => {
  const d = e.data;
  if (!d || typeof d !== 'object' || d.src !== 'acm-bridge') return;
  const f = document.getElementById('treeFrame');
  if (!f || e.source !== f.contentWindow) return;
  if (d.type === 'ready'){ treeReady = true; const ws = treeWaiters; treeWaiters = []; ws.forEach(fn => fn()); }
  else if (d.type === 'leaves'){ if (leafReqs[d.req]){ leafReqs[d.req](d.list || []); delete leafReqs[d.req]; } }
  else if (d.type === 'jumpTemplate'){ openTemplateByPath(d.path); }
  else if (d.type === 'requestTemplates'){ postTree({ type:'templates', ok: state.categories.size > 0, list: allTemplatePaths() }); }
  else if (d.type === 'linksChanged'){ refreshMetaLink(state.selectedFile); }
});
function syncThemeButton(){
  const bt = document.querySelector('#btnTheme');
  if (bt) bt.textContent = document.body.classList.contains('theme-light') ? '深色' : '浅色';
}
window.addEventListener('storage', e => {
  if (e.key === LINK_KEY) refreshMetaLink(state.selectedFile);
  if (e.key === 'codeTheme'){
    document.body.classList.toggle('theme-light', e.newValue === 'light');
    syncThemeButton();
  }
});
window.addEventListener('acm-sync-applied', () => {
  refreshMetaLink(state.selectedFile);
  syncThemeButton();
});
