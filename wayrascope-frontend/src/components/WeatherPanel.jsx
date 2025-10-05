import React from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function WeatherPanel({ data }) {
  if (!data) return null;

  const chartData = [
    { name: "Temperatura (°C)", value: data.temperature || 0 },
    { name: "Humedad (%)", value: data.humidity || 0 },
    { name: "Viento (km/h)", value: data.wind || 0 },
    { name: "Precipitación (mm)", value: data.precipitation || 0 },
  ];

  const COLORS = ["#00E5FF", "#26C6DA", "#80DEEA", "#4DD0E1"];

  return (
    <div className="bg-[#0F2747] text-white p-6 rounded-2xl mt-8 shadow-lg max-w-3xl w-full border border-cyan-400">
      <h2 className="text-2xl font-semibold text-cyan-300 mb-4 text-center">
        Resultados para {data.location?.city || "la ubicación"}
      </h2>

      <div className="flex flex-col md:flex-row justify-center items-center gap-8">
        {/* Pie Chart */}
        <div className="w-60 h-60">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                fill="#00E5FF"
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Detalles */}
        <div className="text-gray-200 text-sm space-y-2">
          <p>🌡 <b>Temperatura:</b> {data.temperature?.toFixed(1)} °C</p>
          <p>💧 <b>Humedad:</b> {data.humidity?.toFixed(1)} %</p>
          <p>💨 <b>Viento:</b> {data.wind?.toFixed(1)} km/h</p>
          <p>🌧 <b>Precipitación:</b> {data.precipitation?.toFixed(1)} mm</p>
          <p>🌿 <b>Calidad del aire (AQI):</b> {data.air_quality_index || "Desconocido"}</p>
          <p>☀️ <b>Confort climático:</b> {data.comfort_index || 0}</p>
          <p>🌎 <b>Impacto ecológico:</b> {data.eco_impact || "Desconocido"}</p>
        </div>
      </div>

      {/* Gráfico de barras */}
      <div className="mt-6">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fill: "#B2EBF2", fontSize: 12 }} />
            <YAxis tick={{ fill: "#B2EBF2", fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#00BCD4" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-center text-cyan-200 italic mt-3">
        {data.wayra_advisor || "Análisis completo generado por la IA 🌤️"}
      </p>
    </div>
  );
}
