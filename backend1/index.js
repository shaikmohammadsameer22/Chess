import { WebSocketServer } from 'ws';
import { GameManager } from './GameManager.js';

const wss = new WebSocketServer({ port: 8080 });

const gameManager = new GameManager();

wss.on('connection', function connection(ws) {
  gameManager.addUser(ws);

  ws.on("disconnect", () => gameManager.removeUser(ws));

  
  ws.send(JSON.stringify({
    type: "welcome",
    payload: { message: "Welcome to the Chess Game!" }
  }));
});
console.log(" WebSocket server running on ws://localhost:8080");

