import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { Button } from "../components/Button";
import { ChessBoard } from "../components/ChessBoard";
import { Chess } from "chess.js";

import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { SidePanel } from "../components/game/SidePanel";
import { ChatBox } from "../components/game/ChatBox";



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

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const formatTime = (ms) => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const sendPlayRequest = () => {
    if (!user) return;
    setWaitingForMatch(true);
    socket?.send(JSON.stringify({
      type: INIT_GAME,
      payload: {
        username: user.username,
        rating: user.rating || 1000,
        time: selectedTime,
      },
    }));
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
    socket?.send(JSON.stringify(messageToSend));
    setChatMessages((prev) => [...prev, {
      sender: user?.username || "Guest",
      message: chatInput.trim(),
    }]);
    setChatInput("");
  };
  const toggleChat = () => setIsChatOpen((prev) => !prev);
  const clearUnreadCount = () => setUnreadCount(0);
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

  if (!isChatOpen) {
    setUnreadCount((prev) => prev + 1);
  }
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
  <div className="min-h-screen bg-[#1e1e1e] text-white flex justify-center items-start pt-10 relative">
    {/* ♟ Chess Board */}
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

    {/* 📋 Side Panel */}
    <SidePanel
      started={started}
      waitingRematch={waitingRematch}
      showAcceptRematch={showAcceptRematch}
      selectedTime={selectedTime}
      setSelectedTime={setSelectedTime}
      sendPlayRequest={sendPlayRequest}
      navigate={navigate}
      waitingDrawResponse={waitingDrawResponse}
      sendDrawRequest={sendDrawRequest}
      sendResign={sendResign}
      chatMessages={chatMessages}
      chatInput={chatInput}
      setChatInput={setChatInput}
      sendChatMessage={sendChatMessage}
      waitingDrawResponseState={waitingDrawResponse}
      showDrawOffer={showDrawOffer}
      acceptDraw={acceptDraw}
      setShowDrawOffer={setShowDrawOffer}
      resultMessage={resultMessage}
      requestRematch={requestRematch}
      setResultMessage={setResultMessage}
      setStarted={setStarted}
      waitingRematchState={waitingRematch}
      showAcceptRematchState={showAcceptRematch}
      acceptRematch={acceptRematch}
      setShowAcceptRematch={setShowAcceptRematch}
    />

    {/* 💬 Chat Popup (Floating Button + Popup Window) */}
     <ChatBox
  chatMessages={chatMessages}
  chatInput={chatInput}
  setChatInput={setChatInput}
  sendChatMessage={sendChatMessage}
  isOpen={isChatOpen}
  toggleChat={toggleChat}
  unreadCount={unreadCount}
  clearUnreadCount={clearUnreadCount}
  started={started}
  user={user}
/>

  </div>
);

};
