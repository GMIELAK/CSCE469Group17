import './style.css';

document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = '/api';
    const authContainer = document.getElementById('auth-container');
    const mainContainer = document.getElementById('main-container');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    const logoutBtn = document.getElementById('logout-btn');
    const credentialForm = document.getElementById('credential-form');
    const credentialsTableBody = document.querySelector('#credentials-table tbody');
    const credentialIdInput = document.getElementById('credential-id');

    const siteInput = document.getElementById('site');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const notesInput = document.getElementById('notes');


    const token = localStorage.getItem('token');
    if (token) {
        showMainView();
        loadCredentials();
    } else {
        showAuthView();
    }

    function showAuthView() {
        authContainer.style.display = 'block';
        mainContainer.style.display = 'none';
    }

    function showMainView() {
        authContainer.style.display = 'none';
        mainContainer.style.display = 'block';
    }

    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        document.getElementById('signup-message').style.display = 'block';
        showSignup.parentElement.style.display = 'none';
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        document.getElementById('signup-message').style.display = 'none';
        showSignup.parentElement.style.display = 'block';
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('signup-username').value;
        const password = document.getElementById('signup-password').value;
        try {
            const res = await fetch(`${apiUrl}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            if (res.ok) {
                alert('Signup successful! Please login.');
                showLogin.click();
            } else {
                const error = await res.text();
                alert(`Signup failed: ${error}`);
            }
        } catch (error) {
            console.error('Signup error:', error);
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        try {
            const res = await fetch(`${apiUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            if (res.ok) {
                const { accessToken } = await res.json();
                localStorage.setItem('token', accessToken);
                showMainView();
                loadCredentials();
            } else {
                alert('Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        showAuthView();
        credentialsTableBody.innerHTML = '';
    });

    async function loadCredentials() {
        try {
            const res = await fetch(`${apiUrl}/credentials`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const credentials = await res.json();
                renderCredentials(credentials);
            } else {
                console.error('Failed to load credentials');
            }
        } catch (error) {
            console.error('Error loading credentials:', error);
        }
    }

    function renderCredentials(credentials) {
        credentialsTableBody.innerHTML = '';
        credentials.forEach(cred => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${cred.site}</td>
                <td>${cred.username}</td>
                <td>${cred.password}</td>
                <td>${cred.notes}</td>
                <td>
                    <button class="edit-btn" data-id="${cred.id}">Edit</button>
                    <button class="delete-btn" data-id="${cred.id}">Delete</button>
                </td>
            `;
            credentialsTableBody.appendChild(row);
        });
    }

    credentialForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = credentialIdInput.value;
        const credentialData = {
            site: siteInput.value,
            username: usernameInput.value,
            password: passwordInput.value,
            notes: notesInput.value,
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${apiUrl}/credentials/${id}` : `${apiUrl}/credentials`;

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(credentialData),
            });

            if (res.ok) {
                loadCredentials();
                credentialForm.reset();
                credentialIdInput.value = '';
            } else {
                console.error('Failed to save credential');
            }
        } catch (error) {
            console.error('Error saving credential:', error);
        }
    });

    credentialsTableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this credential?')) {
                try {
                    const res = await fetch(`${apiUrl}/credentials/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    if (res.ok) {
                        loadCredentials();
                    } else {
                        console.error('Failed to delete credential');
                    }
                } catch (error) {
                    console.error('Error deleting credential:', error);
                }
            }
        }

        if (e.target.classList.contains('edit-btn')) {
            const id = e.target.dataset.id;
            const row = e.target.closest('tr');
            siteInput.value = row.cells[0].textContent;
            usernameInput.value = row.cells[1].textContent;
            passwordInput.value = row.cells[2].textContent;
            notesInput.value = row.cells[3].textContent;
            credentialIdInput.value = id;
        }
    });
});
