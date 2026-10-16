# API Documentation: AI-Based Student Mental Wellness Detection

> **Base URL:** `http://localhost:8000`  
> **Interactive Swagger UI:** `http://localhost:8000/docs`  
> **OpenAPI Specification JSON:** `http://localhost:8000/openapi.json`  
> **Notice:** Educational wellness-support prototype. Not a medical diagnostic tool.

---

## 1. Authentication & Student Profiles

### `POST /auth/register`
Registers a new student profile and records baseline metrics.
- **Request Body:**
  ```json
  {
    "student_id": "STU101",
    "department": "Artificial Intelligence and Data Science",
    "year": 3,
    "consent": true,
    "baseline_sleep": 7.5,
    "baseline_study": 3.5,
    "baseline_screen": 4.0,
    "baseline_exercise": 1.0,
    "baseline_social": 3.0,
    "baseline_mood": 4.0,
    "baseline_stress": 2.0
  }
  ```
- **Response (201):**
  ```json
  {
    "student_id": "STU101",
    "status": "registered",
    "consent": true,
    "created_at": "2026-10-08T14:30:00Z"
  }
  ```

### `POST /auth/login`
Unified authentication endpoint supporting Student, Counsellor, and Administrator roles.
- **Request Body:**
  ```json
  {
    "role": "student", // "student" | "counsellor" | "admin"
    "identifier": "S001", // Student ID, Counsellor email, or Admin username
    "password": "" // Optional for student demo, required for counsellor/admin
  }
  ```
- **Response (200 - Student):**
  ```json
  {
    "token": "sess-student-S001",
    "role": "student",
    "user": {
      "student_id": "S001",
      "department": "Computer Science",
      "year": 2,
      "consent": true
    },
    "message": "Welcome back, Student S001!"
  }
  ```
- **Response (200 - Counsellor):**
  ```json
  {
    "token": "sess-counsellor-campus",
    "role": "counsellor",
    "user": {
      "name": "Campus Wellness Counsellor",
      "email": "counsellor@campus.edu",
      "department_access": "All Departments (k >= 5 anonymized)"
    },
    "message": "Counsellor session authenticated with strict k-anonymity guarantee."
  }
  ```
- **Response (200 - Admin):**
  ```json
  {
    "token": "sess-admin-super",
    "role": "admin",
    "user": {
      "name": "System Administrator",
      "email": "admin@campus.edu"
    },
    "message": "Administrator privileges granted."
  }
  ```

### `GET /auth/admin/stats`
Returns system telemetry, database counts, and model diagnostics for the Admin Console.
- **Response (200):**
  ```json
  {
    "system_status": "operational",
    "total_students": 41,
    "consented_students": 41,
    "total_checkins_logged": 2460,
    "total_metric_datapoints": 7632,
    "tracked_departments": ["Computer Science", "Mechanical Engineering", "..."],
    "database_engine": "SQLite / PostgreSQL Compatible"
  }
  ```

### `GET /students/{student_id}`
Retrieves student profile and baseline metrics.

---

## 2. Daily Check-ins

### `POST /checkins`
Submits a daily quick or detailed check-in.
- **Request Body:**
  ```json
  {
    "student_id": "STU101",
    "mood": 2,
    "stress": 4,
    "main_factor": "Studies",
    "sleep_hours": 5.5,
    "study_hours": 6.5,
    "screen_time": 6.0,
    "exercise": 0.5,
    "social_interaction": 2.0,
    "academic_pressure": 4
  }
  ```
- **Response (201):**
  ```json
  {
    "checkin_id": 42,
    "student_id": "STU101",
    "status": "recorded",
    "timestamp": "2026-10-08T14:35:00Z"
  }
  ```

### `GET /checkins/{student_id}`
Retrieves historical check-in records for a given student.

---

## 3. Behaviour Analytics & Insights

### `GET /analysis/{student_id}`
Returns the comprehensive analytical summary for the student.

### `GET /analysis/{student_id}/what-changed`
Returns computed deltas between current behavior and the student's personal baseline.
- **Response (200):**
  ```json
  {
    "student_id": "STU101",
    "deltas": {
      "sleep": -2.0,
      "study": 3.0,
      "screen": 2.0,
      "exercise": -0.5,
      "social": -1.0,
      "mood": -2.0,
      "stress": 2.0
    },
    "summary": "Compared with your recent baseline, your study and screen time have increased while your sleep and mood have decreased."
  }
  ```

### `GET /analysis/{student_id}/trends`
Returns 7-day, 14-day, and 30-day directional trends (Improving, Stable, Increasing Concern).

### `GET /analysis/{student_id}/fingerprint`
Returns the 7-dimensional behavioral fingerprint (Current vs Baseline) formatted for radar charts.

---

## 4. Machine Learning & AI

### `POST /ml/predict`
Runs the Random Forest model on the student's current behavioural feature vector.
- **Request Body:**
  ```json
  {
    "sleep_hours": 5.5,
    "study_hours": 6.5,
    "screen_time": 6.0,
    "exercise": 0.5,
    "social_interaction": 2.0,
    "mood": 2,
    "stress": 4,
    "academic_pressure": 4
  }
  ```
- **Response (200):**
  ```json
  {
    "wellness_category": "Higher wellness concern",
    "confidence": 0.88,
    "model": "Random Forest Classifier (Synthetic-trained benchmark)"
  }
  ```

### `POST /ai/insight`
Calls the backend LLM service to convert analytical JSON into non-clinical plain-language guidance.

---

## 5. System Health Check

### `GET /health`
Verifies backend operational status and connectivity.
- **Response (200):**
  ```json
  {
    "status": "healthy",
    "service": "AI-Based Student Mental Wellness Detection API",
    "version": "1.0.0",
    "environment": "development",
    "database_configured": false,
    "ml_model_status": "standby",
    "disclaimer": "Educational wellness-support prototype. Not a medical diagnostic tool."
  }
  ```
