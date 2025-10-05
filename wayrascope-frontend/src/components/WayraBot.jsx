import React, { useEffect } from "react";
import { motion } from "framer-motion";

export default function WayraBot({ weather, message }) {
  const colors = {
    clear: "#64FFDA",
    cloudy: "#7FE0B7",
    rain: "#00B4AB",
    storm: "#FFD700",
    snow: "#B3E5FC",
    windy: "#98E2E8",
  };

  // Determina color del orbe según confort
  const botColor =
    weather > 80 ? colors.clear :
    weather > 60 ? colors.cloudy :
    weather > 40 ? colors.windy :
    weather > 20 ? colors.rain : colors.storm;

  useEffect(() => {
    if (!message) return;
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "es-ES";
    utterance.rate = 1;
    utterance.pitch = 1.1;
    synth.cancel();
    synth.speak(utterance);
  }, [message]);

  return (
    <motion.div
      className="fixed bottom-16 left-8 flex flex-col items-center z-50"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      <motion.div
        className="w-20 h-20 rounded-full shadow-lg"
        style={{ backgroundColor: botColor, boxShadow: `0 0 30px ${botColor}` }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      ></motion.div>

      <div className="mt-3 bg-[#0F2747] border border-cyan-300 rounded-xl p-3 text-sm text-cyan-200 shadow-md w-56 text-center">
        {message || "Hola 👋 Soy WayraBot, listo para analizar el clima ☁️"}
      </div>
    </motion.div>
  );
}
