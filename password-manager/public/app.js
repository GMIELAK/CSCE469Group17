document.addEventListener('DOMContentLoaded', () => {
  loadCredentials();

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/logout', { method: 'POST' });
    window.location.href = '/';
  });

  document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const site = e.target.site.value;
    const username = e.target.username.value;
    const password = e.target.password.value;
    const notes = e.target.notes.value;
    const response = await fetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site, username, password, notes })
    });
    if (response.ok) {
      loadCredentials();
      e.target.reset();
    }
  });
});

async function loadCredentials() {
  const response = await fetch('/api/credentials');
  const credentials = await response.json();
  const tbody = document.querySelector('#credentialsTable tbody');
  tbody.innerHTML = '';
  credentials.forEach(cred => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" value="${cred.site}" data-field="site"></td>
      <td><input type="text" value="${cred.username}" data-field="username"></td>
      <td><input type="password" value="${cred.password}" data-field="password"></td>
      <td><input type="text" value="${cred.notes}" data-field="notes"></td>
      <td>
        <button onclick="updateCredential('${cred.id}', this)">Update</button>
        <button onclick="deleteCredential('${cred.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function updateCredential(id, btn) {
  const row = btn.closest('tr');
  const inputs = row.querySelectorAll('input');
  const data = {};
  inputs.forEach(input => {
    data[input.dataset.field] = input.value;
  });
  const response = await fetch(`/api/credentials/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (response.ok) {
    loadCredentials();
  }
}

async function deleteCredential(id) {
  const response = await fetch(`/api/credentials/${id}`, {
    method: 'DELETE'
  });
  if (response.ok) {
    loadCredentials();
  }
}