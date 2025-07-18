import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import { GameManager } from './GameManager.js';

dotenv.config();

// 🔗 Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// 🚀 Setup Express
const app = express();

// 🌐 CORS for frontend
const allowedOrigins = [
  "https://chess-d1vy.vercel.app",  // production
  "http://localhost:5173"           // development
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true, // 🔑 allows cookies
}));

app.use(express.json());
app.use(cookieParser());

// 📦 API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// 🔌 HTTP + WebSocket Server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const gameManager = new GameManager();

// ♟️ Handle WebSocket Connections
wss.on('connection', (ws) => {
  gameManager.addUser(ws);

  ws.on('close', () => {
    gameManager.removeUser(ws);
  });

  ws.send(JSON.stringify({
    type: 'welcome',
    payload: { message: 'Welcome to the Chess Game!' }
  }));
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
