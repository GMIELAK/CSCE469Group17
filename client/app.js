const api = async (url, opts = {}) => {
  opts.credentials = 'include';
  opts.headers = { 'Content-Type': 'application/json', ...opts.headers };
  if (opts.body && typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);
  const res = await fetch('http://localhost:4000' + url, opts);
  return res.json();
};

function App() {
  const [user, setUser] = React.useState(null);
  const [view, setView] = React.useState('loading');
  const [error, setError] = React.useState('');
  const [credentials, setCredentials] = React.useState([]);
  const [form, setForm] = React.useState({ site: '', username: '', password: '', notes: '' });
  const [editId, setEditId] = React.useState(null);

  React.useEffect(() => {
    api('/api/me').then(res => {
      if (res.loggedIn) {
        setUser(res.username);
        setView('main');
        loadCreds();
      } else {
        setView('auth');
      }
    });
  }, []);

  function loadCreds() {
    api('/api/credentials').then(setCredentials);
  }

  function handleAuth(e) {
    e.preventDefault();
    const isLogin = e.target.name === 'login';
    const url = isLogin ? '/api/login' : '/api/signup';
    api(url, { method: 'POST', body: { username: e.target.username.value, password: e.target.password.value } })
      .then(res => {
        if (res.success) {
          setUser(e.target.username.value);
          setView('main');
          setError('');
          loadCreds();
        } else {
          setError(res.error || 'Error');
        }
      });
  }

  function handleLogout() {
    api('/api/logout', { method: 'POST' }).then(() => {
      setUser(null);
      setView('auth');
      setCredentials([]);
    });
  }

  function handleForm(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleAdd(e) {
    e.preventDefault();
    if (editId) {
      api('/api/credentials/' + editId, { method: 'PUT', body: form }).then(res => {
        setEditId(null);
        setForm({ site: '', username: '', password: '', notes: '' });
        loadCreds();
      });
    } else {
      api('/api/credentials', { method: 'POST', body: form }).then(res => {
        setForm({ site: '', username: '', password: '', notes: '' });
        loadCreds();
      });
    }
  }

  function handleEdit(row) {
    setEditId(row.id);
    setForm({ site: row.site, username: row.username, password: row.password, notes: row.notes });
  }

  function handleDelete(id) {
    api('/api/credentials/' + id, { method: 'DELETE' }).then(loadCreds);
  }

  if (view === 'loading') return React.createElement('div', null, 'Loading...');
  if (view === 'auth') return (
    React.createElement('div', { className: 'container' },
      React.createElement('h2', null, 'Password Manager'),
      error && React.createElement('div', { style: { color: 'red' } }, error),
      React.createElement('form', { name: 'login', onSubmit: handleAuth },
        React.createElement('h3', null, 'Login'),
        React.createElement('input', { name: 'username', placeholder: 'Username', required: true }),
        React.createElement('input', { name: 'password', type: 'password', placeholder: 'Password', required: true }),
        React.createElement('button', { type: 'submit' }, 'Login')
      ),
      React.createElement('form', { name: 'signup', onSubmit: handleAuth },
        React.createElement('h3', null, 'Sign Up'),
        React.createElement('input', { name: 'username', placeholder: 'Username', required: true }),
        React.createElement('input', { name: 'password', type: 'password', placeholder: 'Password', required: true }),
        React.createElement('button', { type: 'submit' }, 'Sign Up')
      )
    )
  );

  return (
    React.createElement('div', { className: 'container' },
      React.createElement('h2', null, 'Welcome, ', user),
      React.createElement('button', { onClick: handleLogout }, 'Logout'),
      React.createElement('table', null,
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', null, 'Site'),
            React.createElement('th', null, 'Username'),
            React.createElement('th', null, 'Password'),
            React.createElement('th', null, 'Notes'),
            React.createElement('th', null, 'Actions')
          )
        ),
        React.createElement('tbody', null,
          credentials.map(row => React.createElement('tr', { key: row.id },
            React.createElement('td', null, row.site),
            React.createElement('td', null, row.username),
            React.createElement('td', null, row.password),
            React.createElement('td', null, row.notes),
            React.createElement('td', { className: 'actions' },
              React.createElement('button', { onClick: () => handleEdit(row) }, 'Edit'),
              React.createElement('button', { onClick: () => handleDelete(row.id) }, 'Delete')
            )
          ))
        )
      ),
      React.createElement('form', { onSubmit: handleAdd },
        React.createElement('h3', null, editId ? 'Edit Credential' : 'Add Credential'),
        React.createElement('input', { name: 'site', placeholder: 'Site', value: form.site, onChange: handleForm, required: true }),
        React.createElement('input', { name: 'username', placeholder: 'Username', value: form.username, onChange: handleForm, required: true }),
        React.createElement('input', { name: 'password', placeholder: 'Password', value: form.password, onChange: handleForm, required: true }),
        React.createElement('textarea', { name: 'notes', placeholder: 'Notes (optional)', value: form.notes, onChange: handleForm }),
        React.createElement('button', { type: 'submit' }, editId ? 'Update' : 'Add'),
        editId && React.createElement('button', { type: 'button', onClick: () => { setEditId(null); setForm({ site: '', username: '', password: '', notes: '' }); } }, 'Cancel')
      )
    )
  );
}

const root = document.getElementById('root');
if (window.ReactDOM && ReactDOM.createRoot) {
  ReactDOM.createRoot(root).render(React.createElement(App));
} else {
  ReactDOM.render(React.createElement(App), root);
}
