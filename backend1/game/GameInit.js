import User from "../models/user.model.js";
import { INIT_GAME } from "../messages.js";
import { startTimer } from "./GameTimer.js";

export async function sendInitGame(game) {
  const [p1, p2] = await Promise.all([
    User.findOne({ username: game.player1.username }),
    User.findOne({ username: game.player2.username }),
  ]);

  const player1Info = { username: p1.username, rating: p1.rating };
  const player2Info = { username: p2.username, rating: p2.rating };

  game.player1.send(JSON.stringify({ type: INIT_GAME, payload: { color: "white", self: player1Info, opponent: player2Info, timeControl: game.timeControl } }));
  game.player2.send(JSON.stringify({ type: INIT_GAME, payload: { color: "black", self: player2Info, opponent: player1Info, timeControl: game.timeControl } }));
}

export async function resetGame(game) {
  game.board.reset();
  game.moveCount = 0;
  game.rematchRequests.clear();
  game.drawOfferedBy = null;

  const initialTimeMs = game.timeControl.minutes * 60 * 1000;
  game.timeLeft[game.player1.username] = initialTimeMs;
  game.timeLeft[game.player2.username] = initialTimeMs;
  game.activePlayer = game.player1;
  game.lastMoveTimestamp = Date.now();

  await sendInitGame(game);
  startTimer(game, game.activePlayer);
}
