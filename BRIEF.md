# DRIFT: Personal Early-Warning Student Wellness System

Build brief for Antigravity (8-day college mini project)

HOW TO USE: Put this file in the project root as BRIEF.md. In Antigravity, start every session with: "Read BRIEF.md fully. We are on DAY N. Do only that day's tasks, run the tests, and tell me how to run and verify it before stopping."

## 0. Rules for the AI agent (paste at the top of every session)
- This is a wellness-support prototype, NOT a diagnostic tool. Never use the words depression, anxiety, disorder, diagnosis, mentally ill in any UI text, code output or LLM output (except inside the banned-word list).
- Build one day at a time. Do not build ahead.
- Keep it simple: no auth providers, no Docker, no microservices, no deep learning.
- After each task: run it, run tests, fix errors, then show me the exact run commands.
- Every engine is a pure Python function with unit tests (input dict -> output dict). The API only wires them together.
- The rule/baseline engines are the main system. ML and LLM are supporting parts.
- The app must work with no internet and no API key (template fallback for the LLM). A demo must never crash.
- Comment code in beginner-friendly language.

## 1. Final decisions (already made)
| Item | Choice | Reason |
|---|---|---|
| Name | Drift | Short, memorable: "we notice when you quietly drift from your own normal" |
| Frontend | React + Vite + Recharts + Tailwind | Fast, good charts |
| Backend | Python FastAPI | Simple, auto docs at /docs |
| Database | SQLite (via SQLAlchemy or sqlite3) | Zero setup, no demo-day failures |
| LLM | Gemini API (free tier) via GEMINI_API_KEY in .env, with a template fallback | Free, and works if the key or network fails |
| ML | scikit-learn Random Forest (secondary, Day 7 if time) | Honest, labelled as synthetic-trained |
| Deployment | Run locally for demo. Optional: Render/Vercel only if Day 8 has spare time | Reduces risk |

## 2. The one-sentence pitch
"Existing wellness apps ask every student the same long survey every day. Drift asks almost nothing, learns what is normal for that one student, and speaks up only when their behaviour quietly drifts away from their own normal, with evidence for every claim."

### Novelty pillars (memorise these)
- **Question Budget Engine**: 3 taps + 1 rotating micro-question per day (about 25 s). Picks the question we are least certain about or that explains a recent change.
- **Personal Normal Band**: each student's own median ± spread, plus a baseline confidence score (honest about the cold-start week).
- **Quiet Drift Detection (CUSUM)**: catches slow declines that threshold alerts miss.
- **Explanation Receipts**: every AI sentence is backed by evidence. Rules produce the facts, the LLM only rephrases, and a validator rejects unsupported numbers or claims.
- **Pattern Memory**: "This week resembles your Week 3" (nearest past weekly fingerprint).

Supporting: Personal Levers (simple personal correlations, worded as "tends to", never "causes"), Counsellor View (anonymised, only groups of 5 or more).

## 3. 8-day schedule
| Day | Goal | Done when |
|---|---|---|
| 1 | Setup, DB, synthetic persona simulator, seed data | `python seed.py` fills DB with 40 personas x 60 days, and one named demo student "S001" with a clear 5-week decline |
| 2 | Core engines: baseline + confidence, What Changed, pattern rules (with unit tests) | pytest passes, and sample JSON output is correct |
| 3 | Drift (CUSUM), safety layer, Question Budget Engine | Tests pass, the demo student fires a drift flag around week 3 |
| 4 | FastAPI endpoints + consent/profile + check-in flow wired to engines | All endpoints work in /docs |
| 5 | Frontend: consent, setup, check-in screen, dashboard cards (Fingerprint radar, What Changed, Timeline) | The check-in takes about 20 s, and the dashboard shows real data |
| 6 | LLM insight + validator + receipts + template fallback; Drift alert card; Pattern Memory | Click an AI sentence -> evidence receipt shows |
| 7 | Evaluation experiments (charts/tables), Personal Levers, optional Random Forest, time-travel demo slider | evaluation/results/ has charts + a CSV |
| 8 | Bug fixing, README, screenshots, report writing, demo rehearsal | A full 3-minute demo runs without errors |

Cut-line if behind (cut in this order): Counsellor View -> Random Forest -> Personal Levers -> Pattern Memory. Never cut: baseline, drift, receipts, safety, evaluation.

Report writing runs alongside: write each section on the day its feature is finished.

## 4. Folder structure
```
drift/
├── BRIEF.md
├── README.md
├── .env.example            # GEMINI_API_KEY=
├── backend/
│   ├── requirements.txt    # fastapi uvicorn sqlalchemy pydantic numpy pandas scikit-learn python-dotenv google-generativeai pytest
│   ├── app/
│   │   ├── main.py         # FastAPI app + CORS
│   │   ├── db.py           # SQLite connection + table creation
│   │   ├── models.py       # table definitions
│   │   ├── schemas.py      # Pydantic request/response models
│   │   ├── api/            # routes: students.py, checkins.py, dashboard.py, counsellor.py
│   │   ├── engines/
│   │   │   ├── baseline.py     # personal band + confidence
│   │   │   ├── changes.py      # What Changed? deltas
│   │   │   ├── patterns.py     # 4 pattern rules
│   │   │   ├── drift.py        # CUSUM
│   │   │   ├── questions.py    # Question Budget Engine
│   │   │   ├── memory.py       # Pattern Memory (similar week)
│   │   │   └── levers.py       # Personal Levers
│   │   ├── safety/safety.py    # rule-based safety layer
│   │   ├── llm/
│   │   │   ├── client.py       # Gemini call
│   │   │   ├── prompt.py       # system prompt
│   │   │   ├── validator.py    # banned words + number check
│   │   │   └── templates.py    # fallback explanation
│   │   └── ml/rf_model.py      # optional Random Forest
│   ├── simulator/
│   │   ├── personas.py         # generate students + injected events
│   │   └── seed.py
│   ├── evaluation/
│   │   ├── run_eval.py
│   │   └── results/
│   └── tests/
├── frontend/
│   └── src/ (pages/, components/, charts/, api.js)
├── data/
└── docs/ (report/, screenshots/)
```

## 5. Data design
### 5.1 Tracked metrics (7)
mood (1-5), stress (1-5), sleep (hours), study (hours), screen (hours), exercise (minutes), social (1-5)

### 5.2 How the data is collected without long surveys
- Daily taps (always): mood (Good=5 / Okay=3 / Not good=1, mapped to 1-5), stress 1-5, main factor.
- One rotating micro-question (chosen by the Question Budget Engine): answered with quick buckets or a slider. Examples: sleep ("<5 / 5-6 / 6-7 / 7-8 / 8+"), screen, exercise, social, study.
- Missing values: use the last known value with a freshness weight (weight = 0.85^days_old). A metric older than 7 days is shown as "not recently measured" and is excluded from pattern rules. Never silently invent data.

### 5.3 SQLite schema
```sql
CREATE TABLE students (
  student_id TEXT PRIMARY KEY,
  year INTEGER, department TEXT, age_range TEXT,
  baseline_sleep REAL, baseline_study REAL,
  consent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT
);
CREATE TABLE checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT, date TEXT,
  mood INTEGER, stress INTEGER, main_factor TEXT,
  micro_key TEXT, micro_value REAL,
  UNIQUE(student_id, date)
);
CREATE TABLE metric_log (          -- one row per metric per day (from taps or micro-answers)
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT, date TEXT, metric TEXT, value REAL
);
CREATE TABLE baselines (
  student_id TEXT, metric TEXT,
  median REAL, spread REAL, confidence REAL, updated_at TEXT,
  PRIMARY KEY (student_id, metric)
);
CREATE TABLE analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT, date TEXT,
  pattern TEXT, deviations_json TEXT, drift_json TEXT,
  similar_week TEXT, explanation TEXT, evidence_json TEXT,
  safety_flag INTEGER DEFAULT 0
);
CREATE TABLE question_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT, date TEXT, question_key TEXT, reason_asked TEXT, answer TEXT
);
```

## 6. Engine specifications (what each file must do)
### 6.1 baseline.py: Personal Normal Band
For each metric, take the student's history (ideally the last 28 days, recent days weighted higher using exponential weights).
median = weighted median. spread = weighted MAD x 1.4826, with a minimum floor per metric (e.g. sleep 0.5 h, stress 0.5) to avoid division by tiny numbers.
Normal band = median ± 1.5 x spread.
Deviation score (z) = (today or recent 3-day mean - median) / spread.
Confidence = min(1, n_observations / 14). Show "Still learning your normal (confidence 40%)" in the UI. In the first 7 days, suppress alerts and show only gentle messages.
Return: {metric: {median, spread, band_low, band_high, z, confidence}}.

### 6.2 changes.py: What Changed?
Compare the last 7 days mean with the previous 14 days mean for each metric.
Return deltas with direction arrows and a "meaningful" flag when |delta| > 1 x spread.
Output sorted by size of change.

### 6.3 patterns.py: 4 behaviour patterns (rule-based, uses z-scores from the baseline)
Each returns {name, matched, evidence: [strings]}. Always include the evidence list.
- Academic workload pattern: study z >= +1 AND sleep z <= -1 AND stress z >= +1
- Digital lifestyle pattern: screen z >= +1 AND sleep z <= -1 AND exercise z <= -1
- Reduced social interaction pattern: social z <= -1 AND mood z <= -1 AND stress z >= +1
- Balanced pattern: all |z| < 1 for the metrics measured recently
If more than one matches, return all, ranked by sum of |z|. A pattern needs at least 2 of its 3 conditions measured recently (otherwise say "not enough data").
UI wording: "behavioural indicator", never a diagnosis.

### 6.3b Optional label strings
"Academic workload-related pattern", "Digital lifestyle pattern", "Reduced social interaction pattern", "Relatively balanced behaviour".

### 6.4 drift.py: Quiet Drift (CUSUM)
Use a frozen reference (the student's first 14 valid days, or the 14 days before the latest 14) for mean and spread, so slow drift is NOT absorbed into the baseline.
For each metric, with direction sign (sleep, mood, exercise, social: bad = down; stress, screen: bad = up; study: both ignored unless combined with sleep): z_t = sign * (x_t - mu_ref) / sigma_ref S_t = max(0, S_(t-1) + z_t - k) with k = 0.5
Flag when S_t > h with h = 4. Return: metric, S series (for the chart), flag day, and plain text: "Your sleep has been drifting down for about N days".
Provide a function that returns the series for plotting.

### 6.5 questions.py: Question Budget Engine
Each day, score every candidate micro-question (sleep, screen, exercise, social, study):
score = staleness_days x importance_weight
      + 3 if the metric is in a recent deviation or drift flag
      + 2 if tied to today's "main factor" (Studies->study, Sleep->sleep, Screen->screen, Social->social)
      - 5 if already asked in the last 2 days

Importance weights: sleep 1.5, stress-related 1.2, others 1.0. Pick the highest. Store the reason_asked ("Haven't checked your sleep for 4 days" / "Your stress is above your normal, so we'd like to understand why"). Escalation: when stress >= 4 AND mood <= 2, offer an optional follow-up of up to 2 extra questions ("Would you like to answer two quick questions?"). Track and show questions per week for the evaluation.

### 6.6 safety.py: rule-based safety layer (no LLM)
- Soft: stress >= 4 on 3 of the last 4 days OR mood "Not good" on 3 consecutive days -> show a gentle supportive message and counsellor info.
- Firm: stress = 5 AND mood = 1 on 2 consecutive days, or the student taps the "I'd like to talk to someone" button -> show a fixed hand-written message with the college counsellor contact placeholder and a general helpline placeholder (TODO: put your college counsellor number). Skip LLM output in this case or append it after the fixed message.
Never says "you have ...".

### 6.7 LLM layer
Input (anonymised JSON, no student ID, no free text): current values, baseline medians, z-scores, deltas, matched pattern, drift flags, confidence.
System prompt: use the one in the original plan (section 17 of the ChatGPT plan), plus "Only use numbers that appear in the input. Do not add any facts."
Output format (ask Gemini for JSON): {"what_changed": "...", "pattern": "...", "factors": "...", "suggestions": ["...","...","..."], "support": "..."}
validator.py:
- Reject if any banned word appears: depression, depressed, anxiety, disorder, diagnos*, mental illness, bipolar, suicid* (the safety layer handles those cases).
- Extract all numbers from the output. Reject if any number is not present (within rounding) in the input JSON.
- On rejection: retry once, then use templates.py (deterministic text built from the same evidence).
Explanation Receipts: each sentence in what_changed / factors carries an evidence_ids list that maps to the evidence strings produced by the rule engines. In the UI, clicking a sentence opens a side panel: "Why am I seeing this? -> Stress is above your normal band (+2.1) on 4 of the last 5 days."

### 6.8 memory.py: Pattern Memory
Each completed week -> a 7-number vector of weekly means (z-scored by baseline).
Cosine or Euclidean distance to all earlier weeks. Return the closest past week if distance < threshold, plus what that week had in common ("Week 3: close in sleep and stress").
Needs at least 3 past weeks, otherwise hide the card.

### 6.9 levers.py: Personal Levers (Day 7, optional)
For the student, compare next-day stress on days after sleep >= their median vs days after sleep < median (need at least 10 days and 4 per group).
Wording: "On days after you slept more than your usual, your next-day stress tended to be about X points lower." Add: "This is a pattern in your own data, not proof of cause."

### 6.10 rf_model.py: optional Random Forest
Train on the synthetic dataset (features: 7 metrics plus academic pressure). Labels = a wellness-concern score rule that is documented (low / moderate / higher), with 10% label noise so it is not trivial.
Report accuracy, confusion matrix and feature importance chart.
Label it clearly: "Trained on synthetic data. Prototype-level concern level only. Not clinically validated." It is a secondary comparison, not the main engine.

## 7. Simulator and evaluation (this creates your Results chapter)
### 7.1 simulator/personas.py
Create 40 students, each with their own normal: sleep 5-8.5 h, stress 1-3, study 1-6 h, screen 2-8 h, exercise 0-60 min, social 2-5, plus day-to-day noise.
Inject events (known start day, so detection delay can be measured):
- Exam-stress phase: study up, sleep down, stress up
- Digital-binge week: screen up, sleep down, exercise down
- Social-withdrawal phase: social down, mood down, stress up
- Slow drift: sleep falls about 15 min per week for 6 weeks
- Control students: no events (to measure false alarms)
Also create demo student S001 by hand: 3 stable weeks, then a gradual decline over weeks 4-6 that triggers Academic workload pattern + sleep drift.

### 7.2 evaluation/run_eval.py: experiments
- Detection delay: days between event start and first flag (Drift/CUSUM vs simple threshold).
- False alarm rate: flags per 100 normal student-days.
- Personal baseline vs fixed global threshold (e.g. sleep < 6 h or stress >= 4): compare precision/recall. Show specific personas where the fixed threshold misfires (the student who normally sleeps 5.5 h).
- Question burden: average questions per student per week vs a traditional daily survey (about 15 per day = 105 per week).
- Optional: RF accuracy and feature importance.
Output: CSV + PNG charts (matplotlib) in evaluation/results/ and a Results table for the report.
Be honest in the report: results are on synthetic personas, so they show the method behaves as designed, not real-world effectiveness.

## 8. API endpoints
| Method | Path | Purpose |
|---|---|---|
| POST | /students | create profile (requires consent: true) |
| GET | /students/{id} | profile |
| GET | /checkin/question/{id} | today's micro-question + reason |
| POST | /checkin | save the 3 taps + micro-answer, return updated analysis |
| GET | /dashboard/{id}?as_of=YYYY-MM-DD | all dashboard data (the as_of param powers the time-travel slider) |
| GET | /insight/{id}?as_of= | LLM explanation with receipts (validated) |
| GET | /timeline/{id} | weekly series |
| GET | /counsellor/summary | anonymised department trends (only groups with 5+ students) |
| GET | /eval/results | evaluation numbers for the demo screen |

## 9. Dashboard (build in this order)
1. Today's Check-in: 3 big tap rows + micro-question card (about 20 s)
2. Wellness Overview: concern level badge + baseline confidence bar
3. Fingerprint Radar: 7 axes, today vs personal normal, ghost overlay of last week
4. What Changed?: arrow list with deltas + one summary sentence
5. Quiet Drift alert: line chart with the normal band shaded and the drift start marked
6. Detected Pattern: card with evidence list
7. AI Insight with Receipts: click a sentence to see its evidence
8. Timeline (weekly charts) + Personal Levers + "This week feels like..."
9. Time-travel slider (demo mode only, for the seeded student) that re-fetches with as_of
Footer on every page: "Educational wellness-support prototype. Not a medical diagnostic tool."

Design: clean cards, calm colours (soft teal/indigo), big tap targets, dark mode optional. Charts over text.

## 10. Privacy checklist
- Consent screen before any data is stored (checkbox required)
- Student ID only (no names, no emails)
- API key only in backend .env (never in frontend; .env in .gitignore)
- LLM receives only anonymised metrics JSON
- Counsellor view is aggregate-only with k >= 5
- "Delete my data" button (deletes all rows for that student ID)

## 11. Antigravity prompts: copy one per day

### DAY 1
Read BRIEF.md fully. We are on DAY 1. Set up the folder structure from section 4 (backend with FastAPI + SQLite, frontend with Vite React). Create the SQLite tables from section 5.3. Build simulator/personas.py and seed.py following section 7.1, including the hand-made demo student S001. Run the seed, then print row counts and one student's last 10 days. Give me the commands to run the backend and verify. Do nothing from later days.

### DAY 2
DAY 2. Implement engines/baseline.py, changes.py, patterns.py exactly per sections 6.1-6.3, with pytest tests (stable student, declining student, cold-start student with under 7 days). Show the JSON output for S001 at week 2 and week 5.

### DAY 3
DAY 3. Implement drift.py (CUSUM), safety/safety.py and questions.py per sections 6.4-6.6 with tests. Show for S001 the date when the sleep drift flag first fires, and the micro-question chosen for 7 consecutive days.

### DAY 4
DAY 4. Build the FastAPI endpoints in section 8 (except counsellor and eval for now), wiring the engines together, with consent enforcement and the as_of parameter. Test via /docs and write a small tests/test_api.py.

### DAY 5
DAY 5. Build the React frontend: consent + profile setup, the check-in screen (3 taps + micro-question), and dashboard cards 1-4 and 8 (Timeline) from section 9, using Recharts. Use Tailwind and a calm design. Connect to the API. Give me run steps and a checklist of what I should see.

### DAY 6
DAY 6. Implement the LLM layer per section 6.7 (Gemini client, prompt, validator, template fallback, evidence IDs). Add the Drift alert card, Pattern card, AI Insight with clickable receipts, and Pattern Memory (6.8). Test: the validator must reject an output that contains an invented number or a banned word. Demonstrate with unit tests, and show that the app works with the API key removed.

### DAY 7
DAY 7. Build evaluation/run_eval.py per section 7.2 and produce charts and a results CSV. Add the time-travel slider for the demo student, the counsellor summary endpoint (k >= 5) and Personal Levers (6.9). If time remains, add the Random Forest (6.10) with feature importance. Summarise the results numbers for my report.

### DAY 8
DAY 8. Do a full bug sweep: run all tests, run the full user flow, fix errors, polish the UI, write README.md (setup, run, architecture diagram, limitations). Add a "Delete my data" button. Prepare the demo rehearsal checklist.

## 12. Report mapping
| Report section | Source in this project |
|---|---|
| Abstract, Introduction, Problem, Motivation | Sections 1-2 of this brief |
| Existing system | Fixed daily surveys; generic apps with global thresholds |
| Proposed system, Novelty | Section 2 pillars |
| Architecture, Methodology, Modules | Sections 4 and 6 |
| Dataset, Preprocessing | Simulator (7.1) and baseline logic. State clearly that the data is synthetic |
| ML and LLM methodology | 6.7 and 6.10 |
| Database, UI | 5.3 and 9 |
| Results | Evaluation outputs (7.2) |
| Limitations | Synthetic data only, no clinical validation, self-reported inputs, cold start, small sample |
| Ethics | Section 10 + safety layer + not-a-diagnosis statement |
| Future scope | Real consented pilot, wearable integration (optional), counsellor dashboard, multilingual support (e.g. Tamil) |

## 13. 3-minute demo script
1. (20 s) Show the problem: a typical 15-question daily survey vs Drift's 25-second check-in. Do a live check-in.
2. (30 s) Open S001's dashboard. Explain "learning your normal" and the confidence bar.
3. (60 s) Drag the time-travel slider from week 2 to week 5. Fingerprint morphs, and the Quiet Drift alert fires before stress looks "high".
4. (30 s) Click an AI sentence to reveal its evidence receipt. Mention the validator.
5. (30 s) Show the evaluation chart: detection delay and personal baseline vs fixed threshold.
6. (10 s) Close with the safety layer and the not-a-diagnosis statement.
