import { useState, useRef } from "react";
import { MOVE } from "../screens/Game";
import { ProfileDropdown } from "./ProfileDropdown";

export const ChessBoard = ({
  board,
  socket,
  setBoard,
  chess,
  playerColor,
  resultMessage,
  playerInfo,
  opponentInfo,
  displayTimers,
}) => {
  const [from, setFrom] = useState(null);
  const dragSoundRef = useRef(null);

  const handleMove = (from, to) => {
    try {
      socket.send(
        JSON.stringify({
          type: MOVE,
          payload: { move: { from, to } },
        })
      );
      chess.move({ from, to });
      setBoard(chess.board());
      if (dragSoundRef.current) {
        dragSoundRef.current.currentTime = 0;
        dragSoundRef.current.play();
      }
    } catch (e) {
      console.error("Invalid move:", e);
    }
    setFrom(null);
  };

  const displayBoard = playerColor === "w" ? board : [...board].reverse();

  return (
    <>
      <audio ref={dragSoundRef} src="/drag.wav" preload="auto" />

      

      <div className="relative p-4 bg-[#1e1e1e] rounded-xl inline-block border-4 border-[#1e1e1e]">
        <div className="w-[512px] text-white font-semibold text-lg">
          {/* Opponent Info */}
          {playerInfo.username && opponentInfo.username && (
            <div className="flex justify-between mb-2 px-1">
              <div>{`${opponentInfo.username} (${opponentInfo.rating})`}</div>
              <div>{displayTimers[opponentInfo.username] || "10:00"}</div>
            </div>
          )}

          {/* Chess Board */}
          <div className="relative">
            {resultMessage && (
              <div className="absolute inset-0 bg-black bg-opacity-60 z-20 flex items-center justify-center rounded-xl">
                <div className="bg-gray-800 text-white text-3xl font-bold px-6 py-4 rounded-lg shadow-xl animate-fadeIn">
                  {resultMessage}
                </div>
              </div>
            )}

            {displayBoard.map((row, rowIndex) => {
              const displayRow = playerColor === "w" ? row : [...row].reverse();
              return (
                <div key={rowIndex} className="flex">
                  {displayRow.map((square, colIndex) => {
                    const realRow = playerColor === "w" ? rowIndex : 7 - rowIndex;
                    const realCol = playerColor === "w" ? colIndex : 7 - colIndex;

                    const file = String.fromCharCode(97 + realCol);
                    const rank = `${8 - realRow}`;
                    const squareRepresentation = `${file}${rank}`;
                    const isLight = (realRow + realCol) % 2 === 0;
                    const isSelected = from === squareRepresentation;

                    return (
                      <div
                        key={colIndex}
                        onClick={() => {
                          if (!from) {
                            setFrom(squareRepresentation);
                          } else {
                            handleMove(from, squareRepresentation);
                          }
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (from) handleMove(from, squareRepresentation);
                        }}
                        className={`w-16 h-16 flex items-center justify-center cursor-pointer select-none transition duration-150 ease-in-out
                          ${isSelected ? "ring-4 ring-yellow-500" : ""}
                          ${isLight ? "bg-[#eeeed2]" : "bg-[#769656]"}
                          hover:brightness-110`}
                      >
                        {square ? (
                          <img
                            src={`/${
                              square.color === "b"
                                ? square.type
                                : `${square.type.toUpperCase()} copy`
                            }.png`}
                            alt={`${square.color} ${square.type}`}
                            className="w-10 h-10"
                            draggable={true}
                            onDragStart={() => {
                              setFrom(squareRepresentation);
                            }}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Player Info */}
          {playerInfo.username && opponentInfo.username && (
            <div className="flex justify-between mt-2 px-1">
              <div>{`${playerInfo.username} (${playerInfo.rating})`}</div>
              <div>{displayTimers[playerInfo.username] || "10:00"}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
