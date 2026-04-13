import { DietState } from "./types";

export const initialState: DietState = {
  goal: 1600,
  flex: 200,
  used: 0,
  history: [],
  isSleeping: false,
  sleepStart: null,
  status: "normal",
  reminders: [],
  compensation: {
    selectedPlanId: null,
    proofDataUrl: null,
    seed: 1,
  },
  pendingFoodPhotoDataUrl: null,
  chatMessages: [
    {
      role: "assistant",
      content: "嗨，我是你的飲食小助手。你可以問我今天吃什麼比較適合，也可以直接上傳照片。",
    },
  ],
};

export const monsterQuotes = [
  "你已經在變強了，真的。",
  "今天只要比昨天更靠近一點點就很棒。",
  "不用完美，保持方向就贏了。",
  "你在做一件很難但很值得的事。",
  "我在這裡陪你，一起穩穩來。",
];