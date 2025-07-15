
import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { Button } from "../components/Button";
import { ChessBoard } from "../components/ChessBoard";
import { Chess } from "chess.js";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const REQUEST_REMATCH = "request_rematch";
export const REMATCH_REQUESTED = "rematch_requested";
export const OFFER_DRAW = "offer_draw";
export const DRAW_REQUESTED = "draw_requested";
export const DRAW_ACCEPTED = "draw_accepted";
export const RESIGN = "resign";
export const CHAT_MESSAGE = "CHAT_MESSAGE";

export const Game = () => {
  const socket = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [chess, setChess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [started, setStarted] = useState(false);
  const [playerColor, setPlayerColor] = useState("w");
  const [resultMessage, setResultMessage] = useState(null);
  const [waitingRematch, setWaitingRematch] = useState(false);
  const [showAcceptRematch, setShowAcceptRematch] = useState(false);
  const [playerInfo, setPlayerInfo] = useState({ username: "", rating: 1000 });
  const [opponentInfo, setOpponentInfo] = useState({ username: "", rating: 1000 });

  const [timers, setTimers] = useState({});
  const [displayTimers, setDisplayTimers] = useState({});

  const [showDrawOffer, setShowDrawOffer] = useState(false);
  const [waitingDrawResponse, setWaitingDrawResponse] = useState(false);
  const [waitingForMatch, setWaitingForMatch] = useState(false);
  const [selectedTime, setSelectedTime] = useState({ minutes: 10, increment: 0 });

  // ✅ Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const formatTime = (ms) => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const sendPlayRequest = () => {
    if (!user) return;
    setWaitingForMatch(true);

    socket?.send(
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          username: user.username,
          rating: user.rating || 1000,
          time: selectedTime,
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

  // ✅ Send Chat
   const sendChatMessage = () => {
  if (!chatInput.trim()) return;

  const messageToSend = {
    type: CHAT_MESSAGE,
    payload: {
      roomId: opponentInfo.roomId || playerInfo.roomId,
      message: chatInput.trim(),
      sender: user?.username || "Guest",
    },
  };

  // ✅ Send message to server
  socket?.send(JSON.stringify(messageToSend));

  // ✅ Immediately show your own message
  setChatMessages((prev) => [...prev, {
    sender: user?.username || "Guest",
    message: chatInput.trim(),
  }]);

  setChatInput("");
};


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
          case INIT_GAME: {
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
            setWaitingForMatch(false);
            setChatMessages([]);

            setPlayerInfo(self);
            setOpponentInfo(opponent);
            break;
          }

          case MOVE: {
            const move = message.payload;
            chess.move(move);
            setBoard(chess.board());

            const turn = chess.turn();
            if (
              (turn === "w" && playerColor === "w") ||
              (turn === "b" && playerColor === "b")
            ) {
              setWaitingDrawResponse(false);
            }
            break;
          }

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

          case DRAW_ACCEPTED: {
            const { updatedRatings } = message.payload;
            setResultMessage("Game Drawn 🤝");

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

          case "TIME_UPDATE": {
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
          }

          case CHAT_MESSAGE: {
            const { message: text, sender } = message.payload;
            setChatMessages((prev) => [...prev, { sender, message: text }]);
            break;
          }

          default:
            console.warn("Unknown message type:", message.type);
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", event.data);
      }
    };
  }, [socket, chess]);

  if (!socket)
    return (
      <div className="bg-gray-900 text-white min-h-screen flex justify-center items-center">
        Connecting...
      </div>
    );

  if (waitingForMatch && !started) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] text-white flex flex-col justify-center items-center">
        <h2 className="text-2xl font-semibold mb-4">Waiting for opponent to join...</h2>
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <Button className="mt-6" variant="secondary" onClick={() => setWaitingForMatch(false)}>
          Cancel Matchmaking
        </Button>
        <Button className="mt-4" variant="secondary" onClick={() => navigate("/")}>
          Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white flex justify-center items-start pt-10">
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
          displayTimers={displayTimers}
        />
      </div>

      {/* Side Panel with Chat */}
      <div className="ml-10 w-64 p-6 flex flex-col items-center bg-[#2c2c2c] shadow-lg rounded-lg">
        {/* Game Controls */}
        {!started && !waitingRematch && !showAcceptRematch && (
          <>
            <select
              className="w-full border border-gray-600 bg-[#3b3b3b] text-white rounded px-3 py-2 mb-4"
              value={`${selectedTime.minutes}+${selectedTime.increment}`}
              onChange={(e) => {
                const [min, inc] = e.target.value.split("+").map(Number);
                setSelectedTime({ minutes: min, increment: inc });
              }}
            >
              <option value="1+0">Bullet (1+0)</option>
              <option value="3+0">Blitz (3+0)</option>
              <option value="5+0">Blitz (5+0)</option>
              <option value="10+0">Rapid (10+0)</option>
              <option value="15+10">Rapid (15+10)</option>
              <option value="30+0">Classical (30+0)</option>
            </select>

            <Button onClick={sendPlayRequest}>Play</Button>
            <Button className="mt-4" variant="secondary" onClick={() => navigate("/")}>
              Home
            </Button>
          </>
        )}

        {started && (
          <>
            <div className="mt-4 w-full text-center">
              <select
                className="w-full border border-gray-600 bg-[#3b3b3b] text-white rounded px-3 py-2"
                value=""
                onChange={(e) => {
                  if (e.target.value === "draw" && !waitingDrawResponse) sendDrawRequest();
                  else if (e.target.value === "resign") sendResign();
                }}
              >
                <option value="" disabled>
                  More Options
                </option>
                <option value="draw" disabled={waitingDrawResponse}>
                  Offer Draw {waitingDrawResponse ? "(Waiting...)" : ""}
                </option>
                <option value="resign">Resign</option>
              </select>
            </div>

            {/* ✅ Chat Box */}
            <div className="mt-6 w-full bg-[#1f1f1f] p-3 rounded shadow-inner flex flex-col">
  <div className="text-white font-medium mb-2">Chat</div>

  {/* Chat Messages */}
  <div
    id="chat-box"
    className="h-40 overflow-y-auto bg-[#2a2a2a] p-2 rounded text-sm mb-2 flex flex-col gap-1"
  >
    {chatMessages.map((msg, idx) => (
      <div key={idx}>
        <strong className="text-blue-400">{msg.sender}:</strong>{" "}
        <span className="text-white">{msg.message}</span>
      </div>
    ))}
  </div>

  {/* Chat Input + Send Button */}
  <div className="flex gap-2">
    <input
      type="text"
      value={chatInput}
      onChange={(e) => setChatInput(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
      placeholder="Type message..."
      className="flex-1 px-2 py-1 rounded bg-[#3b3b3b] text-white outline-none"
    />
    <button
      onClick={sendChatMessage}
      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
    >
      Send
    </button>
  </div>
</div>

          </>
        )}

        {/* Draw / Rematch / Result logic */}
        {waitingDrawResponse && (
          <div className="text-gray-400 text-center mt-2">
            Waiting for opponent to accept draw...
          </div>
        )}

        {showDrawOffer && (
          <>
            <div className="text-white text-center mt-4 mb-2">
              Opponent offered a draw!
            </div>
            <Button className="mb-2" onClick={acceptDraw}>
              Accept Draw
            </Button>
            <Button variant="secondary" onClick={() => setShowDrawOffer(false)}>
              Decline
            </Button>
          </>
        )}

        {resultMessage && !waitingRematch && !showAcceptRematch && (
          <>
            <div className="text-white text-center mt-4 text-lg font-medium">
              Game Over
            </div>
            <Button className="mt-4" onClick={requestRematch}>
              Play Again
            </Button>
            <Button
              className="mt-2"
              variant="secondary"
              onClick={() => {
                setResultMessage(null);
                setStarted(false);
                sendPlayRequest();
              }}
            >
              Next Match
            </Button>
            <Button className="mt-2" variant="secondary" onClick={() => navigate("/")}>
              Home
            </Button>
          </>
        )}

        {waitingRematch && (
          <div className="text-gray-400 text-center mt-2">
            Waiting for opponent to accept...
          </div>
        )}

        {showAcceptRematch && (
          <>
            <div className="text-white text-center mt-2 mb-2">
              Opponent wants a rematch!
            </div>
            <Button className="mb-2" onClick={acceptRematch}>
              Accept
            </Button>
            <Button variant="secondary" onClick={() => setShowAcceptRematch(false)}>
              Decline
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
