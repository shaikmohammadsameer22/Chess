import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { GoogleLogin } from '@react-oauth/google';

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center px-4">
      <div className="bg-[#2c2c2c] p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-[#4caf50] mb-6 text-center">Login to Play</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-2 bg-[#1a1a1a] text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full px-4 py-2 bg-[#1a1a1a] text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-[#4caf50] hover:bg-green-600 text-white font-semibold rounded-md transition duration-200"
          >
            Login
          </button>
        </form>

        {/* Google Login */}
        <div className="mt-6 flex justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                const res = await fetch("http://localhost:5000/api/auth/google-login", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  credentials: "include",
                  body: JSON.stringify({ token: credentialResponse.credential }),
                });

                if (!res.ok) throw new Error("Google login failed");

                const { user } = await res.json(); // ✅ response includes user
                setUser(user); // ✅ set user in AuthContext

                navigate("/");
              } catch (error) {
                console.error(error);
                alert("Google login failed");
              }
            }}
            onError={() => {
              alert("Google Sign-In Failed");
            }}
          />
        </div>
      </div>
    </div>
  );
};
