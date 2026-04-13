"use client";

import { useState } from "react";
import { DietState, ChatMessage } from "@/lib/types";

type Props = {
  state: DietState;
  setState: React.Dispatch<React.SetStateAction<DietState>>;
  setTab?: (tab: string) => void;
};

export default function ChatPage({ state, setState, setTab }: Props) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          setLocationError("無法取得位置，請檢查權限設定");
          console.error("Geolocation error:", error);
        }
      );
    } else {
      setLocationError("您的瀏覽器不支援位置定位");
    }
  };

  const getRestaurantRecommendations = async () => {
    if (!userLocation) {
      requestLocation();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/nearby-restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: userLocation.lat,
          lng: userLocation.lng,
        }),
      });

      const data = await response.json();
      if (data.options && data.options.length > 0) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: "根据你的位置，我找到了这些附近的餐厅呢！汪汪",
          options: data.options,
        };
        setState((prev: DietState) => ({
          ...prev,
          chatMessages: [...prev.chatMessages, assistantMessage],
        }));
      }
    } catch (error) {
      console.error("Failed to get restaurant recommendations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
    };

    setState((prev: DietState) => ({
      ...prev,
      chatMessages: [...prev.chatMessages, userMessage],
    }));

    setInput("");
    setIsLoading(true);

    try {
      const systemMessage: ChatMessage = {
        role: "system",
        content: "你是一只可愛的小狗，非常友善和活潑。在對話中經常加入'汪汪'的聲音，表達你的性格。幫助用戶解答有關飲食和健康的問題，同時保持可愛、俏皮的態度。\n\n當你需要提供選項給用戶選擇時，請在回覆的最後一行添加以下格式（單獨一行）：\n[OPTIONS] 選項1|選項2|選項3",
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [systemMessage, ...state.chatMessages, userMessage],
        }),
      });

      const data = await response.json();
      if (data.reply) {
        let replyText = data.reply;
        let options: string[] = [];

        const optionsMatch = replyText.match(/\[OPTIONS\]\s*(.+?)(?:\n|$)/);
        if (optionsMatch) {
          const optionsStr = optionsMatch[1];
          options = optionsStr
            .split("|")
            .map((opt: string) => opt.trim())
            .filter((opt: string) => opt);
          replyText = replyText.replace(/\[OPTIONS\]\s*.+?(?:\n|$)/, "").trim();
        }

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: replyText,
          ...(options.length > 0 && { options }),
        };

        setState((prev: DietState) => ({
          ...prev,
          chatMessages: [...prev.chatMessages, assistantMessage],
        }));
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoHome = () => {
    if (setTab) setTab("home");
  };

  const handleSelectOption = (option: string) => {
    setInput(option);
  };

  return (
    <div className="page active">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontFamily: "'StarPandaKids'" }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>和我聊聊天吧</h2>
        <button onClick={handleGoHome} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1, marginBottom: 0 }}>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, marginBottom: 8, paddingRight: 6 }}>
          {state.chatMessages.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--ink3)", fontSize: 12, marginTop: 20 }}>開始聊天吧！</div>
          ) : (
            state.chatMessages.map((msg, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 4, flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "70%", padding: "6px 10px", borderRadius: 6, backgroundColor: msg.role === "user" ? "var(--accent)" : "var(--surface)", color: msg.role === "user" ? "#fff" : "var(--ink)", fontSize: 12, lineHeight: 1.3, wordBreak: "break-word" }}>
                  {msg.content}
                </div>
                {msg.options && msg.options.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6, width: "100%", maxWidth: "70%" }}>
                    {msg.options.map((option, optIdx) => (
                      <button key={optIdx} onClick={() => handleSelectOption(option)} disabled={isLoading} style={{ padding: "7px 10px", backgroundColor: "var(--accent)", color: "#fff", border: "none", borderRadius: 6, cursor: isLoading ? "default" : "pointer", fontSize: 11, fontFamily: "'StarPandaKids'", transition: "background-color 0.2s", opacity: isLoading ? 0.6 : 1 }} onMouseOver={(e) => { if (!isLoading) (e.target as HTMLButtonElement).style.backgroundColor = "#5a7a8a"; }} onMouseOut={(e) => { (e.target as HTMLButtonElement).style.backgroundColor = "var(--accent)"; }}>
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
          <button onClick={getRestaurantRecommendations} disabled={isLoading} style={{ padding: "5px 10px", backgroundColor: userLocation ? "var(--accent)" : "#ccc", color: "#fff", border: "none", borderRadius: 4, cursor: isLoading ? "default" : "pointer", fontSize: 11, fontFamily: "'StarPandaKids'", opacity: isLoading ? 0.6 : 1 }}>
            {userLocation ? "🍽️ 推薦餐點" : "📍 獲取位置"}
          </button>
          {locationError && (<span style={{ fontSize: 10, color: "red", alignSelf: "center" }}>{locationError}</span>)}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => { if (e.key === "Enter" && !isLoading) handleSendMessage(); }} placeholder="輸入訊息..." disabled={isLoading} style={{ flex: 1, padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12, fontFamily: "inherit", backgroundColor: "var(--bg)", color: "var(--ink)" }} />
          <button onClick={handleSendMessage} disabled={isLoading || !input.trim()} style={{ padding: "6px 10px", backgroundColor: isLoading || !input.trim() ? "var(--border)" : "var(--accent)", color: "#fff", border: "none", borderRadius: 4, cursor: isLoading || !input.trim() ? "default" : "pointer", fontSize: 11, fontFamily: "'StarPandaKids'" }}>
            {isLoading ? "..." : "送出"}
          </button>
        </div>
      </div>
    </div>
  );
}
