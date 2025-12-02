# Password Manager

A simple password manager web application with user authentication and credential management.

## Features

- User sign up, login, and logout.
- Create, Read, Update, and Delete (CRUD) operations for passwords.
- Credentials are saved locally in a JSON file.

## Project Structure

- `backend/`: Contains the Node.js/Express server.
- `frontend/`: Contains the HTML, CSS, and JavaScript for the client-side application.

## Prerequisites

- [Node.js](https://nodejs.org/) (which includes npm)

## Running the Application

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/GMIELAK/CSCE469Group17.git
    cd CSCE469Group17
    ```

2.  **Install dependencies:**

    This command will install dependencies for both the root, backend and frontend.

    ```bash
    npm install
    ```

3.  **Run the application:**

    This will start both the backend and frontend servers concurrently.

    ```bash
    npm run dev
    ```

    - The backend server will be running on `http://localhost:3000`.
    - The frontend will be served on `http://localhost:8080`.

4.  **Open your browser:**

    Navigate to `http://localhost:8080` to use the application.
