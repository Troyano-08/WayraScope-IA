import React from "react";

export default function Background({ weather }) {
  const bgMap = {
    clear: "linear-gradient(180deg, #0A192F, #003366)",
    rain: "linear-gradient(180deg, #0F1E2D, #003344)",
    cloudy: "linear-gradient(180deg, #1C2A3B, #0B192E)",
    storm: "linear-gradient(180deg, #2B1D32, #120E1F)",
    snow: "linear-gradient(180deg, #152536, #1A3550)",
  };

  const bg = weather > 80 ? bgMap.clear :
             weather > 60 ? bgMap.cloudy :
             weather > 40 ? bgMap.rain :
             weather > 20 ? bgMap.storm : bgMap.snow;

  return (
    <div
      className="fixed top-0 left-0 w-full h-full -z-10 transition-all duration-700"
      style={{ background: bg }}
    ></div>
  );
}
