import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";

export const Landing = () => {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] text-white flex justify-center items-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex flex-row text-white">
      {/* Sidebar (only if user is logged in) */}
      {user && (
        <div className="w-64 bg-[#2c2c2c] p-6 flex flex-col justify-between shadow-2xl">
          <div>
            <h2 className="text-xl font-bold mb-2">{user.username}</h2>
            <p className="text-sm text-gray-400 mb-1">{user.email}</p>
            <p className="text-sm text-green-400 mb-4">
              Rating: {user.rating || 1000}
            </p>
          </div>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-[#2c2c2c] shadow-2xl rounded-2xl overflow-hidden">
          {/* Image Section */}
          <div className="flex justify-center bg-[#1a1a1a] p-6">
            <img
              src="/chessboard.jpeg"
              alt="Chessboard"
              className="w-full max-w-md rounded-xl border-4 border-[#4caf50] shadow-xl"
            />
          </div>

          {/* Right Content */}
          <div className="text-white p-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#4caf50] leading-tight mb-4">
              Play Chess Online
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              Challenge your friends, climb the leaderboard, and improve your
              skills — all in one place.
            </p>

            <div className="flex flex-col md:flex-row gap-4">
              {!user ? (
                <>
                  <Button
                    onClick={() => navigate("/login")}
                    className="bg-black hover:bg-[#333] text-white px-6 py-3 text-lg rounded-md border border-[#4caf50]"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => navigate("/register")}
                    className="bg-[#4caf50] hover:bg-green-600 text-white px-6 py-3 text-lg rounded-md"
                  >
                    Sign Up
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => navigate("/game")}
                    className="bg-[#4caf50] hover:bg-green-600 text-white px-6 py-3 text-lg rounded-md"
                  >
                    Play Online
                  </Button>
                  <Button
                    onClick={() => navigate("/friend")}
                    className="bg-[#2196f3] hover:bg-blue-600 text-white px-6 py-3 text-lg rounded-md"
                  >
                    Play with a Friend
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
