import { useEffect, useState } from "react";

// Automatically choose the right WebSocket URL
const WS_URL =
  import.meta.env.MODE === "production"
    ? "wss://chess-run1.onrender.com"
    : "ws://localhost:5000";

export const useSocket = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
      setSocket(ws);
    };

    ws.onclose = () => {
      console.log("❌ WebSocket disconnected");
      setSocket(null);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => {
      ws.close();
    };
  }, []);

  return socket;
};
