import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./index.css";

const API_BASE = "http://127.0.0.1:8000";

export default function App() {
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      // 🔹 1. Obtener coordenadas automáticamente
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=es`
      );
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0)
        throw new Error("No se encontró la ciudad");

      const { latitude, longitude } = geoData.results[0];

      // 🔹 2. Formatear la fecha para NASA (YYYYMMDD)
      const dateFormatted = date.replaceAll("-", "");

      // 🔹 3. Llamar al backend WayraScope
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: latitude,
          lon: longitude,
          start_date: dateFormatted,
          end_date: dateFormatted,
        }),
      });

      if (!res.ok) throw new Error("Error obteniendo datos del clima");

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>☁️ WayraScope AI</h1>
      <p>
        Explora el clima desde el espacio 🌎. Solo ingresa tu ciudad y fecha, y
        deja que la IA te muestre el confort climático real.
      </p>

      <div className="input-container">
        <input
          type="text"
          placeholder="Ciudad (ej: Huánuco)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analizando..." : "Analizar clima 🚀"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {data && (
        <div className="results">
          <h2>Resultados para {city}</h2>
          <p>🌡️ Temperatura: {data.temperature}°C</p>
          <p>💧 Humedad: {data.humidity}%</p>
          <p>🌬️ Viento: {data.wind} km/h</p>
          <p>🌧️ Precipitación: {data.precipitation} mm</p>
          <p>🌿 Calidad del aire (AQI): {data.air_quality_index}</p>
          <p>💫 Confort climático: {data.comfort_index}</p>
          <p>🌍 Impacto ecológico: {data.eco_impact}</p>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={[
                {
                  temperature: data.temperature,
                  humidity: data.humidity,
                  precipitation: data.precipitation,
                  wind: data.wind,
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="temperature" label={{ value: "Temp (°C)" }} />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="humidity"
                stroke="#00FFFF"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="precipitation"
                stroke="#ff66ff"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
