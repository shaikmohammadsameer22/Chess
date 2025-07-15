import { MOVE } from "../messages.js";
import { startTimer, clearTimer } from "./GameTimer.js";
import { updateRatings, fetchUserRatings } from "./helpers/rating.helper.js";


export async function makeMove(game, socket, move) {
  if ((game.moveCount % 2 === 0 && socket !== game.player1) ||
      (game.moveCount % 2 === 1 && socket !== game.player2)) return;

  try {
    game.board.move(move);
  } catch (e) {
    console.log("Invalid move:", e);
    return;
  }

  if (game.board.isGameOver()) return await endGameByBoardState(game);

  const otherPlayer = socket === game.player1 ? game.player2 : game.player1;

  game.timeLeft[socket.username] += game.increment;

  otherPlayer.send(JSON.stringify({ type: MOVE, payload: move }));

  clearTimer(game);
  game.activePlayer = otherPlayer;
  startTimer(game, game.activePlayer);

  game.moveCount++;
}

export async function endGameByBoardState(game) {
  clearTimer(game);
  const result = game.board.isDraw() || game.board.isStalemate()
    ? { winner: "draw" }
    : game.board.turn() === "w"
    ? { winner: "black", winnerSocket: game.player2, loserSocket: game.player1 }
    : { winner: "white", winnerSocket: game.player1, loserSocket: game.player2 };

  if (result.winner !== "draw") {
    await updateRatings(result.winnerSocket, result.loserSocket);
  }

  const payload = {
    type: "GAME_OVER",
    payload: {
      winner: result.winner,
      updatedRatings: {
        [result.winnerSocket?.username]: result.winnerSocket?.rating,
        [result.loserSocket?.username]: result.loserSocket?.rating,
      },
    },
  };

  game.player1.send(JSON.stringify(payload));
  game.player2.send(JSON.stringify(payload));
}
