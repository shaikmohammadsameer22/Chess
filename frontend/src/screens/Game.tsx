import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket"
import { Button } from "../components/Button"
import { ChessBoard } from "../components/ChessBoard"
import { Chess } from "chess.js";

 export const INIT_GAME ="init_game";
export const MOVE = "move";
export const GAME_OVER ="game_over";

export const Game = () => {
    const socket = useSocket();
    const [chess,setChess]= useState(new Chess());
    const [board,setBoard]= useState(chess.board());
    const [started,setStarted]= useState(false);
    useEffect(()=>{
      if(!socket){
        return;
      }
      socket.onmessage=(event)=>{
        const message = JSON.parse(event.data);
        switch(message.type){
            case INIT_GAME:
                
                setBoard(chess.board());
                setStarted(true);
                console.log("game initialized");
                break;
            case MOVE:
                const move = message.payload;
                chess.move(move);
                setBoard(chess.board());
                console.log("move made");
                break;    
            case GAME_OVER:
                console.log("game over");
                break;    
        }

      }
    },[socket])
    if(!socket) return <div>Connecting...</div>
    return <div className="justify-center flex">
        <div className="pt-8 max-w-screen-lg flex">
            <div className="grid grid-cols-1 gap-4 ">

                <div className="col-span-4 bg-red-200 w-full">
                    <ChessBoard chess={chess}  setBoard={setBoard} socket={socket} board={board}/>
                </div>
                <div className="col-span-2 bg-green-200">
                   {!started && <  Button onClick={() => {
                        socket.send(JSON.stringify({
                               type:INIT_GAME
                        }))
                    }}>

                        Play
                    </Button>}
                </div>
            </div>
        </div>
    </div>
}