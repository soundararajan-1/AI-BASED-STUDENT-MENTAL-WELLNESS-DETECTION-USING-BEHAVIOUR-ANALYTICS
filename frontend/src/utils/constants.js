/**
 * System-wide constants, ethical disclaimers, and phase definitions.
 */

export const PROJECT_TITLE = "AI-Based Student Mental Wellness Detection Using Behaviour Analytics";
export const PROJECT_SUBTITLE = "Personalized Behaviour-Based Wellness Analysis for Higher Education";

export const ETHICAL_DISCLAIMER =
  "Educational wellness-support prototype. Not a medical diagnostic tool. Does not diagnose depression, anxiety, or medical conditions.";

export const ROADMAP_PHASES = [
  { id: 1, title: "Phase 1: Project Setup & Health API", status: "completed", desc: "FastAPI + React initialization, health check endpoint, environment configurations." },
  { id: 2, title: "Phase 2: Database Schema & CRUD", status: "pending", desc: "Supabase PostgreSQL tables for students, checkins, behaviour_analysis, adaptive_questions." },
  { id: 3, title: "Phase 3: Auth & Onboarding", status: "pending", desc: "Consent verification, minimal student profiles, and onboarding baseline capture." },
  { id: 4, title: "Phase 4: Quick Daily Check-In", status: "pending", desc: "3-question low-effort daily check-in (mood, stress, main affecting factor)." },
  { id: 5, title: "Phase 5: Personal Baseline Engine", status: "pending", desc: "Computing individual rolling baseline for sleep, study, screen, exercise, social, mood, stress." },
  { id: 6, title: "Phase 6: Behaviour Analytics & Deltas", status: "pending", desc: "Personalized delta calculations vs personal baseline instead of rigid global cutoffs." },
  { id: 7, title: "Phase 7: What Changed? Feature", status: "pending", desc: "Prominent dashboard card showing signed parameter deltas and intuitive summaries." },
  { id: 8, title: "Phase 8: Statistical Trend Analysis", status: "pending", desc: "7-day, 14-day, and 30-day directional trends (improving, stable, increasing concern)." },
  { id: 9, title: "Phase 9: Behaviour Pattern Engine", status: "pending", desc: "Detection of Academic Workload, Digital Lifestyle, Reduced Social Interaction, Sleep Disruption." },
  { id: 10, title: "Phase 10: Random Forest ML Benchmark", status: "pending", desc: "Secondary ML classifier for wellness concern categories with confusion matrix & metrics." },
  { id: 11, title: "Phase 11: Student Dashboard", status: "pending", desc: "Full student-friendly React dashboard with 0-100 indicator and 7-axis Fingerprint Radar." },
  { id: 12, title: "Phase 12: Adaptive Question Engine", status: "pending", desc: "Dynamic 2-3 follow-up questions triggered only upon detecting unusual behavioral deviations." },
  { id: 13, title: "Phase 13: LLM Explanations & Safety", status: "pending", desc: "OpenAI GPT integration for non-clinical explanations and actionable wellness guidance." },
  { id: 14, title: "Phase 14: Automated Testing & Validation", status: "pending", desc: "Test scenarios for balanced lifestyle, workload surge, digital overload, and improvement." },
  { id: 15, title: "Phase 15: Deployment & Packaging", status: "pending", desc: "Production containerization, hosting configurations, and cross-platform verification." },
  { id: 16, title: "Phase 16: Documentation & Presentation", status: "pending", desc: "Viva explanation guide, project report, slides, and demonstration walkthrough." }
];

export const NOVELTY_PILLARS = [
  {
    title: "Personal Baseline vs Fixed Thresholds",
    tag: "Novelty 1",
    desc: "Learns what is normal for that specific student. A student naturally sleeping 6 hours won't be falsely flagged, while an 8-hour sleeper dropping to 6 hours will be detected."
  },
  {
    title: "Low-Effort 'What Changed?' Deltas",
    tag: "Novelty 2",
    desc: "Replaces 20-minute diagnostic questionnaires with ~25 second check-ins that compute explicit signed deltas (e.g., Sleep ↓ 2h, Stress ↑ 2) directly from your personal reference."
  },
  {
    title: "Rule-Based Pattern Engine + Secondary ML",
    tag: "Novelty 3",
    desc: "Transparently classifies academic workload, digital overload, and social withdrawal patterns using deterministic rules, reinforced by a Random Forest benchmark."
  },
  {
    title: "Grounded LLM Guidance with Non-Clinical Safety",
    tag: "Novelty 4",
    desc: "Converts structured analytical results into plain-language advice without psychiatric labels or hallucinated data, backed by strict crisis support escalation."
  }
];
