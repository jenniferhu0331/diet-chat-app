"use client";

import { useEffect, useState } from "react";
import { initialState } from "@/lib/dietData";
import { loadState, saveState } from "@/lib/storage";
import { DietState } from "@/lib/types";
import HomePage from "./pages/HomePage";
import DiaryPage from "./pages/DiaryPage";
import ChatPage from "./pages/ChatPage";
import TabBar from "./TabBar";

export default function DietApp() {
  const [tab, setTab] = useState("home");
  const [state, setState] = useState<DietState>(initialState);

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setState({
        ...initialState,
        ...saved,
        compensation: saved.compensation || initialState.compensation,
        reminders: Array.isArray(saved.reminders) ? saved.reminders : [],
        chatMessages: saved.chatMessages?.length ? saved.chatMessages : initialState.chatMessages,
      });
    }
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  return (
    <div className={`phone-shell ${state.isSleeping ? "sleep-mode" : ""}`}>
      <div className="phone">
        {tab === "home" && <HomePage state={state} setState={setState} setTab={setTab} />}
        {tab === "diary" && <DiaryPage state={state} setState={setState} />}
        {tab === "chat" && <ChatPage state={state} setState={setState} setTab={setTab} />}

        <TabBar tab={tab} setTab={setTab} />
      </div>
    </div>
  );
}