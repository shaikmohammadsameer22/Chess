import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { Button } from "../components/Button";
import { ChessBoard } from "../components/ChessBoard";
import { Chess } from "chess.js";

export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const REQUEST_REMATCH = "request_rematch";
export const REMATCH_REQUESTED = "rematch_requested";

export const Game = () => {
  const socket = useSocket();
  const [chess, setChess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [started, setStarted] = useState(false);
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [waitingRematch, setWaitingRematch] = useState(false);
  const [showAcceptRematch, setShowAcceptRematch] = useState(false);

  // Send a message to request a new game (or rematch)
  const sendPlayRequest = () => {
    socket?.send(JSON.stringify({ type: INIT_GAME }));
  };

  // Request rematch: only sends a signal
  const requestRematch = () => {
    setWaitingRematch(true);
    socket?.send(JSON.stringify({ type: REQUEST_REMATCH }));
  };

  // Accept opponent's rematch request
  const acceptRematch = () => {
  setShowAcceptRematch(false);
  setResultMessage(null);
  setWaitingRematch(true); // Optional: show “Waiting…” in case opponent is slow
  socket?.send(JSON.stringify({ type: REQUEST_REMATCH })); // ✅ FIXED LINE
};


  useEffect(() => {
    if (!socket) return;

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case INIT_GAME:
            const colorFromServer = message.payload.color;
            const shortColor = colorFromServer === "white" ? "w" : "b";

            const newChess = new Chess();
            setChess(newChess);
            setBoard(newChess.board());
            setPlayerColor(shortColor);
            setStarted(true);
            setResultMessage(null);
            setWaitingRematch(false);
            setShowAcceptRematch(false);
            break;

          case MOVE:
            const move = message.payload;
            chess.move(move);
            setBoard(chess.board());
            break;

          case GAME_OVER:
            const winner = message.payload.winner;
            if (winner === "draw") {
              setResultMessage("Game Drawn 🤝");
            } else {
              setResultMessage(`${winner.charAt(0).toUpperCase() + winner.slice(1)} Won 🎉`);
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
            <Button className="mt-4" onClick={requestRematch}>
              Play Again
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
