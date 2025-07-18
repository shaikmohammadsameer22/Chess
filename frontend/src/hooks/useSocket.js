import { useEffect, useState } from "react";

const WS_URL = import.meta.env.PROD
  ? "wss://chess-run1.onrender.com"
  : "ws://localhost:5000";

export const useSocket = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let ws;

    const connect = () => {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
        setSocket(ws);
      };

      ws.onmessage = (event) => {
        console.log("📨 Message from server:", event.data);
        // Optional: you can handle default messages here if needed
      };

      ws.onerror = (err) => {
        console.error("❌ WebSocket error:", err);
        ws.close(); // Ensure reconnect triggers
      };

      ws.onclose = () => {
        console.warn("⚠️ WebSocket disconnected. Retrying in 3s...");
        setSocket(null);
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      ws?.close();
    };
  }, []);

  return socket;
};
