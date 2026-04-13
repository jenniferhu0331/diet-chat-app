export type FoodHistoryItem = {
  id: string;
  type: "food";
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  photo?: string | null;
  time: string;
};



export type CompensationHistoryItem = {
  id: string;
  type: "comp_done";
  planId: string;
  planText: string;
  time: string;
  proof: boolean;
  proofDataUrl?: string | null;
};

export type ReminderDoneHistoryItem = {
  id: string;
  type: "reminder_done";
  reminderId: string;
  time: string;
};

export type SleepStartHistoryItem = {
  id: string;
  type: "sleep_start";
  time: string;
};

export type SleepEndHistoryItem = {
  id: string;
  type: "sleep_end";
  time: string;
  minutes: number;
};

export type HistoryItem =
  | FoodHistoryItem
  | CompensationHistoryItem
  | ReminderDoneHistoryItem
  | SleepStartHistoryItem
  | SleepEndHistoryItem;

export type Reminder = {
  id: string;
  dueDate: string;
  text: string;
  done: boolean;
  createdAt: string;
};

export type CompensationState = {
  selectedPlanId: string | null;
  proofDataUrl: string | null;
  seed: number;
};

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  image?: string | null;
  options?: string[];
};

export type DietState = {
  goal: number;
  flex: number;
  used: number;
  history: HistoryItem[];
  isSleeping: boolean;
  sleepStart: string | null;
  status: string;
  reminders: Reminder[];
  compensation: CompensationState;
  pendingFoodPhotoDataUrl?: string | null;
  chatMessages: ChatMessage[];
};

export interface HistoryItem {
  id: string;
  type: "food" | "comp_done" | string; // 確保包含 comp_done
  time: number;
  
  // 飲食紀錄相關 (item.name, item.kcal 等)
  name?: string;
  kcal?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  photo?: string;

  // 補償打卡相關 (就是你紅字的地方)
  proofDataUrl?: string; // 補償照片
  planText?: string;     // 補償計畫文字描述
}