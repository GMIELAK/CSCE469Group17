async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `${method} ${url} failed`);
  }
  return res.json().catch(() => ({}));
}

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  });
  for (const c of children) e.append(c);
  return e;
}

function renderRow(row) {
  const tr = el('tr');

  const site = el('td', {}, row.site);
  const user = el('td', {}, row.username);
  const pass = el('td', {}, row.password);
  const notes = el('td', {}, row.notes || '');
  const actions = el('td');

  const editBtn = el('button', { class: 'secondary' }, 'Edit');
  const delBtn = el('button', { class: 'danger' }, 'Delete');
  actions.append(editBtn, ' ', delBtn);

  tr.append(site, user, pass, notes, actions);

  function toEditMode() {
    const siteIn = el('input', { value: row.site });
    const userIn = el('input', { value: row.username });
    const passIn = el('input', { value: row.password });
    const notesIn = el('input', { value: row.notes || '' });
    const saveBtn = el('button', {}, 'Save');
    const cancelBtn = el('button', { class: 'secondary' }, 'Cancel');

    tr.replaceChildren(
      el('td', {}, siteIn),
      el('td', {}, userIn),
      el('td', {}, passIn),
      el('td', {}, notesIn),
      el('td', {}, saveBtn, ' ', cancelBtn)
    );

    saveBtn.addEventListener('click', async () => {
      try {
        await api('PUT', `/api/credentials/${row.id}`, {
          site: siteIn.value.trim(),
          username: userIn.value.trim(),
          password: passIn.value,
          notes: notesIn.value,
        });
        await load();
      } catch (e) {
        alert(e.message);
      }
    });

    cancelBtn.addEventListener('click', () => {
      tr.replaceWith(renderRow(row));
    });
  }

  editBtn.addEventListener('click', toEditMode);

  delBtn.addEventListener('click', async () => {
    if (!confirm('Delete this credential?')) return;
    try {
      await api('DELETE', `/api/credentials/${row.id}`);
      await load();
    } catch (e) {
      alert(e.message);
    }
  });

  return tr;
}

async function load() {
  const tbody = document.getElementById('rows');
  tbody.innerHTML = '';
  try {
    const rows = await api('GET', '/api/credentials');
    if (!Array.isArray(rows) || rows.length === 0) {
      const tr = el('tr');
      tr.append(el('td', { colspan: '5', class: 'muted' }, 'No credentials yet. Add one above.'));
      tbody.append(tr);
      return;
    }
    for (const r of rows) tbody.append(renderRow(r));
  } catch (e) {
    if (e.message.includes('Unauthorized')) {
      window.location.href = '/';
      return;
    }
    const tr = el('tr');
    tr.append(el('td', { colspan: '5', class: 'error' }, e.message));
    tbody.append(tr);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('logoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('POST', '/api/logout');
      window.location.href = '/';
    } catch (e) {
      alert(e.message);
    }
  });

  const addForm = document.getElementById('addForm');
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(addForm);
    const body = Object.fromEntries(fd.entries());
    try {
      await api('POST', '/api/credentials', body);
      addForm.reset();
      await load();
    } catch (e) {
      document.getElementById('addError').textContent = e.message;
    }
  });

  load();
});
