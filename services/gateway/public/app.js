const form = document.getElementById('form');
const statusEl = document.getElementById('status');
const outEl = document.getElementById('out');

function setStatus(msg) {
  statusEl.textContent = msg || '';
}

function showError(text) {
  outEl.innerHTML = '';
  const pre = document.createElement('pre');
  pre.textContent = text;
  outEl.appendChild(pre);
}

function showDownload(blob, filename) {
  outEl.innerHTML = '';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.textContent = `Download ${filename}`;
  a.style.display = 'inline-block';
  a.style.padding = '10px 14px';
  a.style.borderRadius = '10px';
  a.style.border = '1px solid rgba(127,127,127,0.35)';
  a.style.textDecoration = 'none';
  a.style.fontWeight = '700';
  outEl.appendChild(a);

  const hint = document.createElement('div');
  hint.className = 'muted';
  hint.style.marginTop = '8px';
  hint.textContent = 'If your browser blocks downloads, right-click and open the link in a new tab.';
  outEl.appendChild(hint);
}

function toggleSourceUI() {
  const kind = form.elements['sourceKind'].value;
  document.getElementById('zipWrap').classList.toggle('hidden', kind !== 'zip');
  document.getElementById('repoWrap').classList.toggle('hidden', kind !== 'repo');
}

for (const r of form.elements['sourceKind']) {
  r.addEventListener('change', toggleSourceUI);
}

toggleSourceUI();


function syncResultUI() {
  const rf = form.elements['resultFormat'];
  const btn = document.getElementById('submitBtn');
  const resultFormat = rf.value;
  btn.textContent = resultFormat === 'ir' ? 'Generate IR' : 'Generate XMI';
}

form.elements['language'].addEventListener('change', syncResultUI);
form.elements['resultFormat'].addEventListener('change', syncResultUI);
syncResultUI();


form.addEventListener('submit', async (e) => {
  e.preventDefault();
  outEl.innerHTML = '';

  const language = form.elements['language'].value;
  const name = form.elements['name'].value.trim();
  const associations = form.elements['associations'].value;
  const deps = form.elements['deps'].value;
  const noStereotypes = form.elements['noStereotypes'].value;

  const excludeRaw = form.elements['exclude'].value.trim();
  const excludes = excludeRaw
    ? excludeRaw.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const sourceKind = form.elements['sourceKind'].value;

  const fd = new FormData();
  fd.set('language', language);
  fd.set('resultFormat', resultFormat);
  if (name) fd.set('name', name);
  if (associations) fd.set('associations', associations);
  if (deps) fd.set('deps', deps);
  if (noStereotypes) fd.set('noStereotypes', noStereotypes);
  for (const ex of excludes) fd.append('exclude', ex);

  if (sourceKind === 'repo') {
    const repoUrl = form.elements['repoUrl'].value.trim();
    if (!repoUrl) {
      showError('Please provide a repo URL.');
      return;
    }
    fd.set('repoUrl', repoUrl);
  } else {
    const file = form.elements['inputZip'].files[0];
    if (!file) {
      showError('Please choose a zip file to upload.');
      return;
    }
    fd.set('inputZip', file, file.name);
  }

  setStatus(resultFormat === 'ir' ? 'Generating IR…' : 'Generating XMI…');
  try {
    const resp = await fetch('/v1/xmi', { method: 'POST', body: fd });
    if (!resp.ok) {
      const text = await resp.text();
      showError(text);
      setStatus(`Failed (${resp.status})`);
      return;
    }

    const blob = await resp.blob();
    const cd = resp.headers.get('content-disposition') || '';
    const m = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
    const defaultName = resultFormat === 'ir' ? 'model.ir.json' : 'model.xmi';
    const filename = decodeURIComponent((m && (m[1] || m[2])) || defaultName);

    showDownload(blob, filename);
    setStatus('Done.');
  } catch (err) {
    showError(String(err?.message || err));
    setStatus('Failed.');
  }
});
