import {
  INIT_GAME,
  JOIN_ROOM,
  MOVE,
  REQUEST_REMATCH,
  OFFER_DRAW,
  DRAW_ACCEPTED,
  RESIGN,
} from "./messages.js";

import { Game } from "./Game.js";

export class GameManager {
  constructor() {
    this.games = [];
    this.pendingUsers = {}; // Matchmaking queues per time control
    this.users = [];
    this.rooms = {};
  }

  addUser(socket) {
    this.users.push(socket);
    this.addHandler(socket);
  }

  removeUser(socket) {
    this.users = this.users.filter((user) => user !== socket);
    this.leaveGame(socket);
  }

  leaveGame(socket) {
    this.games = this.games.filter(
      (g) => g.player1 !== socket && g.player2 !== socket
    );

    for (const key in this.pendingUsers) {
      this.pendingUsers[key] = this.pendingUsers[key].filter((s) => s !== socket);
    }

    for (const roomId in this.rooms) {
      this.rooms[roomId] = this.rooms[roomId].filter((s) => s !== socket);
      if (this.rooms[roomId].length === 0) {
        delete this.rooms[roomId];
      }
    }

    this.games = this.games.filter(
      (g) => g.player1.readyState === 1 || g.player2.readyState === 1
    );
  }

  addHandler(socket) {
    socket.on("message", (data) => {
      let message;
      try {
        message = JSON.parse(data.toString());
      } catch (err) {
        console.error("Invalid JSON received from client:", data.toString());
        return;
      }

      const game = this.games.find(
        (g) => g.player1 === socket || g.player2 === socket
      );

      switch (message.type) {
        case INIT_GAME: {
          const { username, rating, time } = message.payload || {};
          if (username) {
            socket.username = username;
            socket.rating = rating || 1000;
          }

          this.leaveGame(socket);

          const timeKey = `${time?.minutes || 10}+${time?.increment || 0}`;
          if (!this.pendingUsers[timeKey]) this.pendingUsers[timeKey] = [];

          const queue = this.pendingUsers[timeKey];

          if (queue.length > 0 && queue[0] !== socket) {
            const opponent = queue.shift();
            const newGame = new Game(opponent, socket, time); // pass time config
            this.games.push(newGame);
            console.log(`✅ Game started between ${opponent.username} and ${socket.username} (${timeKey})`);
          } else {
            queue.push(socket);
          }

          break;
        }

        case JOIN_ROOM: {
          const { roomId, username, rating } = message.payload || {};
          if (!roomId) return;

          socket.username = username || "Guest";
          socket.rating = rating || 1000;

          this.leaveGame(socket);

          if (!this.rooms[roomId]) {
            this.rooms[roomId] = [socket];
          } else if (
            this.rooms[roomId].length === 1 &&
            this.rooms[roomId][0] !== socket
          ) {
            this.rooms[roomId].push(socket);
            const [player1, player2] = this.rooms[roomId];
            const newGame = new Game(player1, player2); // default time control
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

        default:
          console.warn("⚠️ Unhandled message type:", message.type);
      }
    });

    socket.on("close", () => {
      this.removeUser(socket);
    });
  }
}
