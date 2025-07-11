import { WebSocket } from "ws";
import {
  INIT_GAME,
  MOVE,
  REQUEST_REMATCH
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
    if (this.pendingUser === socket) {
      this.pendingUser = null;
    }
    this.games = this.games.filter(
      (game) => game.player1 !== socket && game.player2 !== socket
    );
  }

  addHandler(socket) {
    socket.on("message", (data) => {
      const message = JSON.parse(data.toString());

      const game = this.games.find(
        (g) => g.player1 === socket || g.player2 === socket
      );

      switch (message.type) {
        case INIT_GAME:
          if (game) {
            game.handleMessage(socket, message);
            return;
          }

          if (this.pendingUser && this.pendingUser !== socket) {
            const newGame = new Game(this.pendingUser, socket);
            this.games.push(newGame);
            this.pendingUser = null;
          } else {
            this.pendingUser = socket;
          }
          break;

        case MOVE:
        case REQUEST_REMATCH:
          if (game) {
            game.handleMessage(socket, message);
          }
          break;

        default:
          console.warn("Unhandled message type:", message.type);
      }
    });

    socket.on("close", () => {
      this.removeUser(socket);
    });
  }
}
