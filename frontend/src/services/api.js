/**
 * Central API Service for AI-Based Student Mental Wellness Detection.
 * Communicates with the FastAPI backend.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function checkBackendHealth() {
  const startTime = performance.now();
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(5000) });
    const latency = Math.round(performance.now() - startTime);
    if (!res.ok) {
      return { status: "error", code: res.status, latency };
    }
    const data = await res.json();
    return { ...data, latency };
  } catch (err) {
    return {
      status: "offline",
      error: err.message,
      latency: Math.round(performance.now() - startTime)
    };
  }
}

export async function fetchRootMeta() {
  const res = await fetch(`${API_BASE}/`);
  if (!res.ok) throw new Error("Backend unavailable");
  return res.json();
}

export async function loginUser(role, identifier, password = "") {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, identifier, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Authentication failed. Please check credentials.");
  }
  return res.json();
}

export async function registerStudent(payload) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Registration failed.");
  }
  return res.json();
}

export async function fetchAdminStats() {
  const res = await fetch(`${API_BASE}/auth/admin/stats`);
  if (!res.ok) throw new Error("Failed to load admin stats");
  return res.json();
}

export async function fetchCounsellorSummary() {
  const res = await fetch(`${API_BASE}/counsellor/summary`);
  if (!res.ok) throw new Error("Failed to load counsellor summary");
  return res.json();
}

export async function fetchStudent(studentId) {
  const res = await fetch(`${API_BASE}/students/${studentId}`);
  if (!res.ok) throw new Error("Student not found");
  return res.json();
}

export async function createStudent(payload) {
  const res = await fetch(`${API_BASE}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create profile");
  }
  return res.json();
}

export async function deleteStudentData(studentId) {
  const res = await fetch(`${API_BASE}/students/${studentId}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete student data");
  return res.json();
}

export async function submitCheckin(payload) {
  const res = await fetch(`${API_BASE}/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to submit check-in");
  }
  return res.json();
}

export async function fetchDailyQuestion(studentId) {
  const res = await fetch(`${API_BASE}/checkin/question/${studentId}`);
  if (!res.ok) throw new Error("Failed to load question");
  return res.json();
}

export async function fetchDashboard(studentId, asOf = null) {
  const url = asOf
    ? `${API_BASE}/dashboard/${studentId}?as_of=${asOf}`
    : `${API_BASE}/dashboard/${studentId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load dashboard");
  return res.json();
}

export async function fetchInsight(studentId, asOf = null) {
  const url = asOf
    ? `${API_BASE}/insight/${studentId}?as_of=${asOf}`
    : `${API_BASE}/insight/${studentId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load insight");
  return res.json();
}

export async function fetchTimeline(studentId) {
  const res = await fetch(`${API_BASE}/timeline/${studentId}`);
  if (!res.ok) throw new Error("Failed to load timeline");
  return res.json();
}

export async function fetchEvaluationResults() {
  const res = await fetch(`${API_BASE}/eval/results`);
  if (!res.ok) throw new Error("Failed to load evaluation results");
  return res.json();
}

export async function registerCounsellor(payload) {
  const res = await fetch(`${API_BASE}/auth/register/counsellor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Counsellor registration failed.");
  }
  return res.json();
}

export async function fetchPendingApprovals() {
  const res = await fetch(`${API_BASE}/auth/admin/pending-approvals`);
  if (!res.ok) throw new Error("Failed to load pending approvals");
  return res.json();
}

export async function verifyUserAccount(payload) {
  const res = await fetch(`${API_BASE}/auth/admin/verify-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Verification update failed.");
  }
  return res.json();
}

export async function raiseCounsellorAlert(payload) {
  const res = await fetch(`${API_BASE}/counsellor/alerts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to broadcast counsellor alert.");
  }
  return res.json();
}

export async function fetchCounsellorAlerts(status = "all") {
  const url = status && status !== "all"
    ? `${API_BASE}/counsellor/alerts?status=${status}`
    : `${API_BASE}/counsellor/alerts`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch counsellor alerts");
  return res.json();
}

export async function acceptCounsellorAlert(alertId, payload) {
  const res = await fetch(`${API_BASE}/counsellor/alerts/${alertId}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to accept counsellor alert.");
  }
  return res.json();
}

export async function resolveCounsellorAlert(alertId) {
  const res = await fetch(`${API_BASE}/counsellor/alerts/${alertId}/resolve`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to resolve counsellor alert");
  return res.json();
}

export async function fetchAlertMessages(alertId) {
  const res = await fetch(`${API_BASE}/counsellor/alerts/${alertId}/messages`);
  if (!res.ok) throw new Error("Failed to load session messages");
  return res.json();
}

export async function sendAlertMessage(alertId, payload) {
  const res = await fetch(`${API_BASE}/counsellor/alerts/${alertId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to send message");
  }
  return res.json();
}

export async function fetchStudentActiveAlert(studentId) {
  const res = await fetch(`${API_BASE}/counsellor/student-active-alert/${studentId}`);
  if (!res.ok) throw new Error("Failed to check active alert");
  return res.json();
}
