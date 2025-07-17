// src/components/Game/SidePanel.jsx
import React from "react";
import { Button } from "../Button";
import { TimeControlSelect } from "./TimeControlSelect";
import { GameControls } from "./GameControls";
import { ChatBox } from "./ChatBox";
import { MatchStatusPanel } from "./MatchStatusPanel";

export const SidePanel = ({
  started,
  waitingRematch,
  showAcceptRematch,
  selectedTime,
  setSelectedTime,
  sendPlayRequest,
  navigate,
  waitingDrawResponse,
  sendDrawRequest,
  sendResign,
  chatMessages,
  chatInput,
  setChatInput,
  sendChatMessage,
  waitingDrawResponseState,
  showDrawOffer,
  acceptDraw,
  setShowDrawOffer,
  resultMessage,
  requestRematch,
  setResultMessage,
  setStarted,
  waitingRematchState,
  showAcceptRematchState,
  acceptRematch,
  setShowAcceptRematch,
}) => (
  <div className="ml-10 w-64 p-6 flex flex-col items-center bg-[#2c2c2c] shadow-lg rounded-lg">
    {!started && !waitingRematch && !showAcceptRematch && (
      <>
        <TimeControlSelect selectedTime={selectedTime} setSelectedTime={setSelectedTime} />
        <Button onClick={sendPlayRequest}>Play</Button>
        <Button className="mt-4" variant="secondary" onClick={() => navigate("/")}>Home</Button>
      </>
    )}

    {started && (
      <>
        <GameControls
          waitingDrawResponse={waitingDrawResponse}
          sendDrawRequest={sendDrawRequest}
          sendResign={sendResign}
        />
        <ChatBox
          chatMessages={chatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          sendChatMessage={sendChatMessage}
        />
      </>
    )}

    <MatchStatusPanel
      waitingDrawResponse={waitingDrawResponseState}
      showDrawOffer={showDrawOffer}
      acceptDraw={acceptDraw}
      setShowDrawOffer={setShowDrawOffer}
      resultMessage={resultMessage}
      requestRematch={requestRematch}
      setResultMessage={setResultMessage}
      setStarted={setStarted}
      sendPlayRequest={sendPlayRequest}
      navigate={navigate}
      waitingRematch={waitingRematchState}
      showAcceptRematch={showAcceptRematchState}
      acceptRematch={acceptRematch}
      setShowAcceptRematch={setShowAcceptRematch}
    />
  </div>
);
