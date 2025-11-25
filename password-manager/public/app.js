// ==================== AUTH FUNCTIONS ====================

function switchAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const loginTab = document.getElementById('login-tab');
  const signupTab = document.getElementById('signup-tab');

  if (tab === 'login') {
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
  } else {
    signupForm.classList.add('active');
    loginForm.classList.remove('active');
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
  }
}

async function login(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const errorElem = document.getElementById('login-error');

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorElem.textContent = data.error || 'Login failed';
      return;
    }

    errorElem.textContent = '';
    showManagerPage();
  } catch (err) {
    errorElem.textContent = 'Network error';
  }
}

async function signup(e) {
  e.preventDefault();
  const username = document.getElementById('signup-username').value;
  const password = document.getElementById('signup-password').value;
  const confirm = document.getElementById('signup-confirm').value;
  const errorElem = document.getElementById('signup-error');

  if (password !== confirm) {
    errorElem.textContent = 'Passwords do not match';
    return;
  }

  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorElem.textContent = data.error || 'Sign up failed';
      return;
    }

    errorElem.textContent = '';
    document.getElementById('signup-username').value = '';
    document.getElementById('signup-password').value = '';
    document.getElementById('signup-confirm').value = '';
    switchAuthTab('login');
    document.getElementById('login-username').value = username;
    document.getElementById('login-password').value = password;
  } catch (err) {
    errorElem.textContent = 'Network error';
  }
}

async function logout() {
  try {
    const res = await fetch('/api/logout', { method: 'POST' });

    if (res.ok) {
      showAuthPage();
      document.getElementById('login-form').reset();
      document.getElementById('signup-form').reset();
    }
  } catch (err) {
    console.error('Logout error:', err);
  }
}

// ==================== PAGE NAVIGATION ====================

function showAuthPage() {
  document.getElementById('auth-page').classList.remove('hidden');
  document.getElementById('manager-page').classList.add('hidden');
}

function showManagerPage() {
  document.getElementById('auth-page').classList.add('hidden');
  document.getElementById('manager-page').classList.remove('hidden');
  loadCredentials();
}

// ==================== CREDENTIAL FUNCTIONS ====================

async function loadCredentials() {
  try {
    const res = await fetch('/api/credentials');

    if (!res.ok) {
      showAuthPage();
      return;
    }

    const credentials = await res.json();
    renderCredentialsTable(credentials);
  } catch (err) {
    console.error('Error loading credentials:', err);
  }
}

function renderCredentialsTable(credentials) {
  const tbody = document.getElementById('credentials-tbody');
  tbody.innerHTML = '';

  credentials.forEach(cred => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(cred.site)}</td>
      <td>${escapeHtml(cred.username)}</td>
      <td><code>${maskPassword(cred.password)}</code></td>
      <td>${escapeHtml(cred.notes)}</td>
      <td>
        <div class="action-btns">
          <button class="edit-btn" onclick="openEditModal(${cred.id}, '${escapeAttr(cred.site)}', '${escapeAttr(cred.username)}', '${escapeAttr(cred.password)}', '${escapeAttr(cred.notes)}')">Edit</button>
          <button class="delete-btn" onclick="deleteCredential(${cred.id})">Delete</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function maskPassword(password) {
  return '•'.repeat(Math.min(password.length, 8));
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text) {
  return text.replace(/'/g, "\\'");
}

async function addCredential(e) {
  e.preventDefault();
  const site = document.getElementById('add-site').value;
  const username = document.getElementById('add-username').value;
  const password = document.getElementById('add-password').value;
  const notes = document.getElementById('add-notes').value;
  const errorElem = document.getElementById('add-error');

  try {
    const res = await fetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site, username, password, notes })
    });

    const data = await res.json();

    if (!res.ok) {
      errorElem.textContent = data.error || 'Failed to add credential';
      return;
    }

    errorElem.textContent = '';
    document.getElementById('add-cred-form').reset();
    loadCredentials();
  } catch (err) {
    errorElem.textContent = 'Network error';
  }
}

function openEditModal(id, site, username, password, notes) {
  document.getElementById('edit-cred-id').value = id;
  document.getElementById('edit-site').value = site;
  document.getElementById('edit-username').value = username;
  document.getElementById('edit-password').value = password;
  document.getElementById('edit-notes').value = notes;
  document.getElementById('edit-modal').classList.remove('hidden');
  document.getElementById('edit-error').textContent = '';
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
}

async function updateCredential(e) {
  e.preventDefault();
  const id = document.getElementById('edit-cred-id').value;
  const site = document.getElementById('edit-site').value;
  const username = document.getElementById('edit-username').value;
  const password = document.getElementById('edit-password').value;
  const notes = document.getElementById('edit-notes').value;
  const errorElem = document.getElementById('edit-error');

  try {
    const res = await fetch(`/api/credentials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site, username, password, notes })
    });

    const data = await res.json();

    if (!res.ok) {
      errorElem.textContent = data.error || 'Failed to update credential';
      return;
    }

    closeEditModal();
    loadCredentials();
  } catch (err) {
    errorElem.textContent = 'Network error';
  }
}

async function deleteCredential(id) {
  if (!confirm('Are you sure you want to delete this credential?')) {
    return;
  }

  try {
    const res = await fetch(`/api/credentials/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      loadCredentials();
    }
  } catch (err) {
    console.error('Error deleting credential:', err);
  }
}

// ==================== INIT ====================

async function checkAuthStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();

    if (data.loggedIn) {
      document.getElementById('current-user').textContent = data.username;
      showManagerPage();
    } else {
      showAuthPage();
    }
  } catch (err) {
    console.error('Error checking auth status:', err);
    showAuthPage();
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();

  document.getElementById('login-form').addEventListener('submit', login);
  document.getElementById('signup-form').addEventListener('submit', signup);
  document.getElementById('add-cred-form').addEventListener('submit', addCredential);
  document.getElementById('edit-cred-form').addEventListener('submit', updateCredential);
});
