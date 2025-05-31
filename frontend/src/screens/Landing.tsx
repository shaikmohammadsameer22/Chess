import { useNavigate } from "react-router-dom"
import { Button } from "../components/Button";

export const Landing=()=>{ 
    const navigate = useNavigate();
    return <div>
        <div className="mt-2">
         <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex justify-center">
                <img src={"/chessboard.jpeg"}
                 className="max-w-96"></img>
            </div>
            <div>
                <div className="flex justify-center">
                    <h1 className="text -4xl font-bold">Play chess online on the #1 site!</h1>
                </div>
                
                <div className="mt-8 flex justify-center">
                    <Button onClick={()=>{
                        navigate("/game")
                    }}>
                   
                        Play Online
                    </Button>
                </div>
            </div>
         </div>
        </div>
        
        
    </div>
}