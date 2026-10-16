/**
 * API client for Drift: Student Wellness Early-Warning System.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

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

export async function fetchDailyQuestion(studentId) {
  const res = await fetch(`${API_BASE}/checkin/question/${studentId}`);
  if (!res.ok) throw new Error("Failed to load question");
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

export async function fetchCounsellorSummary() {
  const res = await fetch(`${API_BASE}/counsellor/summary`);
  if (!res.ok) throw new Error("Failed to load counsellor summary");
  return res.json();
}

export async function fetchEvaluationResults() {
  const res = await fetch(`${API_BASE}/eval/results`);
  if (!res.ok) throw new Error("Failed to load evaluation results");
  return res.json();
}

/**
 * Sends a student's plain-language question to Drift's AI query engine.
 * Returns a personalised, evidence-grounded reply based on their own data.
 * @param {string} studentId
 * @param {string} question - The student's question
 */
export async function askDrift(studentId, question) {
  const res = await fetch(`${API_BASE}/ask/${studentId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to get a reply from Drift");
  }
  return res.json();
}

/**
 * Multi-turn real-time chat with generative Gemini integration & counsellor recommendations.
 */
export async function sendStudentChat(studentId, { question, history = [], apiKey = null }) {
  const payload = { question, history };
  if (apiKey) {
    payload.api_key = apiKey;
  }
  const res = await fetch(`${API_BASE}/chat/${studentId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to process chat message");
  }
  return res.json();
}

/**
 * Confidential session booking with campus counsellor directly from chat.
 */
export async function bookCounsellorSession({ studentId, slot, urgency = "Normal", note = "", contactMethod = "In-person (Room 204)" }) {
  const res = await fetch(`${API_BASE}/chat/book-counsellor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_id: studentId,
      slot,
      urgency,
      note,
      contact_method: contactMethod
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to book counsellor session");
  }
  return res.json();
}

export async function verifyGeminiKey(apiKey) {
  const res = await fetch(`${API_BASE}/chat/verify-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Invalid Gemini API key or connection error");
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
    throw new Error(err.detail || "Failed to broadcast counsellor alert");
  }
  return res.json();
}

export async function fetchStudentActiveAlert(studentId) {
  const res = await fetch(`${API_BASE}/counsellor/student-active-alert/${studentId}`);
  if (!res.ok) throw new Error("Failed to check active alert");
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

export async function resolveCounsellorAlert(alertId) {
  const res = await fetch(`${API_BASE}/counsellor/alerts/${alertId}/resolve`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to resolve alert");
  return res.json();
}
