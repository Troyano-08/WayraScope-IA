// src/api/backend.js
export async function analyzeWeather(lat, lon, start, end) {
  try {
    const response = await fetch("http://127.0.0.1:8000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        start_date: start,
        end_date: end,
      }),
    });

    if (!response.ok) {
      throw new Error("Error al obtener datos del backend");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error en analyzeWeather:", error);
    throw error;
  }
}

export async function compareWeather(lat, lon, start, end) {
  try {
    const response = await fetch("http://127.0.0.1:8000/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        start_date: start,
        end_date: end,
      }),
    });

    if (!response.ok) {
      throw new Error("Error al comparar datos del backend");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error en compareWeather:", error);
    throw error;
  }
}
