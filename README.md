# ABHAYA — Women's Safety and Support Portal

> **HER SAFETY. HER VOICE. HER RIGHTS.**  
> *An Initiative by SFI MACE Unit.*

ABHAYA is a full-stack college women's safety and grievance reporting platform designed for female students of the institution, featuring public Emergency Helplines (`112`, `181`, `1091`), confidential grievance reporting, and a unified Administrative Governance Portal.

---

## 1. Project Structure

- `frontend/` — React 19 + Vite SPA (`frontend/vercel.json` configured for Vercel SPA routing).
- `backend/` — Django 6 + Django REST Framework + SimpleJWT API (`backend/vercel.json` and `backend/config/wsgi.py` configured for Vercel Python serverless deployment).

---

## 2. Running Locally

### Backend (`http://127.0.0.1:8000`)
```powershell
cd backend
python manage.py migrate
python manage.py seed_abhaya
python manage.py runserver 127.0.0.1:8000
```

### Frontend (`http://127.0.0.1:5173`)
```powershell
cd frontend
npm install
npm run dev
```

---

## 3. Production Deployment on Vercel

ABHAYA is configured to deploy as **two separate Vercel projects** from the same GitHub repository:
1. **Backend Project** (`Root Directory`: `backend`) — Connects to an external PostgreSQL database via `DATABASE_URL`.
2. **Frontend Project** (`Root Directory`: `frontend`) — Connects to the deployed backend via `VITE_API_BASE_URL`.

See [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example) for required environment variables.
