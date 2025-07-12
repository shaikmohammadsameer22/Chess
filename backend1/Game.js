import { Chess } from "chess.js";
import User from "./models/user.model.js";

import {
  GAME_OVER,
  INIT_GAME,
  MOVE,
  REQUEST_REMATCH,
  REMATCH_REQUESTED
} from "./messages.js";

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

  async sendInitGame() {
  try {
    const [p1, p2] = await Promise.all([
      User.findOne({ username: this.player1.username }),
      User.findOne({ username: this.player2.username }),
    ]);

    const player1Info = {
      username: p1.username,
      rating: p1.rating,
    };

    const player2Info = {
      username: p2.username,
      rating: p2.rating,
    };

    this.player1.send(
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          color: "white",
          self: player1Info,
          opponent: player2Info,
        },
      })
    );

    this.player2.send(
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          color: "black",
          self: player2Info,
          opponent: player1Info,
        },
      })
    );
  } catch (err) {
    console.error("❌ Failed to fetch updated ratings:", err);
  }
}


  async resetGame() {
    this.board = new Chess();
    this.moveCount = 0;
    this.startTime = new Date();
    this.rematchRequests.clear();
    await this.sendInitGame();
  }

   async makeMove(socket, move) {
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
    let winnerSocket, loserSocket;

    if (this.board.isDraw() || this.board.isStalemate()) {
      winner = "draw";
    } else {
      const turn = this.board.turn();
      if (turn === "w") {
        winner = "black";
        winnerSocket = this.player2;
        loserSocket = this.player1;
      } else {
        winner = "white";
        winnerSocket = this.player1;
        loserSocket = this.player2;
      }
    }

    if (winner !== "draw") {
      // Update DB ratings
      Promise.all([
        User.findOneAndUpdate(
          { username: winnerSocket.username },
          { $inc: { rating: 8 } },
          { new: true }
        ),
        User.findOneAndUpdate(
          { username: loserSocket.username },
          { $inc: { rating: -8 } },
          { new: true }
        ),
      ])
        .then(([updatedWinner, updatedLoser]) => {
          console.log("✅ Ratings updated:", {
            winner: updatedWinner.username,
            newRating: updatedWinner.rating,
            loser: updatedLoser.username,
            newRating: updatedLoser.rating,
          });

          // Update rating in socket for next rematch
          winnerSocket.rating = updatedWinner.rating;
          loserSocket.rating = updatedLoser.rating;
        })
        .catch((err) => {
          console.error("❌ Failed to update ratings:", err);
        });
    }

    const gameOverMessage = JSON.stringify({
  type: GAME_OVER,
  payload: {
    winner,
    updatedRatings: {
      [winnerSocket.username]: winnerSocket.rating,
      [loserSocket.username]: loserSocket.rating,
    },
  },
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
      this.makeMove(socket, message.payload.move); // now async
      return;
    }

    if (message.type === REQUEST_REMATCH) {
      this.rematchRequests.add(socket);
      const otherPlayer = socket === this.player1 ? this.player2 : this.player1;

      if (!this.rematchRequests.has(otherPlayer)) {
        otherPlayer.send(
          JSON.stringify({
            type: REMATCH_REQUESTED,
          })
        );
      }

      if (
        this.rematchRequests.has(this.player1) &&
        this.rematchRequests.has(this.player2)
      ) {
        this.resetGame();
      }
    }
  }
}
