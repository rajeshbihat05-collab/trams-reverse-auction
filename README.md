# Transport Reverse Auction Management System (TRAMS)

TRAMS is an enterprise-grade reverse auction procurement portal tailored for companies procuring logistics and freight services from third-party transport providers.

## Key Features

1. **Security & RBAC**: Double-authenticated JWT login (Access + Refresh) guarding role access.
2. **Reverse Auction Engine**: Live WebSocket-driven countdowns with real-time bid updates. L1, L2, L3 auto-scoring.
3. **Master Data**: Complete registry system tracking Routes, Vehicles, Drivers, Materials, and Branches.
4. **Interactive Dashboard**: Modern statistics counters, charts, active activity logs, and real-time trackers.
5. **Document Compliance**: File upload tracking expiration notifications (PAN, GSTIN, RC, insurance).
6. **Analytics Reports**: Procurement savings charts, transporter win rates, Excel/PDF downloads.

---

## Directory Structure

```
trams/
├── backend/                  # FastAPI Python Application
│   ├── app/
│   │   ├── api/              # HTTP routers & Websockets
│   │   ├── core/             # JWT, verification helpers
│   │   ├── models/           # SQLAlchemy models
│   │   └── schemas/          # Pydantic validation structures
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile
├── frontend/                 # Vite + React Client
│   ├── src/
│   │   ├── components/       # Sidebars, Headers, UI items
│   │   ├── context/          # State providers (Auth, Theme)
│   │   └── pages/            # View components (Admin/Transporter)
│   └── Dockerfile
└── docker-compose.yml        # Multi-container orchestration
```

---

## Local Development Startup

See [INSTALLATION.md](file:///C:/Users/HP/.gemini/antigravity-ide/scratch/trams/docs/INSTALLATION.md) for full instructions.

1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## Docker Compose Setup

Run the whole production network via:
```bash
docker-compose up --build
```
The application will be exposed on:
- Frontend: `http://localhost`
- Backend API Docs: `http://localhost/api/docs` (served via NGINX)
