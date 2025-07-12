import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { Button } from "../components/Button";
import { ChessBoard } from "../components/ChessBoard";
import { Chess } from "chess.js";
import { useAuth } from "../auth/AuthContext";

export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const REQUEST_REMATCH = "request_rematch";
export const REMATCH_REQUESTED = "rematch_requested";

export const Game = () => {
  const socket = useSocket();
  const { user } = useAuth();

  const [chess, setChess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [started, setStarted] = useState(false);
  const [playerColor, setPlayerColor] = useState("w");
  const [resultMessage, setResultMessage] = useState(null);
  const [waitingRematch, setWaitingRematch] = useState(false);
  const [showAcceptRematch, setShowAcceptRematch] = useState(false);
  const [playerInfo, setPlayerInfo] = useState({ username: "", rating: 1000 });
  const [opponentInfo, setOpponentInfo] = useState({ username: "", rating: 1000 });
  
  const sendPlayRequest = () => {
  if (!user) return;

  socket?.send(
    JSON.stringify({
      type: INIT_GAME,
      payload: {
        username: user.username,
        rating: user.rating || 1000,
      },
    })
  );
};

  const requestRematch = () => {
    setWaitingRematch(true);
    socket?.send(JSON.stringify({ type: REQUEST_REMATCH }));
  };

  const acceptRematch = () => {
    setShowAcceptRematch(false);
    setResultMessage(null);
    setWaitingRematch(true);
    socket?.send(JSON.stringify({ type: REQUEST_REMATCH }));
  };

  useEffect(() => {
    if (!socket) return;

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case INIT_GAME:
  const { color, self, opponent } = message.payload;
  const shortColor = color === "white" ? "w" : "b";

  const newChess = new Chess();
  setChess(newChess);
  setBoard(newChess.board());
  setPlayerColor(shortColor);
  setStarted(true);
  setResultMessage(null);
  setWaitingRematch(false);
  setShowAcceptRematch(false);

  // NEW: Set player and opponent info
  setPlayerInfo(self);
  setOpponentInfo(opponent);
  console.log("✅ Player info:", self);
console.log("✅ Opponent info:", opponent);

  break;


          case MOVE:
            const move = message.payload;
            chess.move(move);
            setBoard(chess.board());
            break;

          case GAME_OVER:
             const { winner, updatedRatings } = message.payload;

if (winner === "draw") {
  setResultMessage("Game Drawn 🤝");
} else {
  setResultMessage(`${winner.charAt(0).toUpperCase() + winner.slice(1)} Won 🎉`);
}

// 🔁 Update frontend ratings if available
if (updatedRatings) {
  const updateRating = (userObj) => {
    const newRating = updatedRatings[userObj.username?.toLowerCase()];
    return newRating !== undefined ? { ...userObj, rating: newRating } : userObj;
  };

  setPlayerInfo((prev) => updateRating(prev));
  setOpponentInfo((prev) => updateRating(prev));
  console.log("🧠 Updated Ratings:", updatedRatings);
console.log("🎯 Current player:", playerInfo.username);
console.log("🎯 Current opponent:", opponentInfo.username);

}


            break;

          case REMATCH_REQUESTED:
            setShowAcceptRematch(true);
            break;

          default:
            console.warn("Unknown message type:", message.type);
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", event.data);
      }
    };
  }, [socket, chess]);

  if (!socket) return <div>Connecting...</div>;

  return (
    <div className="min-h-screen flex justify-center items-start pt-10">
      {/* Chess Board */}
      <div className="relative">
         <ChessBoard
  chess={chess}
  setBoard={setBoard}
  socket={socket}
  board={board}
  playerColor={playerColor}
  resultMessage={resultMessage}
  playerInfo={playerInfo}
  opponentInfo={opponentInfo}
/>

      </div>

      {/* Right Panel */}
      <div className="ml-10 w-64 p-6 flex flex-col items-center bg-white shadow-lg rounded-lg">
        {/* Initial game start */}
        {!started && !waitingRematch && !showAcceptRematch && (
          <Button onClick={sendPlayRequest}>Play</Button>
        )}

        {/* Game over state with rematch option */}
        {resultMessage && !waitingRematch && !showAcceptRematch && (
  <>
    <div className="text-gray-800 text-center mt-4 text-lg font-medium">
      Game Over
    </div>

    {/* Rematch with same opponent */}
    <Button className="mt-4" onClick={requestRematch}>
      Play Again
    </Button>

    {/* Match with a new opponent */}
    <Button
      className="mt-2"
      variant="secondary"
      onClick={() => {
        setResultMessage(null);
        setStarted(false);
        sendPlayRequest(); // Call same function as the initial "Play" button
      }}
    >
      Next Match
    </Button>
  </>
)}


        {/* Waiting for opponent's response */}
        {waitingRematch && (
          <div className="text-gray-600 text-center mt-2">
            Waiting for opponent to accept...
          </div>
        )}

        {/* Accept/Decline rematch UI */}
        {showAcceptRematch && (
          <>
            <div className="text-gray-800 text-center mt-2 mb-2">
              Opponent wants a rematch!
            </div>
            <Button className="mb-2" onClick={acceptRematch}>
              Accept
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowAcceptRematch(false)}
            >
              Decline
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
