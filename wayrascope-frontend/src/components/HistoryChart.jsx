import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function HistoryChart({ historyData }) {
  if (!historyData || historyData.length === 0) {
    return (
      <div className="text-center text-gray-400 italic mt-4">
        No hay datos históricos disponibles para esta ubicación aún.
      </div>
    );
  }

  return (
    <div className="bg-[#0a192f] text-white rounded-2xl shadow-lg p-6 mt-8 border border-cyan-700/30">
      <h2 className="text-2xl font-bold mb-4 text-cyan-300 text-center">
        Tendencia histórica del clima 🌤️
      </h2>
      <p className="text-sm text-gray-400 text-center mb-4">
        Visualiza la variación promedio de temperatura, humedad y viento
        durante las últimas semanas según los datos de observación satelital.
      </p>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart
          data={historyData}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" />
          <XAxis dataKey="date" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #0ea5e9",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#06b6d4"
            strokeWidth={2.5}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="Temperatura (°C)"
          />
          <Line
            type="monotone"
            dataKey="humidity"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            name="Humedad (%)"
          />
          <Line
            type="monotone"
            dataKey="wind"
            stroke="#22d3ee"
            strokeWidth={1.8}
            name="Viento (km/h)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
