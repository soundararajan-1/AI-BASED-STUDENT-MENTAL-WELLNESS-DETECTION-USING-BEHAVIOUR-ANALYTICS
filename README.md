# AI-Based Student Mental Wellness Detection Using Behaviour Analytics

> **Notice:** Educational wellness-support prototype. Not a medical diagnostic tool. Does not diagnose depression, anxiety, or clinical disorders.

---

## 1. Project Title & Problem Statement

### Project Title
**AI-Based Student Mental Wellness Detection Using Behaviour Analytics**

### Problem Statement
University students face compounding academic deadlines, irregular sleep cycles, and high screen time. Existing mental wellness apps typically subject students to lengthy, repetitive clinical questionnaires (such as PHQ-9 or GAD-7) every day. This creates severe survey fatigue, causing students to abandon check-ins or submit inaccurate responses. Furthermore, traditional solutions evaluate students against rigid, universal thresholds (e.g. "everyone must sleep 8 hours"), failing to account for individual lifestyle baselines.

---

## 2. Motivation & Objectives

### Motivation
Every student has a distinct personal rhythm. A student who naturally thrives on 6.5 hours of sleep does not have a wellness issue, whereas an 8.5-hour sleeper whose sleep suddenly drops to 6.0 hours is experiencing a significant personal shift. By shifting from static diagnostic surveys to **low-effort, personal behaviour analytics**, we can identify quiet deviations early and provide actionable guidance before stress becomes acute.

### Key Objectives
1. **Low-Effort Tracking:** Provide a ~25-second daily check-in capturing key wellness parameters without intrusive questioning.
2. **Personal Baseline Learning:** Compute each student's personal behavioral baseline rather than enforcing universal thresholds.
3. **Change & Trend Detection:** Accurately calculate parameter deltas ("What Changed?") and multi-window statistical trends (7, 14, and 30 days).
4. **Behaviour Pattern Recognition:** Detect multi-attribute student lifestyle patterns (Academic Workload, Digital Lifestyle, Reduced Social Interaction, Sleep Disruption, and Balanced Behavior).
5. **Secondary ML Benchmark:** Implement a Random Forest Classifier to categorize wellness concern tiers based on tabular behavioral features.
6. **Non-Clinical LLM Explanations:** Convert analytical metrics into plain-language summaries and supportive wellness guidance without medical diagnosis.

---

## 3. Main Novelty

### Personalized Behaviour-Based Wellness Analysis
Instead of treating all students identically, the platform:
1. Learns the student's personal normal band using historical rolling statistics.
2. Compares daily behavior against the student's *own* history, not an arbitrary population average.
3. Computes transparent signed parameter deltas ($\Delta = \text{Current} - \text{Baseline}$).
4. Detects directional behavioral trends over 7, 14, and 30 days.
5. Employs a rule-based Pattern Engine to recognize distinct college lifestyle contexts.
6. Dynamically triggers adaptive follow-up questions only when unusual behavior is detected.
7. Grounds LLM guidance strictly in numerical facts, eliminating hallucinations.

---

## 4. System Architecture

```
Student Daily Input (~25 seconds)
       ↓
React 19 Frontend (Vite + Recharts)
       ↓
FastAPI Backend Gateway (Pydantic V2)
       ↓
Data Layer (Supabase PostgreSQL / Local Fallback)
       ↓
Personal Baseline Engine (Rolling Medians & Normal Bands)
       ↓
Behaviour Analytics Engine (What Changed? Deltas)
       ↓
Trend Analysis Engine (7d / 14d / 30d Slopes)
       ↓
Behaviour Pattern Engine (Academic Workload, Digital, Social, Balanced)
       ↓
Random Forest Classifier (Secondary ML Benchmark)
       ↓
Wellness Indicator (0–100 Normalized Score)
       ↓
LLM Explanation Service (OpenAI GPT / Grounded Non-Clinical Guidance)
       ↓
Interactive Student Dashboard
```

---

## 5. Technology Stack & Justification

| Layer | Technology | Justification |
|---|---|---|
| **Backend** | Python 3.10+, FastAPI | High performance, asynchronous endpoints, automatic Swagger UI docs (`/docs`), strong typing with Pydantic V2. |
| **Frontend** | React 19, JavaScript, Vite | Fast modular component development, rapid hot reloading, responsive glassmorphic UI. |
| **Styling** | Vanilla CSS + CSS Variables | Maximum flexibility, customized dark-mode design system, lightweight without build-time CSS overhead. |
| **Visualizations**| Recharts, Lucide React | Clean 7-axis radar charts (Behavior Fingerprint), trend lines, and clear visual indicators. |
| **Database** | Supabase PostgreSQL / SQLite | Relational schema with foreign keys for students, checkins, analysis, and adaptive questions. Zero-setup SQLite fallback for offline demonstrations. |
| **Machine Learning**| Scikit-learn, Pandas, NumPy, Joblib | Random Forest ensemble classifier ideal for tabular behavioral data; simple to train, evaluate, and explain in viva. |
| **AI / LLM** | OpenAI GPT API (Backend Only) | Converts structured JSON analytical results into natural language without frontend key exposure. Includes fallback for offline operation. |

---

## 6. Project Folder Structure

```
AI-powered Student mental wellness detection/
├── dataset/
│   └── wellness_data.csv         # Synthetic student behavioral dataset (40 records)
├── docs/
│   ├── architecture.md           # High-level architecture and pipeline diagrams
│   ├── database.md               # Supabase PostgreSQL table schemas & ER diagram
│   └── api.md                    # REST API endpoints & payload specifications
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI application, CORS, lifespan & /health
│   │   ├── db.py                 # Database session engine & SQLite fallback
│   │   ├── models.py             # SQLAlchemy ORM table definitions
│   │   ├── schemas.py            # Pydantic validation schemas
│   │   ├── api/                  # API routers (students, checkins, dashboard, counsellor)
│   │   ├── services/             # Business logic service modules
│   │   ├── ml/                   # Random Forest model trainer & inference
│   │   ├── database/             # Database connection managers
│   │   └── utils/                # Date and mathematical utilities
│   ├── requirements.txt          # Python backend dependencies
│   └── .env.example              # Backend environment template
├── frontend/
│   ├── src/
│   │   ├── components/           # Radar chart, What Changed card, Checkin widget, modals
│   │   ├── pages/
│   │   │   └── HomePage.jsx      # Phase 1 project homepage & live health inspector
│   │   ├── services/
│   │   │   └── api.js            # Central API client with /health checking
│   │   ├── hooks/
│   │   │   └── useHealth.js      # Live backend status polling hook
│   │   ├── utils/
│   │   │   └── constants.js      # Project metadata & roadmap constants
│   │   ├── App.jsx               # Main React entrypoint with view switcher
│   │   └── index.css             # Dark-mode design system & utility classes
│   ├── package.json              # Frontend dependencies (React 19, Recharts, Lucide)
│   └── .env.example              # Frontend environment template
├── requirements.txt              # Root Python dependencies
├── .env.example                  # Root environment template
├── .gitignore                    # Git ignore file for secrets, venv, and node_modules
└── README.md                     # Complete project documentation
```

---

## 7. Installation & Quickstart

### Prerequisites
- Python 3.10 or higher (tested with Python 3.14)
- Node.js 18 or higher (tested with Node.js 24)
- Git

### Step 1: Clone and Configure Environment
```bash
git clone <repository-url>
cd "AI-powered Student mental wellness detection"
```

Copy the environment templates:
```powershell
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Step 2: Backend Setup
```powershell
# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Start FastAPI server
uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```
The backend will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000).  
Interactive Swagger docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).  
Health check endpoint: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health).

### Step 3: Frontend Setup
In a new terminal window:
```powershell
cd frontend
npm install
npm run dev
```
Open your browser at [http://localhost:5173](http://localhost:5173).

---

## 7.1 Multi-Role Access & Demo Credentials

The platform features three tailored access portals for different campus stakeholders:

| Role | Portal / Purpose | Default Demo Identifier | Password / PIN | Access Scope |
|---|---|---|---|---|
| **🎓 Student** | Personal Baseline & Check-ins | `S001` (or `S002`, `S007`) | *(leave blank or any)* | Personal 7-axis radar, What Changed deltas, daily check-in, data deletion |
| **🩺 Counsellor** | Departmental Planning | `counsellor@campus.edu` | `counsellor123` | Aggregate-only departmental trends, elevated stress %, strictly $k \ge 5$ anonymized |
| **🛡️ Administrator** | System Health & Telemetry | `admin@campus.edu` | `admin123` | Database row inspectors, API latency, ML model benchmarks, student roster |

---

## 8. Development Phases & Current Status

| Phase | Description | Status |
|---|---|---|
| **Phase 1** | **Project Setup, Health API & React Homepage** | **COMPLETED & VERIFIED** |
| Phase 2 | Supabase Database Tables & CRUD Wiring | Up Next |
| Phase 3 | Authentication, Consent & Student Onboarding | Planned |
| Phase 4 | Quick Daily Check-In (~25s flow) | Planned |
| Phase 5 | Personal Baseline Calculation Engine | Planned |
| Phase 6 | Behaviour Analytics & Delta Computation | Planned |
| Phase 7 | What Changed? Feature & Human Explanations | Planned |
| Phase 8 | Statistical Trend Analysis (7d / 14d / 30d) | Planned |
| Phase 9 | Behaviour Pattern Engine (Academic, Digital, Social, Balanced) | Planned |
| Phase 10 | Random Forest Secondary ML Classifier | Planned |
| Phase 11 | Student Dashboard & Fingerprint Radar Chart | Planned |
| Phase 12 | Adaptive Question Engine | Planned |
| Phase 13 | LLM Explanations & Safety Verification | Planned |
| Phase 14 | Automated Testing & Test Scenarios | Planned |
| Phase 15 | Deployment & Production Packaging | Planned |
| Phase 16 | Documentation, Presentation & Viva Preparation | Planned |

---

## 9. Testing & Verification

### Run Automated Backend Tests
```powershell
pytest backend/tests/ -v
```
All 26 unit and integration tests verify baseline calculations, delta computation, pattern rules, and API endpoints.

### Build Frontend
```powershell
cd frontend
npm run build
```
Production build bundles with Vite without syntax or lint errors.

---

## 10. Ethical Considerations & Privacy

- **Non-Clinical Guarantee:** The system explicitly avoids diagnostic claims. It observes behavioral indicators and lifestyle shifts, not psychiatric disorders.
- **Informed Consent Gate:** Data collection requires explicit user consent.
- **Minimal Identifiers:** Only anonymous Student IDs (e.g. `STU101`) are used. No names, email addresses, or phone numbers are recorded.
- **Offline Resilience:** Deterministic template fallbacks ensure complete functionality without internet access or LLM API keys.
- **Right to Erasure:** A single-click "Delete My Data" feature permanently purges all records associated with a student.

---

## 11. College Project Explanation (Viva Script)

> *"Traditional student wellness applications fail because they repeatedly require students to complete lengthy medical questionnaires, leading to high abandonment rates.*
>
> *Our project introduces **Personalized Behaviour-Based Wellness Detection**. Instead of enforcing universal rules, it learns what is normal for that individual student. When their sleep, screen time, or study hours shift significantly away from their personal baseline, the system flags the change under the **'What Changed?'** module and categorizes the behavioral pattern (such as Academic Workload or Digital Lifestyle).*
>
> *A secondary Random Forest model classifies overall wellness concern tiers, and an LLM converts the analytical results into supportive, non-clinical lifestyle guidance.*
>
> *This provides a low-effort, privacy-focused early warning system tailored to each student's personal lifestyle."*
