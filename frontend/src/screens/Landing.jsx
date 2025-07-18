import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";

export const Landing = () => {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);

 useEffect(() => {
  fetch("https://chess-run1.onrender.com/api/users/leaderboard", {
    method: "GET",
    credentials: "include", 
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    })
    .then((data) => {
      if (Array.isArray(data)) {
        setLeaderboard(data);
      } else {
        console.error("Leaderboard data is not an array", data);
      }
    })
    .catch((err) => console.error("Leaderboard fetch error:", err));
}, []);

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
      {/* Sidebar */}
      {user && (
        <div className="w-80 bg-[#2c2c2c] p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-1">{user.username}</h2>
              <p className="text-sm text-gray-400">{user.email}</p>
              <p className="text-sm text-green-400 mt-2">
                Rating: {user.rating || 1000}
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold border-b border-gray-600 pb-1 mb-2">
                Leaderboard
              </h3>
              <ul className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
                {leaderboard.map((player, index) => (
                  <li
                    key={player.username || index}
                    className="flex justify-between bg-[#1e1e1e] p-2 rounded-md text-sm"
                  >
                    <span className="font-medium">
                      {index + 1}. {player.username || "Unknown"}
                    </span>
                    <span className="text-gray-300">
                      {player.rating || 1000}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-4xl w-full bg-[#2c2c2c] shadow-2xl rounded-2xl p-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#4caf50] mb-6">
            Play Chess Online
          </h1>
          <p className="text-lg text-gray-300 mb-8">
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
  );
};
