import { WebSocket } from "ws";
import {
  INIT_GAME,
  MOVE,
  REQUEST_REMATCH,
  OFFER_DRAW,
  DRAW_ACCEPTED,
  RESIGN
} from "./messages.js";

import { Game } from "./Game.js";

export class GameManager {
  constructor() {
    this.games = [];
    this.pendingUser = null;
    this.users = [];
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
    // Remove socket from games and pending queue
    this.games = this.games.filter(
      (g) => g.player1 !== socket && g.player2 !== socket
    );

    if (this.pendingUser === socket) {
      this.pendingUser = null;
    }
  }

  addHandler(socket) {
    socket.on("message", (data) => {
      const message = JSON.parse(data.toString());

      const game = this.games.find(
        (g) => g.player1 === socket || g.player2 === socket
      );

      switch (message.type) {
        case INIT_GAME: {
          // Save user info to socket
          if (message.payload?.username) {
            socket.username = message.payload.username;
            socket.rating = message.payload.rating || 1000;
          }

          // 💥 Remove socket from old game if rejoining or "Next Match"
          this.leaveGame(socket);

          // If another user is waiting, pair them
          if (this.pendingUser && this.pendingUser !== socket) {
            const newGame = new Game(this.pendingUser, socket);
            this.games.push(newGame);
            console.log(
              `✅ New game started between ${this.pendingUser.username} and ${socket.username}`
            );
            this.pendingUser = null;
          } else {
            // Otherwise, mark this player as pending
            this.pendingUser = socket;
          }

          break;
        }

        case MOVE:
case REQUEST_REMATCH:
case OFFER_DRAW:
case DRAW_ACCEPTED:
case RESIGN:
  if (game) {
    game.handleMessage(socket, message);
  }
  break;


        default:
          console.warn("⚠️ Unhandled message type:", message.type);
      }
    });

    socket.on("close", () => {
      this.removeUser(socket);
    });
  }
}
