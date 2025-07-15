import { DRAW_REQUESTED, GAME_OVER } from "../messages.js";
import { updateRatings, fetchUserRatings } from "./helpers/rating.helper.js";
import { clearTimer } from "./GameTimer.js";

export function offerDraw(game, socket) {
  const opponent = socket === game.player1 ? game.player2 : game.player1;
  game.drawOfferedBy = socket;
  opponent.send(JSON.stringify({ type: DRAW_REQUESTED }));
}

export async function acceptDraw(game, socket) {
  clearTimer(game);
  const ratings = await fetchUserRatings(game.player1.username, game.player2.username);

  const gameOverMessage = {
    type: GAME_OVER,
    payload: {
      winner: "draw",
      updatedRatings: {
        [game.player1.username]: ratings[0],
        [game.player2.username]: ratings[1],
      },
    },
  };

  game.player1.send(JSON.stringify(gameOverMessage));
  game.player2.send(JSON.stringify(gameOverMessage));
}

export async function resign(game, socket) {
  const winnerSocket = socket === game.player1 ? game.player2 : game.player1;
  const loserSocket = socket;

  await updateRatings(winnerSocket, loserSocket);

  const gameOverMessage = JSON.stringify({
    type: GAME_OVER,
    payload: {
      winner: winnerSocket === game.player1 ? "white" : "black",
      updatedRatings: {
        [winnerSocket.username]: winnerSocket.rating,
        [loserSocket.username]: loserSocket.rating,
      },
    },
  });

  game.player1.send(gameOverMessage);
  game.player2.send(gameOverMessage);
  clearTimer(game);
}
