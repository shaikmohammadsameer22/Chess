import { Chess } from "chess.js";
import User from "../models/user.model.js";
import { INIT_GAME, MOVE, REQUEST_REMATCH, OFFER_DRAW, DRAW_ACCEPTED, RESIGN, REMATCH_REQUESTED, DRAW_REQUESTED, GAME_OVER } from "../messages.js";
import { startTimer, clearTimer, broadcastTime } from "./GameTimer.js";
import { makeMove, endGameByBoardState } from "./GameMoves.js";
import { sendInitGame, resetGame } from "./GameInit.js";
import { resign, offerDraw, acceptDraw } from "./GameEvents.js";

export class Game {
  constructor(player1, player2, time = { minutes: 10, increment: 0 }) {
    this.player1 = player1;
    this.player2 = player2;
    this.board = new Chess();
    this.timeControl = time;
    const initialTimeMs = time.minutes * 60 * 1000;
    this.increment = time.increment * 1000;
    this.timeLeft = {
      [player1.username]: initialTimeMs,
      [player2.username]: initialTimeMs,
    };

    this.lastMoveTimestamp = Date.now();
    this.activePlayer = this.player1;
    this.timerInterval = null;
    this.moveCount = 0;
    this.rematchRequests = new Set();
    this.drawOfferedBy = null;

    sendInitGame(this);
    startTimer(this, this.activePlayer);
  }

  handleMessage(socket, message) {
    console.log("📩 Message:", message.type);
    switch (message.type) {
      case MOVE: return makeMove(this, socket, message.payload.move);
      case REQUEST_REMATCH: {
  this.rematchRequests.add(socket.username);
  const otherPlayer = socket === this.player1 ? this.player2 : this.player1;

  // If other player hasn't sent rematch, notify them to accept
  if (!this.rematchRequests.has(otherPlayer.username)) {
    otherPlayer.send(JSON.stringify({ type: REMATCH_REQUESTED }));
  }

  // If both accepted, restart the game
  if (
    this.rematchRequests.has(this.player1.username) &&
    this.rematchRequests.has(this.player2.username)
  ) {
    this.rematchRequests.clear();
    resetGame(this);
  }

  break;
}

      case OFFER_DRAW: return offerDraw(this, socket);
      case DRAW_ACCEPTED: return acceptDraw(this, socket);
      case RESIGN: return resign(this, socket);
    }
  }
}
