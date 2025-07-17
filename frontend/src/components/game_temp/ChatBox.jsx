import React, { useEffect, useRef } from "react";

export const ChatBox = ({
  chatMessages,
  chatInput,
  setChatInput,
  sendChatMessage,
  isOpen,
  toggleChat,
  unreadCount,
  clearUnreadCount,
  started,
  user, // 👈 make sure to pass this from Game.jsx
}) => {
  const chatRef = useRef(null);

  // Auto-scroll to bottom when a new message arrives
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Clear unread count when chat opens
  useEffect(() => {
    if (isOpen) {
      clearUnreadCount();
    }
  }, [isOpen, clearUnreadCount]);

  return (
    <div className="relative">
      {/* 💬 Floating Chat Icon with unread count (shown only if game started) */}
      {started && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-700 z-50"
        >
          💬
          {unreadCount > 0 && (
            <span className="ml-1 inline-block w-5 h-5 bg-red-600 text-xs rounded-full text-white text-center">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* 💬 Chat Popup */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 bg-[#1f1f1f] border border-gray-700 rounded-lg shadow-xl p-4 z-50">
          {/* Header with Close */}
          <div className="flex justify-between items-center mb-2">
            <div className="text-white font-semibold">Chat</div>
            <button
              onClick={toggleChat}
              className="text-white text-lg hover:text-red-400"
              title="Close"
            >
              ❌
            </button>
          </div>

          {/* Chat Messages */}
          <div
            ref={chatRef}
            className="h-52 overflow-y-auto bg-[#2a2a2a] p-2 rounded text-sm mb-2 flex flex-col gap-1"
          >
            {chatMessages.map((msg, idx) => {
              const isOwnMessage = msg.sender === (user?.username || "Guest");
              const timestamp = new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    isOwnMessage ? "items-end" : "items-start"
                  } mb-2`}
                >
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                      isOwnMessage
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-gray-700 text-white rounded-bl-none"
                    }`}
                  >
                    <span className="block font-semibold">{msg.sender}</span>
                    <span>{msg.message}</span>
                  </div>
                  <span className="text-gray-400 text-xs mt-1 px-1">
                    {timestamp}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Input Box */}
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
      )}
    </div>
  );
};
