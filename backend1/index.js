import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes.js';
import userRoutes from "./routes/user.routes.js";
import { GameManager } from './GameManager.js';
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
dotenv.config();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Express Setup
const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Auth Routes
app.use('/api/auth', authRoutes);
app.use("/api/users", userRoutes);
// HTTP Server
const server = http.createServer(app);

// WebSocket Server (using same HTTP server)
const wss = new WebSocketServer({ server });

const gameManager = new GameManager();

wss.on('connection', (ws) => {
  gameManager.addUser(ws);

  ws.on('close', () => gameManager.removeUser(ws)); // "close" instead of "disconnect"

  ws.send(JSON.stringify({
    type: "welcome",
    payload: { message: "Welcome to the Chess Game!" }
  }));
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 HTTP + WebSocket server running at http://localhost:${PORT}`);
});
