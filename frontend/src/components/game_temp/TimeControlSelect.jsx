// src/components/Game/TimeControlSelect.jsx
import React from "react";

export const TimeControlSelect = ({ selectedTime, setSelectedTime }) => (
  <select
    className="w-full border border-gray-600 bg-[#3b3b3b] text-white rounded px-3 py-2 mb-4"
    value={`${selectedTime.minutes}+${selectedTime.increment}`}
    onChange={(e) => {
      const [min, inc] = e.target.value.split("+").map(Number);
      setSelectedTime({ minutes: min, increment: inc });
    }}
  >
    <option value="1+0">Bullet (1+0)</option>
    <option value="3+0">Blitz (3+0)</option>
    <option value="5+0">Blitz (5+0)</option>
    <option value="10+0">Rapid (10+0)</option>
    <option value="15+10">Rapid (15+10)</option>
    <option value="30+0">Classical (30+0)</option>
  </select>
);
