# 🚛 TRAMS - Transport Reverse Auction Management System
> Enterprise-grade Reverse Auction & Freight Procurement Platform for Corporate Logistics.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.11+-green.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF.svg)](https://vitejs.dev/)

---

## 🌟 Key Corporate Features

1. **⚡ Real-Time WebSocket Reverse Bidding Engine**
   - Live dynamic rate quotes sync across Admin & Transporter dashboards.
   - Automatic L1, L2, L3 ranking with rank shift indicators (`🏆 L1 Lowest Rate` vs `⚠️ Outbid L2`).
   - Anti-sniping extensions: Auto-extends auction by 3 minutes if bid received in last 2 minutes.

2. **🔒 2-Step Controlled Award Publishing System**
   - Internal Commercial Evaluation Draft mode: Admin selects winner internally without exposing to bidders.
   - Explicit `📢 Publish Result` trigger: Broadcasts winner banner, sends WhatsApp/Email alerts, and updates Transporter portal live.

3. **🔑 Enterprise Password Reset & Transporter Privacy Protection**
   - Admin can reset any Transporter's password and issue a temporary login key.
   - **First-Time Password Change Enforcement**: Transporter MUST create their own private secret password upon first login before accessing the app.

4. **📱 Transporter Live Bidding Suite**
   - 1-Click Quick Decrement Action Buttons (`-₹500`, `-₹1000`, `-₹2000`, `Beat L1 (-₹500)`).
   - Personal Bid Revision History & Route details.

5. **📊 Executive Corporate UI & Analytics**
   - Fortune 500 SaaS styling (`Plus Jakarta Sans` typography, Slate Azure palette, glassmorphism cards).
   - Export reports to Excel/PDF, audit logging, vehicle & driver compliance registry.

---

## 📁 Repository Structure

```
trams/
├── backend/                  # FastAPI Python Backend
│   ├── app/
│   │   ├── api/              # REST & WebSocket Endpoints (Auctions, Bids, Transporters, Auth)
│   │   ├── core/             # JWT Auth, Passwords, WS Manager
│   │   ├── models/           # SQLAlchemy DB Schemas
│   │   └── schemas/          # Pydantic Schemas
│   ├── requirements.txt      # Python Dependencies
│   └── Dockerfile
├── frontend/                 # Vite + React Frontend
│   ├── src/
│   │   ├── api/              # Axios Client
│   │   ├── components/       # Layouts, Header, Sidebar
│   │   ├── context/          # Auth & Theme Context
│   │   └── pages/            # Admin & Transporter Views
│   ├── nginx.conf            # Nginx Production Reverse Proxy Config
│   └── Dockerfile
└── docker-compose.yml        # Self-contained Docker Multi-container orchestration
```

---

## 🚀 How to Push this Repository to GitHub

### Option A: Using Git Command Line (Recommended)

1. Open your terminal inside the project directory:
   ```bash
   cd C:\Users\HP\Desktop\trams
   ```

2. Initialize Git repository and commit all files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Production-ready TRAMS Reverse Auction Platform"
   ```

3. Link to your GitHub Repository:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/trams-reverse-auction.git
   git push -u origin main
   ```

---

## 💻 Local Development Setup

### 1. Backend (FastAPI)
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🐳 Docker Deployment (GCP / AWS / On-Premise)

Run the entire application stack in self-contained Docker containers:
```bash
docker-compose up -d --build
```

Access the app:
- **Frontend App:** `http://YOUR_SERVER_IP`
- **Backend API Docs:** `http://YOUR_SERVER_IP/api/docs`

---

## 🔑 Default Credentials

- **Admin Account:** `admin@trams.in` / `Admin@123`
- **Transporter Account:** `transport1@demo.in` / `Transport@123`

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
