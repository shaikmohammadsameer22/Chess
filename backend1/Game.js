import { Chess } from "chess.js";
import User from "./models/user.model.js";
import {
  GAME_OVER,
  INIT_GAME,
  MOVE,
  REQUEST_REMATCH,
  REMATCH_REQUESTED,
  OFFER_DRAW,
  DRAW_REQUESTED,
  DRAW_ACCEPTED,
  RESIGN,
} from "./messages.js";

const INITIAL_TIME = 600 * 1000; // 10 minutes

export class Game {
  constructor(player1, player2) {
    this.player1 = player1;
    this.player2 = player2;
    this.board = new Chess();
    this.startTime = new Date();
    this.moveCount = 0;
    this.rematchRequests = new Set();

    this.timeLeft = {
      [player1.username]: INITIAL_TIME,
      [player2.username]: INITIAL_TIME,
    };

    this.lastMoveTimestamp = Date.now();
    this.activePlayer = this.player1;
    this.timerInterval = null;
    this.drawOfferedBy = null;

    this.sendInitGame();
    this.startTimer(this.activePlayer);
  }

  async sendInitGame() {
    try {
      const [p1, p2] = await Promise.all([
        User.findOne({ username: this.player1.username }),
        User.findOne({ username: this.player2.username }),
      ]);

      const player1Info = { username: p1.username, rating: p1.rating };
      const player2Info = { username: p2.username, rating: p2.rating };

      this.player1.send(JSON.stringify({
        type: INIT_GAME,
        payload: { color: "white", self: player1Info, opponent: player2Info },
      }));

      this.player2.send(JSON.stringify({
        type: INIT_GAME,
        payload: { color: "black", self: player2Info, opponent: player1Info },
      }));
    } catch (err) {
      console.error("❌ Failed to fetch updated ratings:", err);
    }
  }

  startTimer(player) {
    this.clearTimer();
    this.lastMoveTimestamp = Date.now();

    this.timerInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - this.lastMoveTimestamp;
      this.timeLeft[player.username] -= elapsed;
      this.lastMoveTimestamp = now;

      this.broadcastTime();

      if (this.timeLeft[player.username] <= 0) {
        this.clearTimer();
        const winner = player === this.player1 ? "black" : "white";
        const winnerSocket = player === this.player1 ? this.player2 : this.player1;
        const loserSocket = player;

        const gameOverMessage = JSON.stringify({
          type: GAME_OVER,
          payload: {
            winner: `${winner} (time)`,
            updatedRatings: {
              [winnerSocket.username]: winnerSocket.rating,
              [loserSocket.username]: loserSocket.rating,
            },
          },
        });

        this.player1.send(gameOverMessage);
        this.player2.send(gameOverMessage);
      }
    }, 1000);
  }

  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  broadcastTime() {
    const payload = {
      type: "TIME_UPDATE",
      payload: {
        [this.player1.username]: this.timeLeft[this.player1.username],
        [this.player2.username]: this.timeLeft[this.player2.username],
      },
    };
    this.player1.send(JSON.stringify(payload));
    this.player2.send(JSON.stringify(payload));
  }

  async resetGame() {
    this.board = new Chess();
    this.moveCount = 0;
    this.startTime = new Date();
    this.rematchRequests.clear();
    this.drawOfferedBy = null;

    this.timeLeft = {
      [this.player1.username]: INITIAL_TIME,
      [this.player2.username]: INITIAL_TIME,
    };

    this.activePlayer = this.player1;
    this.lastMoveTimestamp = Date.now();

    await this.sendInitGame();
    this.startTimer(this.activePlayer);
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
      return await this.endGameByBoardState();
    }

    const otherPlayer = this.moveCount % 2 === 0 ? this.player2 : this.player1;
    otherPlayer.send(JSON.stringify({ type: MOVE, payload: move }));

    this.clearTimer();
    this.activePlayer = otherPlayer;
    this.startTimer(this.activePlayer);

    this.moveCount++;
  }

  async endGameByBoardState() {
    this.clearTimer();

    let winner, winnerSocket, loserSocket;

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
      try {
        const [updatedWinner, updatedLoser] = await Promise.all([
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
        ]);

        winnerSocket.rating = updatedWinner.rating;
        loserSocket.rating = updatedLoser.rating;
      } catch (err) {
        console.error("❌ Failed to update ratings:", err);
      }
    }

    this.player1.send(JSON.stringify({
      type: GAME_OVER,
      payload: {
        winner,
        updatedRatings: {
          [winnerSocket?.username]: winnerSocket?.rating,
          [loserSocket?.username]: loserSocket?.rating,
        },
      },
    }));

    this.player2.send(JSON.stringify({
      type: GAME_OVER,
      payload: {
        winner,
        updatedRatings: {
          [winnerSocket?.username]: winnerSocket?.rating,
          [loserSocket?.username]: loserSocket?.rating,
        },
      },
    }));
  }

  async resign(socket) {
    const winnerSocket = socket === this.player1 ? this.player2 : this.player1;
    const loserSocket = socket;

    try {
      const [updatedWinner, updatedLoser] = await Promise.all([
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
      ]);

      winnerSocket.rating = updatedWinner.rating;
      loserSocket.rating = updatedLoser.rating;
    } catch (err) {
      console.error("❌ Failed to update ratings:", err);
    }

    const gameOverMessage = JSON.stringify({
      type: GAME_OVER,
      payload: {
        winner: winnerSocket === this.player1 ? "white" : "black",
        updatedRatings: {
          [winnerSocket.username]: winnerSocket.rating,
          [loserSocket.username]: loserSocket.rating,
        },
      },
    });

    this.player1.send(gameOverMessage);
    this.player2.send(gameOverMessage);
    this.clearTimer();
  }

  offerDraw(socket) {
    const opponent = socket === this.player1 ? this.player2 : this.player1;
    this.drawOfferedBy = socket;
    opponent.send(JSON.stringify({ type: DRAW_REQUESTED }));
  }

  async acceptDraw(socket) {
  this.clearTimer();

  try {
    const [updatedP1, updatedP2] = await Promise.all([
      User.findOne({ username: this.player1.username }),
      User.findOne({ username: this.player2.username }),
    ]);

    this.player1.rating = updatedP1.rating;
    this.player2.rating = updatedP2.rating;

    const gameOverMessage = JSON.stringify({
      type: GAME_OVER,
      payload: {
        winner: "draw",
        updatedRatings: {
          [this.player1.username]: updatedP1.rating,
          [this.player2.username]: updatedP2.rating,
        },
      },
    });

    this.player1.send(gameOverMessage);
    this.player2.send(gameOverMessage);
  } catch (err) {
    console.error("❌ Failed to fetch player ratings for draw result:", err);
  }
}


  handleMessage(socket, message) {
    console.log("📩 Message:", message.type);

    if (message.type === MOVE) {
      this.makeMove(socket, message.payload.move);
    }

    if (message.type === REQUEST_REMATCH) {
      this.rematchRequests.add(socket);
      const otherPlayer = socket === this.player1 ? this.player2 : this.player1;

      if (!this.rematchRequests.has(otherPlayer)) {
        otherPlayer.send(JSON.stringify({ type: REMATCH_REQUESTED }));
      }

      if (
        this.rematchRequests.has(this.player1) &&
        this.rematchRequests.has(this.player2)
      ) {
        this.resetGame();
      }
    }

    if (message.type === OFFER_DRAW) {
      this.offerDraw(socket);
    }

    if (message.type === DRAW_ACCEPTED) {
      this.acceptDraw(socket);
    }

    if (message.type === RESIGN) {
      this.resign(socket);
    }
  }
}
