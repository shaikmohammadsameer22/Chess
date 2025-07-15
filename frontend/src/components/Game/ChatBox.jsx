// src/components/Game/ChatBox.jsx
import React from "react";

export const ChatBox = ({ chatMessages, chatInput, setChatInput, sendChatMessage }) => (
  <div className="mt-6 w-full bg-[#1f1f1f] p-3 rounded shadow-inner flex flex-col">
    <div className="text-white font-medium mb-2">Chat</div>
    <div
      id="chat-box"
      className="h-40 overflow-y-auto bg-[#2a2a2a] p-2 rounded text-sm mb-2 flex flex-col gap-1"
    >
      {chatMessages.map((msg, idx) => (
        <div key={idx}>
          <strong className="text-blue-400">{msg.sender}:</strong>{" "}
          <span className="text-white">{msg.message}</span>
        </div>
      ))}
    </div>
    <div className="flex gap-2">
      <input
        type="text"
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
        placeholder="Type message..."
        className="flex-1 px-2 py-1 rounded bg-[#3b3b3b] text-white outline-none"
      />
      <button
        onClick={sendChatMessage}
        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
      >
        Send
      </button>
    </div>
  </div>
);
