# Gotong-Royong

Gotong-Royong is a capstone volunteer event application with both frontend and backend components.

## Overview

- Backend: Python application in `Backend application/`
- Frontend: React + Vite app in `Frontend/`

Users can:
- view volunteering events
- create new events
- register/login
- manage event details

## Project structure

- `Backend application/`
  - `app.py` - backend API entry point
  - `requirements.txt` - Python dependencies
  - `backend_api_plan.md` - API plan / notes
  - `dbnotes.txt`, `Notes.txt` - backend notes

- `Frontend/`
  - `src/` - React application source files
  - `package.json` - frontend dependencies and scripts
  - `vite.config.ts` - Vite configuration

## Setup

### Backend

1. Create a Python virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
2. Install backend dependencies:
   ```powershell
   pip install -r "Backend application\requirements.txt"
   ```
3. Run the backend:
   ```powershell
   python "Backend application\app.py"
   ```

### Frontend

1. Open a terminal in the `Frontend` folder:
   ```powershell
   cd Frontend
   ```
2. Install Node dependencies:
   ```powershell
   npm install
   ```
3. Start the frontend development server:
   ```powershell
   npm run dev
   ```

## Notes

- Do not commit local environment files such as `.env`, `Frontend/node_modules/`, or `.venv/`.
- A root `.gitignore` is already present to exclude generated files and local secrets.
