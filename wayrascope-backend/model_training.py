import pandas as pd
from sklearn.linear_model import LinearRegression
import joblib

# 🔹 Simulamos datos históricos (en tu versión final usaremos dataset NASA)
data = {
    "temperature": [20, 22, 25, 27, 30, 35, 15, 18, 40, 10],
    "humidity": [70, 65, 60, 55, 80, 90, 60, 75, 85, 50],
    "wind": [10, 12, 8, 5, 20, 15, 7, 9, 25, 4],
    "precipitation": [3, 1, 2, 4, 6, 8, 0, 2, 7, 5],
    "comfort_index": [78, 80, 90, 85, 60, 50, 88, 83, 45, 70]
}

df = pd.DataFrame(data)

# 🔹 Entrenar modelo de regresión lineal
X = df[["temperature", "humidity", "wind", "precipitation"]]
y = df["comfort_index"]

model = LinearRegression()
model.fit(X, y)

# 🔹 Guardar modelo entrenado
joblib.dump(model, "wayrapredict_model.pkl")

print("✅ Modelo WayraPredict entrenado y guardado correctamente.")
