import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { useParams, useNavigate } from "react-router-dom"; // ← added useNavigate
import { ChessBoard } from "../components/ChessBoard";
import { Chess } from "chess.js";

import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";

export const JOIN_ROOM = "join_room";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const REQUEST_REMATCH = "request_rematch";
export const REMATCH_REQUESTED = "rematch_requested";
export const OFFER_DRAW = "offer_draw";
export const DRAW_REQUESTED = "draw_requested";
export const DRAW_ACCEPTED = "draw_accepted";
export const RESIGN = "resign";

export const GameRoomMatch = () => {
  const socket = useSocket();
  const { user } = useAuth();
  const { roomId } = useParams();
  const navigate = useNavigate(); // ← added navigate

  const [chess, setChess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [playerColor, setPlayerColor] = useState("w");
  const [started, setStarted] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(true);
  const [resultMessage, setResultMessage] = useState(null);
  const [waitingRematch, setWaitingRematch] = useState(false);
  const [showAcceptRematch, setShowAcceptRematch] = useState(false);
  const [playerInfo, setPlayerInfo] = useState({ username: "", rating: 1000 });
  const [opponentInfo, setOpponentInfo] = useState({ username: "", rating: 1000 });
  const [timers, setTimers] = useState({});
  const [displayTimers, setDisplayTimers] = useState({});
  const [showDrawOffer, setShowDrawOffer] = useState(false);
  const [waitingDrawResponse, setWaitingDrawResponse] = useState(false);

  const formatTime = (ms) => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const sendJoinRoom = () => {
    if (!user || !roomId) return;
    socket?.send(
      JSON.stringify({
        type: JOIN_ROOM,
        payload: {
          roomId,
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

  const sendDrawRequest = () => {
    socket?.send(JSON.stringify({ type: OFFER_DRAW }));
    setWaitingDrawResponse(true);
  };

  const acceptDraw = () => {
    socket?.send(JSON.stringify({ type: DRAW_ACCEPTED }));
    setShowDrawOffer(false);
  };

  const sendResign = () => {
    socket?.send(JSON.stringify({ type: RESIGN }));
  };

  useEffect(() => {
    if (socket && user && roomId) {
      sendJoinRoom();
    }
  }, [socket, user, roomId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayTimers((prev) => {
        const updated = {};
        for (const key in timers) {
          updated[key] = formatTime(timers[key]);
        }
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timers]);

  useEffect(() => {
    if (!socket) return;

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case "init_game": {
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
            setShowDrawOffer(false);
            setWaitingDrawResponse(false);
            setPlayerInfo(self);
            setOpponentInfo(opponent);
            setWaitingForOpponent(false);
            break;
          }

          case MOVE:
            chess.move(message.payload);
            setBoard(chess.board());
            break;

           case GAME_OVER:
          case "GAME_OVER":
          case "game_over": {
            const { winner, updatedRatings } = message.payload;
            setResultMessage(
              winner === "draw"
                ? "Game Drawn 🤝"
                : `${winner.charAt(0).toUpperCase() + winner.slice(1)} Won 🎉`
            );
          
            if (updatedRatings) {
              const updateRating = (userObj) => {
                const newRating = updatedRatings[userObj.username?.toLowerCase()];
                return newRating !== undefined ? { ...userObj, rating: newRating } : userObj;
              };
          
              setPlayerInfo((prev) => updateRating(prev));
              setOpponentInfo((prev) => updateRating(prev));
            }
            break;
          }


          case REMATCH_REQUESTED:
            setShowAcceptRematch(true);
            break;

          case DRAW_REQUESTED:
            setShowDrawOffer(true);
            break;

          case DRAW_ACCEPTED:
            setResultMessage("Game Drawn 🤝");
            break;

          case "TIME_UPDATE":
            const rawTimers = message.payload;
            setTimers(rawTimers);
            setDisplayTimers(() => {
              const formatted = {};
              for (const user in rawTimers) {
                formatted[user] = formatTime(rawTimers[user]);
              }
              return formatted;
            });
            break;

          default:
            console.warn("Unknown message:", message.type);
        }
      } catch (err) {
        console.error("WebSocket parse error:", event.data);
      }
    };
  }, [socket, chess]);

  if (waitingForOpponent) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] text-white flex flex-col justify-center items-center">
        <h2 className="text-2xl font-semibold mb-4">Room ID: {roomId}</h2>
        <p>Waiting for opponent to join...</p>
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("Room link copied!");
          }}
          className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          Copy Invite Link
        </button>
        <Button className="mt-4" onClick={() => navigate("/")}>Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white flex justify-center items-start pt-10">
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
          displayTimers={displayTimers}
        />
      </div>

      <div className="ml-10 w-64 p-6 flex flex-col items-center bg-[#2c2c2c] shadow-lg rounded-lg">
        {started && (
          <div className="mt-4 w-full text-center">
            <select
              className="w-full border border-gray-600 bg-[#3b3b3b] text-white rounded px-3 py-2"
              value=""
              onChange={(e) => {
                if (e.target.value === "draw" && !waitingDrawResponse) sendDrawRequest();
                else if (e.target.value === "resign") sendResign();
              }}
            >
              <option value="" disabled>More Options</option>
              <option value="draw" disabled={waitingDrawResponse}>Offer Draw</option>
              <option value="resign">Resign</option>
            </select>
          </div>
        )}

        {showDrawOffer && (
          <>
            <div className="text-white text-center mt-4 mb-2">Opponent offered a draw!</div>
            <Button className="mb-2" onClick={acceptDraw}>Accept Draw</Button>
            <Button variant="secondary" onClick={() => setShowDrawOffer(false)}>Decline</Button>
          </>
        )}

        {resultMessage && (
          <>
            <div className="text-white text-center mt-4 text-lg font-medium">Game Over</div>
            <div className="text-white text-center mb-2">{resultMessage}</div>
            <Button className="mt-2" onClick={requestRematch}>Play Again</Button>
            <Button className="mt-2" variant="secondary" onClick={() => navigate("/")}>Home</Button>
          </>
        )}

        {waitingRematch && <div className="text-gray-400 text-center mt-2">Waiting for opponent to accept...</div>}

        {showAcceptRematch && (
          <>
            <div className="text-white text-center mt-2 mb-2">Opponent wants a rematch!</div>
            <Button className="mb-2" onClick={acceptRematch}>Accept</Button>
            <Button variant="secondary" onClick={() => setShowAcceptRematch(false)}>Decline</Button>
          </>
        )}
      </div>
    </div>
  );
};
