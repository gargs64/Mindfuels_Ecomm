#!/usr/bin/env node
/**
 * Mindfuels Dev Utility: Changelog & File-History Server
 *
 * Serves a local web UI at http://localhost:7999 showing the full Git commit
 * history. From that UI you can:
 *   • Browse every commit and the files it changed
 *   • See the full diff for any commit
 *   • Restore (git checkout) any individual file to a previous version
 *   • Create a restore-point (git stash) before making changes so you can
 *     always undo with git stash pop
 *
 * Usage (from the project root):
 *   node devtools/changelog_server.js
 *
 * Then open http://localhost:7999 in your browser.
 */

import { execSync, exec } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 7999;
const ROOT = path.resolve(__dirname, '..');

// ── Helpers ──────────────────────────────────────────────────────────────────

function git(cmd) {
  try {
    return execSync(`git ${cmd}`, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch (e) {
    return '';
  }
}

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function html(res, content) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(content);
}

// ── API Handlers ──────────────────────────────────────────────────────────────

function getCommits() {
  const raw = git(`log --pretty=format:"%H|||%h|||%s|||%an|||%ar|||%ai" --max-count=200`);
  if (!raw) return [];
  return raw.split('\n').map(line => {
    const [hash, short, subject, author, relTime, absTime] = line.split('|||');
    return { hash, short, subject, author, relTime, absTime };
  });
}

function getCommitDiff(hash) {
  return git(`show --stat --patch ${hash}`);
}

function getChangedFiles(hash) {
  const raw = git(`diff-tree --no-commit-id -r --name-status ${hash}`);
  if (!raw) return [];
  return raw.split('\n').filter(Boolean).map(line => {
    const parts = line.split('\t');
    return { status: parts[0], file: parts[1] };
  });
}

function getFileDiff(hash, filePath) {
  return git(`show ${hash}:${filePath.replace(/\\/g, '/')}`);
}

function restoreFile(hash, filePath) {
  try {
    execSync(`git checkout ${hash} -- "${filePath}"`, { cwd: ROOT });
    return { success: true, message: `Restored ${filePath} to commit ${hash.slice(0, 7)}` };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function createStash(msg) {
  try {
    const result = git(`stash push -m "${msg || 'Manual save-point ' + new Date().toISOString()}"`);
    return { success: true, message: result || 'Stash created' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function popStash() {
  try {
    const result = git(`stash pop`);
    return { success: true, message: result || 'Stash restored' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function listStashes() {
  const raw = git(`stash list`);
  if (!raw) return [];
  return raw.split('\n').filter(Boolean).map(line => {
    const match = line.match(/^(stash@\{\d+\}): (.+)$/);
    return { ref: match?.[1] || line, message: match?.[2] || line };
  });
}

function getCurrentStatus() {
  const status = git('status --short');
  const branch = git('branch --show-current');
  const lastCommit = git('log -1 --pretty=format:"%h — %s (%ar)"');
  return { status, branch, lastCommit };
}

// ── HTML UI ───────────────────────────────────────────────────────────────────

const UI_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Mindfuels Dev — Git Changelog & History</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #0F172A; --surface: #1E293B; --surface2: #273548; --border: #334155;
    --text: #E2E8F0; --muted: #94A3B8; --primary: #FF5A36; --green: #22C55E;
    --yellow: #F59E0B; --red: #EF4444; --blue: #3B82F6;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); display: flex; height: 100vh; overflow: hidden; }
  
  /* Left sidebar */
  #sidebar { width: 340px; min-width: 280px; display: flex; flex-direction: column; border-right: 1px solid var(--border); overflow: hidden; }
  #sidebar-header { padding: 16px; background: var(--surface); border-bottom: 1px solid var(--border); }
  #sidebar-header h1 { font-size: 1rem; font-weight: 700; color: var(--primary); margin-bottom: 4px; }
  #sidebar-header .meta { font-size: 0.75rem; color: var(--muted); }
  #status-bar { padding: 10px 16px; background: var(--surface2); border-bottom: 1px solid var(--border); font-size: 0.75rem; display: flex; flex-direction: column; gap: 4px; }
  #commit-list { flex: 1; overflow-y: auto; }
  .commit-item { padding: 12px 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.15s; }
  .commit-item:hover { background: var(--surface2); }
  .commit-item.active { background: rgba(255,90,54,0.12); border-left: 3px solid var(--primary); }
  .commit-hash { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: var(--primary); }
  .commit-msg { font-size: 0.85rem; font-weight: 600; margin: 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .commit-meta { font-size: 0.7rem; color: var(--muted); }
  
  /* Main panel */
  #main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  #toolbar { padding: 12px 20px; background: var(--surface); border-bottom: 1px solid var(--border); display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .btn { padding: 7px 14px; border-radius: 6px; font-family: 'Inter', sans-serif; font-size: 0.8rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }
  .btn-primary { background: var(--primary); color: #fff; }
  .btn-primary:hover { filter: brightness(1.1); }
  .btn-green { background: var(--green); color: #fff; }
  .btn-green:hover { filter: brightness(1.1); }
  .btn-outline { background: transparent; color: var(--muted); border: 1px solid var(--border); }
  .btn-outline:hover { border-color: var(--primary); color: var(--primary); }
  .btn-red { background: var(--red); color: #fff; }
  .btn-red:hover { filter: brightness(1.1); }
  
  #tabs { padding: 0 20px; background: var(--surface); display: flex; gap: 4px; border-bottom: 1px solid var(--border); }
  .tab { padding: 10px 14px; font-size: 0.82rem; font-weight: 600; color: var(--muted); cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
  .tab.active { color: var(--primary); border-bottom-color: var(--primary); }
  
  #content { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
  
  /* Commit info */
  .info-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 16px; }
  .info-card h3 { font-size: 0.9rem; font-weight: 700; margin-bottom: 10px; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; }
  .info-row { display: flex; align-items: flex-start; gap: 12px; font-size: 0.85rem; margin-bottom: 6px; }
  .info-label { min-width: 80px; color: var(--muted); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; padding-top: 2px; }
  .mono { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; }
  
  /* File list */
  .file-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 6px; font-size: 0.82rem; border: 1px solid var(--border); background: var(--surface2); margin-bottom: 6px; }
  .file-row .file-path { font-family: 'JetBrains Mono', monospace; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .badge-A { background: rgba(34,197,94,0.15); color: var(--green); padding: 2px 7px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; }
  .badge-M { background: rgba(245,158,11,0.15); color: var(--yellow); padding: 2px 7px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; }
  .badge-D { background: rgba(239,68,68,0.15); color: var(--red); padding: 2px 7px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; }
  
  /* Diff view */
  #diff-view { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; white-space: pre; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 16px; overflow: auto; max-height: 70vh; line-height: 1.6; }
  #diff-view .line-add { color: var(--green); background: rgba(34,197,94,0.06); display: block; }
  #diff-view .line-del { color: var(--red); background: rgba(239,68,68,0.06); display: block; }
  #diff-view .line-hdr { color: var(--blue); display: block; }
  #diff-view .line-meta { color: var(--muted); display: block; }
  
  /* Stash panel */
  .stash-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 8px; font-size: 0.82rem; }
  
  .toast { position: fixed; bottom: 20px; right: 20px; padding: 12px 18px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; z-index: 9999; transition: opacity 0.3s; }
  .toast.success { background: var(--green); color: #fff; }
  .toast.error { background: var(--red); color: #fff; }
  
  #empty-state { display: flex; align-items: center; justify-content: center; height: 200px; color: var(--muted); font-size: 0.9rem; }
  
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
</style>
</head>
<body>
<!-- Left Sidebar: Commit List -->
<div id="sidebar">
  <div id="sidebar-header">
    <h1>🕐 Mindfuels Git History</h1>
    <div class="meta" id="branch-info">Loading...</div>
  </div>
  <div id="status-bar">
    <span id="last-commit">—</span>
    <span id="dirty-files" style="color:var(--yellow)"></span>
  </div>
  <div id="commit-list"><div id="empty-state">Loading commits...</div></div>
</div>

<!-- Right Panel -->
<div id="main">
  <div id="toolbar">
    <button class="btn btn-green" onclick="createStash()">💾 Save Restore-Point (Stash)</button>
    <button class="btn btn-primary" onclick="popStash()">↩️ Undo Last Change (Pop Stash)</button>
    <button class="btn btn-outline" onclick="openStashPanel()">📦 Manage Stashes</button>
    <div style="flex:1"></div>
    <button class="btn btn-outline" onclick="refreshAll()">🔄 Refresh</button>
  </div>
  <div id="tabs">
    <div class="tab active" onclick="switchTab('info')" id="tab-info">Commit Info</div>
    <div class="tab" onclick="switchTab('files')" id="tab-files">Changed Files</div>
    <div class="tab" onclick="switchTab('diff')" id="tab-diff">Full Diff</div>
  </div>
  <div id="content">
    <div id="empty-state">← Select a commit to inspect it</div>
  </div>
</div>

<script>
let commits = [];
let selectedCommit = null;
let activeTab = 'info';
let changedFiles = [];

async function api(url, opts = {}) {
  const r = await fetch(url, opts);
  return r.json();
}

function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
}

async function refreshAll() {
  const status = await api('/api/status');
  document.getElementById('branch-info').textContent = 'Branch: ' + status.branch;
  document.getElementById('last-commit').textContent = '💬 ' + (status.lastCommit || 'No commits yet');
  document.getElementById('dirty-files').textContent = status.status ? '⚠ Unsaved changes' : '';
  
  commits = await api('/api/commits');
  renderCommitList();
}

function renderCommitList() {
  const el = document.getElementById('commit-list');
  if (!commits.length) { el.innerHTML = '<div id="empty-state">No commits found</div>'; return; }
  el.innerHTML = commits.map(c => \`
    <div class="commit-item \${selectedCommit?.hash === c.hash ? 'active' : ''}" onclick="selectCommit('\${c.hash}')">
      <div class="commit-hash">\${c.short}</div>
      <div class="commit-msg">\${escHtml(c.subject)}</div>
      <div class="commit-meta">\${escHtml(c.author)} · \${escHtml(c.relTime)}</div>
    </div>
  \`).join('');
}

async function selectCommit(hash) {
  selectedCommit = commits.find(c => c.hash === hash);
  changedFiles = await api(\`/api/commits/\${hash}/files\`);
  renderCommitList();
  renderActiveTab();
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  renderActiveTab();
}

function renderActiveTab() {
  if (!selectedCommit) return;
  if (activeTab === 'info') renderInfo();
  else if (activeTab === 'files') renderFiles();
  else if (activeTab === 'diff') renderDiff();
}

function renderInfo() {
  const c = selectedCommit;
  document.getElementById('content').innerHTML = \`
    <div class="info-card">
      <h3>Commit Details</h3>
      <div class="info-row"><span class="info-label">Hash</span><span class="mono">\${c.hash}</span></div>
      <div class="info-row"><span class="info-label">Message</span><span>\${escHtml(c.subject)}</span></div>
      <div class="info-row"><span class="info-label">Author</span><span>\${escHtml(c.author)}</span></div>
      <div class="info-row"><span class="info-label">When</span><span>\${escHtml(c.absTime)} (\${escHtml(c.relTime)})</span></div>
    </div>
    <div class="info-card">
      <h3>Restore Actions</h3>
      <p style="font-size:0.82rem;color:var(--muted);margin-bottom:12px">
        Restoring will overwrite your current working files. <strong>Create a Restore-Point (Stash) first</strong> to safely undo this action if needed.
      </p>
      <button class="btn btn-red" onclick="restoreToCommit('\${c.hash}')">⏪ Restore ALL Files to This Commit</button>
    </div>
  \`;
}

function renderFiles() {
  if (!changedFiles.length) { document.getElementById('content').innerHTML = '<div id="empty-state">No files changed</div>'; return; }
  document.getElementById('content').innerHTML = \`
    <div class="info-card">
      <h3>Files Changed (\${changedFiles.length})</h3>
      \${changedFiles.map(f => \`
        <div class="file-row">
          <span class="badge-\${f.status}">\${statusLabel(f.status)}</span>
          <span class="file-path">\${escHtml(f.file)}</span>
          \${f.status !== 'D' ? \`<button class="btn btn-outline" style="font-size:0.72rem;padding:4px 10px" onclick="restoreFile('\${selectedCommit.hash}','\${escHtml(f.file)}')">Restore This File</button>\` : ''}
        </div>
      \`).join('')}
    </div>
  \`;
}

async function renderDiff() {
  document.getElementById('content').innerHTML = '<div id="empty-state">Loading diff...</div>';
  const data = await api(\`/api/commits/\${selectedCommit.hash}/diff\`);
  const lines = (data.diff || '').split('\\n').map(line => {
    if (line.startsWith('+') && !line.startsWith('+++')) return \`<span class="line-add">\${escHtml(line)}</span>\`;
    if (line.startsWith('-') && !line.startsWith('---')) return \`<span class="line-del">\${escHtml(line)}</span>\`;
    if (line.startsWith('@@')) return \`<span class="line-hdr">\${escHtml(line)}</span>\`;
    if (line.startsWith('diff') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++')) return \`<span class="line-meta">\${escHtml(line)}</span>\`;
    return \`<span>\${escHtml(line)}</span>\`;
  }).join('\\n');
  document.getElementById('content').innerHTML = \`<div id="diff-view">\${lines}</div>\`;
}

async function restoreFile(hash, file) {
  if (!confirm(\`Restore "\${file}" to version from commit \${hash.slice(0,7)}?\\n\\nThis will overwrite the current file. Make sure you have a Restore-Point (Stash) saved.\`)) return;
  const r = await api('/api/restore-file', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ hash, file }) });
  showToast(r.message, r.success ? 'success' : 'error');
}

async function restoreToCommit(hash) {
  if (!confirm('⚠ This will restore ALL tracked files to commit ' + hash.slice(0,7) + '.\\n\\nMake sure you have created a Restore-Point (Stash) first!')) return;
  const r = await api('/api/restore-commit', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ hash }) });
  showToast(r.message, r.success ? 'success' : 'error');
  refreshAll();
}

async function createStash() {
  const msg = prompt('Label this restore-point (optional):');
  if (msg === null) return; // cancelled
  const r = await api('/api/stash/create', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ message: msg }) });
  showToast(r.message, r.success ? 'success' : 'error');
}

async function popStash() {
  if (!confirm('Restore changes from the last Restore-Point (stash pop)?')) return;
  const r = await api('/api/stash/pop', { method: 'POST' });
  showToast(r.message, r.success ? 'success' : 'error');
  refreshAll();
}

async function openStashPanel() {
  const stashes = await api('/api/stash/list');
  const content = stashes.length
    ? stashes.map(s => \`<div class="stash-item"><span>\${escHtml(s.message)}</span><span class="mono" style="color:var(--muted);font-size:0.7rem">\${escHtml(s.ref)}</span></div>\`).join('')
    : '<div id="empty-state">No restore-points saved</div>';
  document.getElementById('content').innerHTML = \`
    <div class="info-card">
      <h3>Saved Restore-Points (Stashes)</h3>
      <p style="font-size:0.8rem;color:var(--muted);margin-bottom:12px">The newest restore-point is at the top. Use <strong>↩ Undo Last Change</strong> button to pop and restore the latest.</p>
      \${content}
    </div>
  \`;
}

function statusLabel(s) {
  return { A: 'ADDED', M: 'MODIFIED', D: 'DELETED', R: 'RENAMED' }[s] || s;
}

function escHtml(s = '') {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

refreshAll();
setInterval(refreshAll, 30000); // auto-refresh every 30s
</script>
</body>
</html>`;

// ── HTTP Server ───────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (req.method === 'GET') {
    if (pathname === '/') return html(res, UI_HTML);
    if (pathname === '/api/status') return json(res, getCurrentStatus());
    if (pathname === '/api/commits') return json(res, getCommits());
    if (pathname.match(/^\/api\/commits\/([a-f0-9]+)\/files$/)) {
      const hash = pathname.match(/\/api\/commits\/([a-f0-9]+)\/files/)[1];
      return json(res, getChangedFiles(hash));
    }
    if (pathname.match(/^\/api\/commits\/([a-f0-9]+)\/diff$/)) {
      const hash = pathname.match(/\/api\/commits\/([a-f0-9]+)\/diff/)[1];
      return json(res, { diff: getCommitDiff(hash) });
    }
    if (pathname === '/api/stash/list') return json(res, listStashes());
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', d => { body += d; });
    await new Promise(r => req.on('end', r));

    let payload = {};
    try { payload = JSON.parse(body || '{}'); } catch {}

    if (pathname === '/api/restore-file') return json(res, restoreFile(payload.hash, payload.file));
    if (pathname === '/api/restore-commit') {
      try {
        execSync(`git checkout ${payload.hash} -- .`, { cwd: ROOT });
        return json(res, { success: true, message: `All files restored to commit ${payload.hash.slice(0,7)}` });
      } catch (e) {
        return json(res, { success: false, message: e.message }, 500);
      }
    }
    if (pathname === '/api/stash/create') return json(res, createStash(payload.message));
    if (pathname === '/api/stash/pop') return json(res, popStash());
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log(`  ║  🕐 Mindfuels Changelog Viewer running           ║`);
  console.log(`  ║  Open: http://localhost:${PORT}                    ║`);
  console.log('  ║                                                  ║');
  console.log('  ║  ✅ Browse full Git history                       ║');
  console.log('  ║  ✅ View file-level diffs                         ║');
  console.log('  ║  ✅ Restore any file to any past version          ║');
  console.log('  ║  ✅ Create/pop restore-points (git stash)         ║');
  console.log('  ║                                                  ║');
  console.log('  ║  Press Ctrl+C to stop                            ║');
  console.log('  ╚══════════════════════════════════════════════════╝');
  console.log('');
});
