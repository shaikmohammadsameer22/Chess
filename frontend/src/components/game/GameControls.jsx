// src/components/Game/GameControls.jsx
import React from "react";

export const GameControls = ({
  waitingDrawResponse,
  sendDrawRequest,
  sendResign,
}) => (
  <div className="mt-4 w-full text-center">
    <select
      className="w-full border border-gray-600 bg-[#3b3b3b] text-white rounded px-3 py-2"
      value=""
      onChange={(e) => {
        if (e.target.value === "draw" && !waitingDrawResponse) sendDrawRequest();
        else if (e.target.value === "resign") sendResign();
      }}
    >
      <option value="" disabled>More Options</option>
      <option value="draw" disabled={waitingDrawResponse}>
        Offer Draw {waitingDrawResponse ? "(Waiting...)" : ""}
      </option>
      <option value="resign">Resign</option>
    </select>
  </div>
);
