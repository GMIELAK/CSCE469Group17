// Global state
let currentEditingId = null;

// ============== AUTH FUNCTIONS ==============

function switchAuthTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const tabs = document.querySelectorAll('.tab-btn');

    tabs.forEach(t => t.classList.remove('active'));
    loginForm.classList.remove('active');
    signupForm.classList.remove('active');

    if (tab === 'login') {
        tabs[0].classList.add('active');
        loginForm.classList.add('active');
    } else {
        tabs[1].classList.add('active');
        signupForm.classList.add('active');
    }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            showAppPage();
        } else {
            document.getElementById('loginError').textContent = data.error || 'Login failed';
        }
    } catch (error) {
        document.getElementById('loginError').textContent = 'Error logging in';
    }
});

document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;

    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            showAppPage();
        } else {
            document.getElementById('signupError').textContent = data.error || 'Signup failed';
        }
    } catch (error) {
        document.getElementById('signupError').textContent = 'Error signing up';
    }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        showAuthPage();
    } catch (error) {
        alert('Error logging out');
    }
});

// ============== PAGE NAVIGATION ==============

function showAuthPage() {
    document.getElementById('authPage').style.display = 'block';
    document.getElementById('appPage').style.display = 'none';
    document.getElementById('loginForm').reset();
    document.getElementById('signupForm').reset();
    document.getElementById('loginError').textContent = '';
    document.getElementById('signupError').textContent = '';
}

function showAppPage() {
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('appPage').style.display = 'block';
    loadUser();
    loadCredentials();
}

async function loadUser() {
    try {
        const response = await fetch('/api/auth/user');
        const data = await response.json();
        if (data.user) {
            document.getElementById('currentUser').textContent = `Welcome, ${escapeHtml(data.user.username)}!`;
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

// ============== CREDENTIAL FUNCTIONS ==============

async function loadCredentials() {
    try {
        const response = await fetch('/api/credentials');
        if (response.status === 401) {
            showAuthPage();
            return;
        }
        const credentials = await response.json();
        displayCredentials(credentials);
    } catch (error) {
        console.error('Error loading credentials:', error);
        document.getElementById('credentialsList').innerHTML = '<p class="error">Error loading credentials</p>';
    }
}

function displayCredentials(credentials) {
    const container = document.getElementById('credentialsList');

    if (credentials.length === 0) {
        container.innerHTML = '<p class="empty">No credentials saved yet. Add one above!</p>';
        return;
    }

    container.innerHTML = credentials.map(cred => `
        <div class="credential-item">
            <div class="credential-info">
                <h3>${escapeHtml(cred.site)}</h3>
                <p><strong>Username:</strong> <span class="username">${escapeHtml(cred.username)}</span></p>
                <button type="button" class="btn-show-password" onclick="showPassword(${cred.id})">Show Password</button>
                ${cred.notes ? `<p><strong>Notes:</strong> ${escapeHtml(cred.notes)}</p>` : ''}
                <p class="date">Last updated: ${new Date(cred.updated_at).toLocaleDateString()}</p>
            </div>
            <div class="credential-actions">
                <button type="button" class="btn-edit" onclick="editCredential(${cred.id})">Edit</button>
                <button type="button" class="btn-delete" onclick="deleteCredential(${cred.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

async function showPassword(id) {
    try {
        const response = await fetch(`/api/credentials/${id}`);
        const cred = await response.json();
        alert(`Password for ${cred.site}: ${cred.password}`);
    } catch (error) {
        alert('Error retrieving password');
    }
}

async function editCredential(id) {
    try {
        const response = await fetch(`/api/credentials/${id}`);
        const cred = await response.json();

        document.getElementById('site').value = cred.site;
        document.getElementById('username').value = cred.username;
        document.getElementById('password').value = cred.password;
        document.getElementById('notes').value = cred.notes || '';

        document.getElementById('formTitle').textContent = 'Edit Credential';
        document.getElementById('formSubmitBtn').textContent = 'Update Credential';
        document.getElementById('formCancelBtn').style.display = 'inline-block';
        currentEditingId = id;

        document.documentElement.scrollTop = 0;
    } catch (error) {
        alert('Error loading credential');
    }
}

document.getElementById('formCancelBtn').addEventListener('click', () => {
    resetForm();
});

function resetForm() {
    document.getElementById('credentialForm').reset();
    document.getElementById('formTitle').textContent = 'Add New Credential';
    document.getElementById('formSubmitBtn').textContent = 'Add Credential';
    document.getElementById('formCancelBtn').style.display = 'none';
    currentEditingId = null;
}

document.getElementById('credentialForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const site = document.getElementById('site').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const notes = document.getElementById('notes').value;

    if (currentEditingId) {
        // Update credential
        try {
            const response = await fetch(`/api/credentials/${currentEditingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ site, username, password, notes })
            });

            if (response.ok) {
                resetForm();
                loadCredentials();
                alert('Credential updated successfully!');
            } else {
                alert('Error updating credential');
            }
        } catch (error) {
            alert('Error updating credential');
        }
    } else {
        // Add credential
        try {
            const response = await fetch('/api/credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ site, username, password, notes })
            });

            if (response.ok) {
                resetForm();
                loadCredentials();
                alert('Credential added successfully!');
            } else {
                alert('Error adding credential');
            }
        } catch (error) {
            alert('Error adding credential');
        }
    }
});

async function deleteCredential(id) {
    if (!confirm('Are you sure you want to delete this credential?')) {
        return;
    }

    try {
        const response = await fetch(`/api/credentials/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadCredentials();
            alert('Credential deleted successfully!');
        } else {
            alert('Error deleting credential');
        }
    } catch (error) {
        alert('Error deleting credential');
    }
}

// ============== UTILITY FUNCTIONS ==============

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ============== INITIALIZATION ==============

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/auth/user');
        const data = await response.json();
        if (data.user) {
            showAppPage();
        } else {
            showAuthPage();
        }
    } catch (error) {
        showAuthPage();
    }
});
