import { Chess } from "chess.js";
import { WebSocket } from "ws";
import { GAME_OVER, INIT_GAME, MOVE, REQUEST_REMATCH, REMATCH_REQUESTED } from "./messages.js";

export class Game {
  constructor(player1, player2) {
    this.player1 = player1;
    this.player2 = player2;
    this.board = new Chess();
    this.startTime = new Date();
    this.moveCount = 0;
    this.rematchRequests = new Set();

    this.sendInitGame();
  }

  sendInitGame() {
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

  resetGame() {
    this.board = new Chess();
    this.moveCount = 0;
    this.startTime = new Date();
    this.rematchRequests.clear();
    this.sendInitGame();
  }

  makeMove(socket, move) {
    if (this.moveCount % 2 === 0 && socket !== this.player1) return;
    if (this.moveCount % 2 === 1 && socket !== this.player2) return;

    try {
      this.board.move(move);
    } catch (e) {
      console.log("Invalid move:", e);
      return;
    }

    if (this.board.isGameOver()) {
      let winner;

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

  handleMessage(socket, message) {
    console.log("Received message from player:", message);

    if (message.type === MOVE) {
      this.makeMove(socket, message.payload.move);
      return;
    }

    if (message.type === REQUEST_REMATCH) {
      this.rematchRequests.add(socket);
      console.log("Rematch requested by:", socket === this.player1 ? "Player 1" : "Player 2");

      const otherPlayer = socket === this.player1 ? this.player2 : this.player1;

      if (!this.rematchRequests.has(otherPlayer)) {
        otherPlayer.send(
          JSON.stringify({
            type: REMATCH_REQUESTED,
          })
        );
        console.log("REMATCH_REQUESTED sent to other player");
      }

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
