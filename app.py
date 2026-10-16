from flask import Flask, render_template, request
import joblib
import numpy as np

app = Flask(__name__)

# Load trained model
model = joblib.load("model/stress_model.pkl")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/assessment")
def assessment():
    return render_template("assessment.html")

@app.route("/predict", methods=["POST"])
def predict():

    features = [
        int(request.form["anxiety_level"]),
        int(request.form["self_esteem"]),
        int(request.form["mental_health_history"]),
        int(request.form["depression"]),
        int(request.form["headache"]),
        int(request.form["blood_pressure"]),
        int(request.form["sleep_quality"]),
        int(request.form["breathing_problem"]),
        int(request.form["noise_level"]),
        int(request.form["living_conditions"]),
        int(request.form["safety"]),
        int(request.form["basic_needs"]),
        int(request.form["academic_performance"]),
        int(request.form["study_load"]),
        int(request.form["teacher_student_relationship"]),
        int(request.form["future_career_concerns"]),
        int(request.form["social_support"]),
        int(request.form["peer_pressure"]),
        int(request.form["extracurricular_activities"]),
        int(request.form["bullying"])
    ]

    prediction = model.predict([features])[0]

    probability = model.predict_proba([features])

    confidence = round(np.max(probability) * 100, 2)

    if prediction == 0:
        level = "Low Stress 😊"
    elif prediction == 1:
        level = "Moderate Stress 😐"
    else:
        level = "High Stress 😟"

    return render_template(
        "result.html",
        prediction=level,
        confidence=confidence
    )


if __name__ == "__main__":
    app.run(debug=True)