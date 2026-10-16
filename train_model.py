import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Load dataset
df = pd.read_csv("dataset/StressLevelDataset.csv")

# Features (X)
X = df.drop("stress_level", axis=1)

# Target (y)
y = df["stress_level"]

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Train model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

model.fit(X_train, y_train)

# Prediction
y_pred = model.predict(X_test)

# Accuracy
accuracy = accuracy_score(y_test, y_pred)

print("="*50)
print("MODEL TRAINED SUCCESSFULLY")
print("="*50)

print(f"\nAccuracy : {accuracy*100:.2f}%")

print("\nClassification Report\n")
print(classification_report(y_test, y_pred))

# Save model
joblib.dump(model, "model/stress_model.pkl")

print("\nModel saved successfully!")