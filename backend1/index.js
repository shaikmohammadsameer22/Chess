import express from "express";
import http from "http";
import WebSocket from "ws";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import { addHandler } from "./GameManager.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/" });

mongoose
  .connect(process.env.MONGO_URI, { dbName: "chess" })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// WebSocket connection handler
wss.on("connection", (socket) => {
  console.log("🔌 Client connected");
  addHandler(socket);

  socket.on("close", () => {
    console.log("❌ Client disconnected");
  });
});

// ✅ Heartbeat to keep Render from killing idle connections
setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.ping(); // Prevents Render from closing the connection
    }
  });
}, 30000); // Every 30 seconds

app.use(cors({
  origin: "https://chess-d1vy.vercel.app",
  credentials: true
}));

app.get("/", (req, res) => {
  res.send("Chess backend running.");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
