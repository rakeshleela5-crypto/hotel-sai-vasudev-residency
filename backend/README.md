# Hotel Sai Vasudev Residency — Backend (FastAPI + PostgreSQL on Railway)

This is the backend service designed to run on **Railway Cloud** with a managed **PostgreSQL database**, serving API requests for the **Cloudflare Pages** frontend.

---

## 🚀 1-Click Railway Deployment Instructions

### Step 1: Create a PostgreSQL Database on Railway
1. Go to your [Railway Dashboard](https://railway.app/).
2. Click **"+ New Project"** -> **"Provision PostgreSQL"**.
3. Railway will spin up a fully managed PostgreSQL database and create a `DATABASE_URL` variable.

### Step 2: Deploy this FastAPI Backend Service
1. In the same Railway project, click **"+ New"** -> **"GitHub Repo"** (or use Railway CLI: `railway up`).
2. Select your repository.
3. In the service settings:
   - **Root Directory**: Set to `/backend` (if repo root contains both frontend and backend).
   - Or deploy the whole repo; Railway will detect `backend/railway.json` and `backend/Dockerfile` or `Procfile`.
4. Go to the **Variables** tab in Railway:
   - Click **"Add Reference"** and select `DATABASE_URL` from the PostgreSQL service (`${{Postgres.DATABASE_URL}}`).
   - Add `ALLOWED_ORIGINS`: `https://<your-project>.pages.dev,http://localhost:5173`
5. Go to the **Settings** tab -> **Networking** -> Click **"Generate Domain"** (e.g., `https://hotel-sai-vasudev-production.up.railway.app`).

### Step 3: Link to Cloudflare Pages Frontend
1. Open your [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **Workers & Pages**.
2. Select your Pages project.
3. Go to **Settings** -> **Environment variables**.
4. Add:
   - **Variable name**: `VITE_API_BASE_URL`
   - **Value**: `https://<your-railway-domain>.up.railway.app/api/v1`
5. Redeploy your Cloudflare Pages application.

---

## 🧪 Local Testing

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- API Docs: `http://localhost:8000/api/v1/docs`
- Healthcheck: `http://localhost:8000/health`
