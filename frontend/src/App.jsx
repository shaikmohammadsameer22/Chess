

import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import { Landing } from './screens/Landing';
import { Game } from './screens/Game';

function App() {
  

  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/game" element={<Game />} />
        
          
        
      </Routes>
    </BrowserRouter>
      
    </>
  )
}

export default App
