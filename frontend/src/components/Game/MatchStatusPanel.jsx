// src/components/Game/MatchStatusPanel.jsx
import React from "react";
import { Button } from "../Button";

export const MatchStatusPanel = ({
  waitingDrawResponse,
  showDrawOffer,
  acceptDraw,
  setShowDrawOffer,
  resultMessage,
  requestRematch,
  setResultMessage,
  setStarted,
  sendPlayRequest,
  navigate,
  waitingRematch,
  showAcceptRematch,
  acceptRematch,
  setShowAcceptRematch,
}) => (
  <>
    {waitingDrawResponse && (
      <div className="text-gray-400 text-center mt-2">
        Waiting for opponent to accept draw...
      </div>
    )}

    {showDrawOffer && (
      <>
        <div className="text-white text-center mt-4 mb-2">
          Opponent offered a draw!
        </div>
        <Button className="mb-2" onClick={acceptDraw}>Accept Draw</Button>
        <Button variant="secondary" onClick={() => setShowDrawOffer(false)}>Decline</Button>
      </>
    )}

    {resultMessage && !waitingRematch && !showAcceptRematch && (
      <>
        <div className="text-white text-center mt-4 text-lg font-medium">
          Game Over
        </div>
        <Button className="mt-4" onClick={requestRematch}>Play Again</Button>
        <Button className="mt-2" variant="secondary" onClick={() => {
          setResultMessage(null);
          setStarted(false);
          sendPlayRequest();
        }}>Next Match</Button>
        <Button className="mt-2" variant="secondary" onClick={() => navigate("/")}>Home</Button>
      </>
    )}

    {waitingRematch && (
      <div className="text-gray-400 text-center mt-2">
        Waiting for opponent to accept...
      </div>
    )}

    {showAcceptRematch && (
      <>
        <div className="text-white text-center mt-2 mb-2">
          Opponent wants a rematch!
        </div>
        <Button className="mb-2" onClick={acceptRematch}>Accept</Button>
        <Button variant="secondary" onClick={() => setShowAcceptRematch(false)}>Decline</Button>
      </>
    )}
  </>
);
