import { WebSocket } from "ws";
import {
  INIT_GAME,
  MOVE,
  REQUEST_REMATCH
} from "./messages";
import { Game } from "./Game";

export class GameManager {
  private games: Game[] = [];
  private pendingUser: WebSocket | null = null;
  private users: WebSocket[] = [];

  addUser(socket: WebSocket) {
    this.users.push(socket);
    this.addHandler(socket);
  }

  removeUser(socket: WebSocket) {
    this.users = this.users.filter((user) => user !== socket);
    if (this.pendingUser === socket) {
      this.pendingUser = null;
    }
    this.games = this.games.filter(
      (game) => game.player1 !== socket && game.player2 !== socket
    );
  }

  private addHandler(socket: WebSocket) {
    socket.on("message", (data) => {
      const message = JSON.parse(data.toString());

      // ✅ Find the game this socket belongs to
      const game = this.games.find(
        (g) => g.player1 === socket || g.player2 === socket
      );

      switch (message.type) {
        case INIT_GAME:
          if (game) {
            // "Play Again" scenario (rematch)
            game.handleMessage(socket, message);
            return;
          }

          // Initial pairing
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
