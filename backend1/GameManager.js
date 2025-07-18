import {
  INIT_GAME,
  JOIN_ROOM,
  MOVE,
  REQUEST_REMATCH,
  OFFER_DRAW,
  DRAW_ACCEPTED,
  RESIGN,
  CHAT_MESSAGE,
} from "./messages.js";

import { Game } from "./game/Game.js";
import User from "./models/user.model.js";
export class GameManager {
  constructor() {
    this.games = []; // List of ongoing games
    this.pendingUsers = {}; // Matchmaking queues by time control
    this.users = []; // All connected users
    this.rooms = {}; // Friend rooms
  }

  async addUser(socket) {
  this.users.push(socket);
  await this.addHandler(socket); // await here
}


  removeUser(socket) {
    this.users = this.users.filter((user) => user !== socket);
    this.leaveGame(socket);
  }

  leaveGame(socket) {
    // Remove from games
    this.games = this.games.filter(
      (g) => g.player1 !== socket && g.player2 !== socket
    );

    // Remove from matchmaking queues
    for (const key in this.pendingUsers) {
      this.pendingUsers[key] = this.pendingUsers[key].filter((s) => s !== socket);
    }

    // Remove from friend rooms
    for (const roomId in this.rooms) {
      this.rooms[roomId] = this.rooms[roomId].filter((s) => s !== socket);
      if (this.rooms[roomId].length === 0) delete this.rooms[roomId];
    }

    // Remove disconnected games
    this.games = this.games.filter(
      (g) => g.player1.readyState === 1 || g.player2.readyState === 1
    );
  }

  async addHandler(socket) {
  socket.on("message", async (data) => {
    let message;
    try {
      message = JSON.parse(data.toString());
      console.log("📩 Incoming message:", msg);
    } catch (err) {
      console.error("Invalid JSON received from client:", data.toString());
      return;
    }

    const game = this.games.find(
      (g) => g.player1 === socket || g.player2 === socket
    );

    switch (message.type) {
      case INIT_GAME: {
        const { username, time } = message.payload || {};
        if (username) {
          socket.username = username;
          try {
            const userDoc = await User.findOne({ username });
            socket.rating = userDoc?.rating || 1000;
          } catch (err) {
            console.error("INIT_GAME rating fetch error:", err);
            socket.rating = 1000;
          }
        }

        this.leaveGame(socket);

        const timeKey = `${time?.minutes || 10}+${time?.increment || 0}`;
        if (!this.pendingUsers[timeKey]) this.pendingUsers[timeKey] = [];

        const queue = this.pendingUsers[timeKey];

        if (queue.length > 0 && queue[0] !== socket) {
          const opponent = queue.shift();
          const newGame = new Game(opponent, socket, time);
          this.games.push(newGame);
          console.log(`✅ Game started between ${opponent.username} and ${socket.username} (${timeKey})`);
        } else {
          queue.push(socket);
        }
        break;
      }

      case JOIN_ROOM: {
        const { roomId, username } = message.payload || {};
        if (!roomId || !username) return;

        socket.username = username;
        try {
          const userDoc = await User.findOne({ username });
          socket.rating = userDoc?.rating || 1000;
        } catch (err) {
          console.error("JOIN_ROOM rating fetch error:", err);
          socket.rating = 1000;
        }

        this.leaveGame(socket);

        if (!this.rooms[roomId]) {
          this.rooms[roomId] = [socket];
        } else if (
          this.rooms[roomId].length === 1 &&
          this.rooms[roomId][0] !== socket
        ) {
          this.rooms[roomId].push(socket);
          const [player1, player2] = this.rooms[roomId];
          const newGame = new Game(player1, player2); // default time
          this.games.push(newGame);
          console.log(`🎯 Friend game started in room ${roomId} between ${player1.username} and ${player2.username}`);
        } else {
          console.warn(`⚠️ Room ${roomId} is full or duplicate socket`);
        }
        break;
      }

      case MOVE:
      case REQUEST_REMATCH:
      case OFFER_DRAW:
      case DRAW_ACCEPTED:
      case RESIGN: {
        if (game) {
          game.handleMessage(socket, message);
        }
        break;
      }

      case CHAT_MESSAGE: {
        const { message: chatText, sender } = message.payload;
        if (!chatText || !sender) return;

        if (game) {
          const receiver = game.player1 === socket ? game.player2 : game.player1;
          if (receiver?.readyState === 1) {
            receiver.send(JSON.stringify({
              type: CHAT_MESSAGE,
              payload: { sender, message: chatText },
            }));
          }
        } else {
          for (const roomId in this.rooms) {
            const room = this.rooms[roomId];
            if (room.includes(socket)) {
              for (const peer of room) {
                if (peer !== socket && peer.readyState === 1) {
                  peer.send(JSON.stringify({
                    type: CHAT_MESSAGE,
                    payload: { sender, message: chatText },
                  }));
                }
              }
              break;
            }
          }
        }
        break;
      }

      default:
        console.warn("⚠️ Unhandled message type:", message.type);
    }
  });

  socket.on("close", () => {
    this.removeUser(socket);
  });
}
}
