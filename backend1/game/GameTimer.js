import { GAME_OVER } from "../messages.js";

export function startTimer(game, player) {
  clearTimer(game);
  game.lastMoveTimestamp = Date.now();

  game.timerInterval = setInterval(() => {
    const now = Date.now();
    const elapsed = now - game.lastMoveTimestamp;
    game.timeLeft[player.username] -= elapsed;
    game.lastMoveTimestamp = now;

    broadcastTime(game);

    if (game.timeLeft[player.username] <= 0) {
      clearTimer(game);
      const winnerSocket = player === game.player1 ? game.player2 : game.player1;
      const loserSocket = player;

      const gameOverMessage = JSON.stringify({
        type: GAME_OVER,
        payload: {
          winner: `${winnerSocket === game.player1 ? "white" : "black"} (time)`,
          updatedRatings: {
            [winnerSocket.username]: winnerSocket.rating,
            [loserSocket.username]: loserSocket.rating,
          },
        },
      });

      game.player1.send(gameOverMessage);
      game.player2.send(gameOverMessage);
    }
  }, 1000);
}

export function clearTimer(game) {
  if (game.timerInterval) {
    clearInterval(game.timerInterval);
    game.timerInterval = null;
  }
}

export function broadcastTime(game) {
  const payload = {
    type: "TIME_UPDATE",
    payload: {
      [game.player1.username]: game.timeLeft[game.player1.username],
      [game.player2.username]: game.timeLeft[game.player2.username],
    },
  };
  game.player1.send(JSON.stringify(payload));
  game.player2.send(JSON.stringify(payload));
}
