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

dotenv.config();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Initialize express
const app = express();

// ✅ Allowed origins
const allowedOrigins = [
  "https://chess-d1vy.vercel.app",
  "http://localhost:5173"
];

// ✅ Add CORS middleware BEFORE routes
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ✅ Other middlewares
app.use(express.json());
app.use(cookieParser());

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use("/api/users", userRoutes);

// ✅ Create server
const server = http.createServer(app);

// ✅ WebSocket Setup
const wss = new WebSocketServer({ server });
const gameManager = new GameManager();

wss.on('connection', (ws) => {
  gameManager.addUser(ws);

  ws.on('close', () => gameManager.removeUser(ws));

  ws.send(JSON.stringify({
    type: "welcome",
    payload: { message: "Welcome to the Chess Game!" }
  }));
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 HTTP + WebSocket server running at http://localhost:${PORT}`);
});
