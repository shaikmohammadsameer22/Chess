import { Chess } from "chess.js";
import { WebSocket } from "ws";
import { GAME_OVER, INIT_GAME, MOVE, REQUEST_REMATCH, REMATCH_REQUESTED } from "./messages";

export class Game {
  public player1: WebSocket;
  public player2: WebSocket;
  public board: Chess;
  private startTime: Date;
  private moveCount = 0;

  private rematchRequests = new Set<WebSocket>(); // 🆕 track rematch intent

  constructor(player1: WebSocket, player2: WebSocket) {
    this.player1 = player1;
    this.player2 = player2;
    this.board = new Chess();
    this.startTime = new Date();

    this.sendInitGame(); // Initial game setup
  }

  private sendInitGame() {
    this.player1.send(
      JSON.stringify({
        type: INIT_GAME,
        payload: { color: "white" },
      })
    );
    this.player2.send(
      JSON.stringify({
        type: INIT_GAME,
        payload: { color: "black" },
      })
    );
  }

  public resetGame() {
    this.board = new Chess();
    this.moveCount = 0;
    this.startTime = new Date();
    this.rematchRequests.clear(); // 🆕 clear previous intents
    this.sendInitGame();
  }

  public makeMove(
    socket: WebSocket,
    move: {
      from: string;
      to: string;
    }
  ) {
    if (this.moveCount % 2 === 0 && socket !== this.player1) return;
    if (this.moveCount % 2 === 1 && socket !== this.player2) return;

    try {
      this.board.move(move);
    } catch (e) {
      console.log("Invalid move:", e);
      return;
    }

    if (this.board.isGameOver()) {
      let winner: "white" | "black" | "draw";

      if (this.board.isDraw() || this.board.isStalemate()) {
        winner = "draw";
      } else {
        winner = this.board.turn() === "w" ? "black" : "white";
      }

      const gameOverMessage = JSON.stringify({
        type: GAME_OVER,
        payload: { winner },
      });

      this.player1.send(gameOverMessage);
      this.player2.send(gameOverMessage);
      return;
    }

    const otherPlayer = this.moveCount % 2 === 0 ? this.player2 : this.player1;
    otherPlayer.send(
      JSON.stringify({
        type: MOVE,
        payload: move,
      })
    );

    this.moveCount++;
  }

 public handleMessage(socket: WebSocket, message: any) {
  console.log("Received message from player:", message);

  if (message.type === MOVE) {
    this.makeMove(socket, message.payload.move);
    return;
  }

  if (message.type === REQUEST_REMATCH) {
    this.rematchRequests.add(socket);
    console.log("Rematch requested by:", socket === this.player1 ? "Player 1" : "Player 2");

    const otherPlayer = socket === this.player1 ? this.player2 : this.player1;

    // ✅ Notify the other player only if they haven't requested already
    if (!this.rematchRequests.has(otherPlayer)) {
      otherPlayer.send(
        JSON.stringify({
          type: REMATCH_REQUESTED,
        })
      );
      console.log("REMATCH_REQUESTED sent to other player");
    }

    // ✅ If both accepted, reset the game
    if (
      this.rematchRequests.has(this.player1) &&
      this.rematchRequests.has(this.player2)
    ) {
      console.log("Both players accepted rematch. Resetting game...");
      this.resetGame();
    }
  }
}

}
