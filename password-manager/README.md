# Password Manager

A simple, local password manager web app built with Node.js, Express, and SQLite.

## Features

- **User Authentication**: Sign up, login, and logout
- **Credential Management**: Create, read, update, and delete saved credentials
- **Secure Storage**: Passwords are hashed using bcryptjs
- **Session Management**: User sessions are maintained server-side
- **Minimal UI**: Clean, responsive interface
- **Local Persistence**: All data stored in a local SQLite database

## Tech Stack

- **Backend**: Node.js with Express
- **Database**: SQLite3
- **Frontend**: Vanilla HTML, CSS, and JavaScript
- **Security**: bcryptjs for password hashing, express-session for session management

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm

### Setup

1. Navigate to the project directory:
   ```bash
   cd CSCE469-Claude
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the App

Start the server:
```bash
npm start
```

The app will be available at `http://localhost:3000`

## Usage

1. **Sign Up**: Create a new account with a username and password
2. **Login**: Sign in with your credentials
3. **Add Credentials**: Use the form at the top to add a new saved credential
   - **Site**: Name of the website/service
   - **Username**: Your username for that service
   - **Password**: Your password (stored securely)
   - **Notes**: Optional additional information
4. **View Credentials**: All your saved credentials appear in the table below
5. **Edit**: Click the "Edit" button to modify a credential
6. **Delete**: Click the "Delete" button to remove a credential
7. **Logout**: Click the "Logout" button to sign out

## Project Structure

```
password-manager/
├── server.js              # Express server and API endpoints
├── package.json           # Project dependencies
├── password_manager.db    # SQLite database (auto-created)
├── public/
│   ├── index.html         # Main HTML page
│   ├── styles.css         # CSS styling
│   └── app.js             # Frontend JavaScript
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## Database Schema

### Users Table
- `id`: Primary key
- `username`: Unique username
- `password`: Hashed password

### Credentials Table
- `id`: Primary key
- `user_id`: Foreign key to users
- `site`: Website/service name
- `username`: Username for that service
- `password`: Password (stored in plaintext in DB, hashed at application layer)
- `notes`: Optional notes

## Security Notes

- Passwords are hashed with bcryptjs before storage
- Sessions are managed server-side with express-session
- HTTPS should be used in production (currently uses HTTP)
- Change the session secret in `server.js` before deploying
- The database file is created locally and not included in version control

## Limitations

- Single-device use (no cloud sync)
- Passwords stored in plaintext in the database (consider using encryption)
- No password strength requirements
- No two-factor authentication
- No account recovery mechanism

## Future Enhancements

- Password encryption in the database
- Export/import credentials
- Password strength meter
- Master password option
- Backup and restore functionality
- Dark mode

## License

MIT
