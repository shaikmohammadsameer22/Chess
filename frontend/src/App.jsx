import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import { Landing } from './screens/Landing';
import { Game } from './screens/Game';
import { LoginPage } from './screens/LoginPage';
import { RegisterPage } from './screens/RegisterPage';
import { AuthProvider } from './auth/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GameRoom } from "./screens/GameRoom";
import { GameRoomMatch } from "./screens/GameRoomMatch";

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/game" element={<Game />} />
            <Route path="/friend" element={<GameRoom />} />
            <Route path="/room/:roomId" element={<GameRoomMatch />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
