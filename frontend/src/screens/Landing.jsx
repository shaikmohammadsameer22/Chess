import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";

export const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white shadow-xl rounded-2xl p-8">
        {/* Left side - Image */}
        <div className="flex justify-center">
          <img
            src="/chessboard.jpeg"
            alt="Chessboard"
            className="w-full max-w-md rounded-xl shadow-md"
          />
        </div>

        {/* Right side - Content */}
        <div className="text-center md:text-left">
          <h1 className="text-5xl font-extrabold text-gray-800 leading-tight">
            Play chess online on the <span className="text-blue-600">#1 site</span>!
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Challenge friends, play against the computer, or join a community of chess lovers!
          </p>

          <div className="mt-8">
            <Button
              onClick={() => {
                navigate("/game");
              }}
              className="px-6 py-3 text-lg"
            >
              ♟️ Play Online
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
