"""
End-to-End Integration Test for Multi-Role Login, Admin Verification,
Counsellor Alert Broadcast, and Live 1-on-1 Chat.
"""

import time
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_complete_wellness_auth_and_counsellor_alert_flow():
    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

    # 2. Register new student with 'pending' status
    sid = f"STU_E2E_{int(time.time())}"
    res_reg_stu = client.post("/auth/register/student", json={
        "student_id": sid,
        "name": "Kavya Nair",
        "department": "Biotechnology",
        "year": 3,
        "password": "passKavya123!"
    })
    assert res_reg_stu.status_code == 201
    assert res_reg_stu.json()["status"] == "pending"

    # 3. Blocked login before approval
    res_block = client.post("/auth/login", json={
        "role": "student",
        "identifier": sid,
        "password": "passKavya123!"
    })
    assert res_block.status_code == 403
    assert "pending administrator verification" in res_block.json()["detail"]

    # 4. Admin pending approvals list
    res_admin_p = client.get("/auth/admin/pending-approvals")
    assert res_admin_p.status_code == 200
    p_stus = res_admin_p.json()["pending_students"]
    assert any(s["student_id"] == sid for s in p_stus)

    # 5. Admin approves student
    res_appr = client.post("/auth/admin/verify-user", json={
        "user_type": "student",
        "identifier": sid,
        "action": "approve"
    })
    assert res_appr.status_code == 200
    assert res_appr.json()["status"] == "approved"

    # 6. Student login succeeds now
    res_stu_log = client.post("/auth/login", json={
        "role": "student",
        "identifier": sid,
        "password": "passKavya123!"
    })
    assert res_stu_log.status_code == 200
    assert res_stu_log.json()["role"] == "student"

    # 7. Register new counsellor
    c_email = f"counsellor_{int(time.time())}@campus.edu"
    res_reg_c = client.post("/auth/register/counsellor", json={
        "email": c_email,
        "name": "Dr. Sarah Jenkins",
        "password": "counsellorPassword!",
        "specialization": "Clinical Anxiety Management",
        "phone": "+1 800 273 8255"
    })
    assert res_reg_c.status_code == 201
    assert res_reg_c.json()["status"] == "pending"

    # 8. Counsellor login blocked before approval
    res_c_block = client.post("/auth/login", json={
        "role": "counsellor",
        "identifier": c_email,
        "password": "counsellorPassword!"
    })
    assert res_c_block.status_code == 403

    # 9. Admin approves counsellor
    res_c_appr = client.post("/auth/admin/verify-user", json={
        "user_type": "counsellor",
        "identifier": c_email,
        "action": "approve"
    })
    assert res_c_appr.status_code == 200

    # 10. Counsellor login succeeds
    res_c_log = client.post("/auth/login", json={
        "role": "counsellor",
        "identifier": c_email,
        "password": "counsellorPassword!"
    })
    assert res_c_log.status_code == 200
    assert res_c_log.json()["role"] == "counsellor"

    # 11. Student raises counsellor alert
    res_alert = client.post("/counsellor/alerts", json={
        "student_id": sid,
        "student_name": "Kavya Nair",
        "department": "Biotechnology",
        "urgency": "urgent",
        "topic": "Severe Panic and Exam Pressure",
        "notes": "Unable to concentrate, high heart rate."
    })
    assert res_alert.status_code == 200
    alert_id = res_alert.json()["alert_id"]
    assert alert_id.startswith("ALT-")

    # 12. Counsellor lists alerts
    res_alerts_list = client.get("/counsellor/alerts?status=open")
    assert res_alerts_list.status_code == 200
    assert any(a["alert_id"] == alert_id for a in res_alerts_list.json()["alerts"])

    # 13. Counsellor accepts alert
    res_accept = client.post(f"/counsellor/alerts/{alert_id}/accept", json={
        "counsellor_email": c_email,
        "counsellor_name": "Dr. Sarah Jenkins"
    })
    assert res_accept.status_code == 200
    assert res_accept.json()["status"] == "accepted"

    # 14. Student checks active alert
    res_active = client.get(f"/counsellor/student-active-alert/{sid}")
    assert res_active.status_code == 200
    active_alert = res_active.json()["active_alert"]
    assert active_alert["status"] == "accepted"
    assert active_alert["accepted_by"] == "Dr. Sarah Jenkins"

    # 15. Student sends message
    res_s_msg = client.post(f"/counsellor/alerts/{alert_id}/messages", json={
        "sender_role": "student",
        "sender_name": "Kavya Nair",
        "sender_id": sid,
        "message": "Hello Dr. Jenkins, thank you for responding so fast."
    })
    assert res_s_msg.status_code == 200

    # 16. Counsellor sends message
    res_c_msg = client.post(f"/counsellor/alerts/{alert_id}/messages", json={
        "sender_role": "counsellor",
        "sender_name": "Dr. Sarah Jenkins",
        "sender_id": c_email,
        "message": "Hello Kavya, I am right here with you. Take a slow, deep breath."
    })
    assert res_c_msg.status_code == 200

    # 17. Check message history
    res_msgs = client.get(f"/counsellor/alerts/{alert_id}/messages")
    assert res_msgs.status_code == 200
    msgs = res_msgs.json()["messages"]
    assert len(msgs) >= 2

    # 18. Resolve session
    res_resolve = client.post(f"/counsellor/alerts/{alert_id}/resolve")
    assert res_resolve.status_code == 200
    assert res_resolve.json()["status"] == "resolved"

    # 19. Verify active alert is now cleared
    res_cleared = client.get(f"/counsellor/student-active-alert/{sid}")
    assert res_cleared.status_code == 200
    assert res_cleared.json()["active_alert"] is None
