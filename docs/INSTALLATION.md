# Installation & Setup Guide

This guide details steps to set up TRAMS locally or deploy it to a staging/production server.

## System Prerequisites

Before proceeding, ensure you have:
- Python 3.11 or later
- Node.js 18 or later (with npm)
- Docker & Docker Compose (optional, for containerized deployments)

---

## Local Installation Step-by-Step

### 1. Configure the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create your virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment config:
   ```bash
   cp .env.example .env
   ```
   *Modify the `DATABASE_URL` to `sqlite:///./trams.db` for local testing.*
5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *FastAPI automatically runs the DB seeder on startup if the database is empty.*

### 2. Configure the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open the site at the address output by Vite (usually `http://localhost:5173`).

---

## Default Login Credentials

- **Admin Account**:
  - Email: `admin@trams.in`
  - Password: `Admin@123`
- **Transporter Account**:
  - Email: `transport1@demo.in`
  - Password: `Transport@123`

---

## Deployment with Docker Compose

1. Clone or copy the project files to your server.
2. Build and start the network:
   ```bash
   docker-compose up --build -d
   ```
3. Check container logs if needed:
   ```bash
   docker-compose logs -f
   ```
4. Configure your domain records to point to the server. NGINX exposes port `80` globally.
