import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../auth/AuthContext";

export const GameRoom = () => {
  const [roomId, setRoomId] = useState("");
  const [createdRoomId, setCreatedRoomId] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const socket = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  const createRoom = () => {
    const newRoomId = uuidv4();
    setCreatedRoomId(newRoomId);
    setWaiting(true);

    socket?.send(
      JSON.stringify({
        type: "join_room",
        payload: {
          roomId: newRoomId,
          username: user.username,
          rating: user.rating || 1000,
        },
      })
    );
  };

  const joinRoom = () => {
    if (!roomId.trim()) return;

    socket?.send(
      JSON.stringify({
        type: "join_room",
        payload: {
          roomId: roomId.trim(),
          username: user.username,
          rating: user.rating || 1000,
        },
      })
    );
  };

  useEffect(() => {
    if (!socket) return;

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "init_game") {
          const navigateTo = createdRoomId || roomId || message.payload?.roomId;
          if (navigateTo) {
            navigate(`/room/${navigateTo}`);
          } else {
            console.warn("No valid room ID found for navigation");
          }
        }
      } catch (err) {
        console.error("WebSocket error in GameRoom:", event.data);
      }
    };
  }, [socket, createdRoomId, roomId]);

  return (
    <div className="text-white min-h-screen flex flex-col justify-center items-center space-y-6 bg-[#1e1e1e]">
      <h2 className="text-3xl font-bold">Play with a Friend</h2>

      {!waiting && (
        <>
          <button
            onClick={createRoom}
            className="px-6 py-2 bg-green-500 rounded-lg hover:bg-green-600"
          >
            Create Room
          </button>

          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="px-4 py-2 rounded-md bg-[#2c2c2c] text-white border border-gray-600"
            />
            <button
              onClick={joinRoom}
              className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600"
            >
              Join Room
            </button>
          </div>

          <button
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 bg-gray-700 rounded hover:bg-gray-800"
          >
            Home
          </button>
        </>
      )}

      {waiting && createdRoomId && (
        <div className="text-center">
          <h3 className="text-xl mb-2">Room ID: {createdRoomId}</h3>
          <p>Waiting for opponent to join...</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(createdRoomId);
              alert("Room ID copied!");
            }}
            className="mt-3 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Copy Room ID
          </button>

          <button
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 bg-gray-700 rounded hover:bg-gray-800"
          >
            Home
          </button>
        </div>
      )}
    </div>
  );
};
