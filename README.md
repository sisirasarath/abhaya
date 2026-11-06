# ABHAYA — Women's Safety and Support Portal

> **HER SAFETY. HER VOICE. HER RIGHTS.**  
> *An Initiative by SFI MACE Unit.*

ABHAYA is a full-stack college women's safety and grievance reporting website designed exclusively for verified female students of our college, with public access to Emergency Helplines (`112`, `181`, `1091`, and configurable institutional contacts).

---

## 1. Visual & Brand Identity

- **Official Attribution**: *An Initiative by SFI MACE Unit.*
- **Official Logo** (`public/abhaya-logo.svg` & `public/abhaya-lotus.svg`):
  - Minimalist continuous line-art woman's profile + lotus emblem
  - Calligraphic *Abhaya* wordmark
  - Tagline: `"HER SAFETY. HER VOICE. HER RIGHTS."`
  - Attribution: `"An Initiative by SFI MACE Unit."`
- **Restrained Monochromatic Palette**:
  - Pure Black: `#111111`
  - Charcoal: `#252525`
  - Warm White: `#FFFFFF`
  - Soft Ivory: `#F8F6F2`
  - Light Grey: `#EAE8E5`
  - Muted Grey: `#888888`
- **Typography**: `Cormorant Garamond`, `Playfair Display`, `DM Sans`, and `Poppins`.

---

## 2. Seeded Demo Accounts

Run `python manage.py seed_abhaya` to initialize or reset all categories, verified helplines, eligible female student roster records, student accounts, and role-based administrator accounts.

### Female Student Accounts (`/login`)
| Status | Email | Admission No. | Password | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Approved (Active)** | `ananya@college.edu.in` | `CET23CS042` | `StudentPassword@123` | Can log in immediately, view dashboard, submit & track complaints |
| **Approved (Active)** | `gowri@college.edu.in` | `CET23EC019` | `StudentPassword@123` | Can log in immediately |
| **Pending Verification** | `malavika@college.edu.in` | `CET24EE055` | `StudentPassword@123` | Blocked from login until approved by an Administrator |

### Role-Based Administrator Accounts (`/admin/login`)
| Role | Email | Password | Scope & Permissions |
| :--- | :--- | :--- | :--- |
| **Super Administrator** | `admin@abhaya.edu.in` | `AdminPassword@123` | Full portal access, all complaints, confidential identity access, admin & settings management |
| **Women's Cell / ICC Admin** | `womenscell@abhaya.edu.in` | `AdminPassword@123` | Harassment, personal safety & campus complaints, confidential identity access |
| **Hostel Administrator** | `warden@abhaya.edu.in` | `AdminPassword@123` | Hostel complaints & assigned cases; confidential identities are redacted at the API layer |
| **Complaint Handler** | `handler@abhaya.edu.in` | `AdminPassword@123` | Assigned campus grievances; confidential identities redacted at the API layer |

---

## 3. Running & Testing Locally

### Backend (`http://127.0.0.1:8000`)
```powershell
cd backend
C:\Users\HP\.gemini\antigravity\scratch\citizen-assistance-portal\python_env\python.exe manage.py migrate
C:\Users\HP\.gemini\antigravity\scratch\citizen-assistance-portal\python_env\python.exe manage.py seed_abhaya
C:\Users\HP\.gemini\antigravity\scratch\citizen-assistance-portal\python_env\python.exe manage.py runserver 127.0.0.1:8000
```

### Frontend (`http://127.0.0.1:5173`)
```powershell
cd frontend
npm.cmd run dev
```

### End-to-End Automated Tests
```powershell
cd backend
C:\Users\HP\.gemini\antigravity\scratch\citizen-assistance-portal\python_env\python.exe manage.py test portal
```
