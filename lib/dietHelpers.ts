import { DietState, FoodHistoryItem, Reminder } from "./types";

export function toNum(v: unknown) {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
}

export function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random()}`;
}

export function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return "";
  }
}

export function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function estimateKcal(name: string) {
  const s = name.toLowerCase();
  if (s.includes("便當")) return 750;
  if (s.includes("牛肉麵") || s.includes("拉麵") || s.includes("炸雞")) return 850;
  if (s.includes("沙拉")) return 350;
  if (s.includes("雞胸") || s.includes("雞胸肉")) return 300;
  if (s.includes("蛋")) return 150;
  if (s.includes("奶茶") || s.includes("手搖")) return 450;
  return 350;
}

export function estimateMacros(name: string, kcal: number) {
  const s = name.toLowerCase();
  const hasProtein = ["雞胸", "雞腿", "雞", "牛", "豬", "魚", "鮭", "鮪", "豆腐", "豆", "蛋", "優格", "牛奶", "乳清"].some((k) => s.includes(k));
  const hasCarb = ["飯", "麵", "吐司", "麵包", "粥", "地瓜", "馬鈴薯", "冬粉", "粉", "餅", "甜點", "糖"].some((k) => s.includes(k));
  const hasFat = ["炸", "奶油", "起司", "培根", "五花", "滷肉", "花生", "堅果", "油"].some((k) => s.includes(k));
  const isDrink = ["奶茶", "手搖", "可樂", "汽水", "果汁", "拿鐵"].some((k) => s.includes(k));
  const isSalad = s.includes("沙拉");

  let pRatio = 0.25;
  let fRatio = 0.3;
  let cRatio = 0.45;

  if (isDrink) {
    pRatio = 0.1;
    fRatio = 0.2;
    cRatio = 0.7;
  } else if (isSalad) {
    pRatio = 0.3;
    fRatio = 0.35;
    cRatio = 0.35;
  } else if (hasProtein && !hasCarb) {
    pRatio = 0.45;
    fRatio = hasFat ? 0.35 : 0.25;
    cRatio = 1 - pRatio - fRatio;
  } else if (hasCarb && !hasProtein) {
    pRatio = 0.15;
    fRatio = 0.25;
    cRatio = 0.6;
  } else if (hasFat && hasCarb && !hasProtein) {
    pRatio = 0.1;
    fRatio = 0.4;
    cRatio = 0.5;
  }

  const pKcal = kcal * pRatio;
  const fKcal = kcal * fRatio;
  const cKcal = kcal * cRatio;

  return {
    protein: Math.round(pKcal / 4),
    fat: Math.round(fKcal / 9),
    carbs: Math.round(cKcal / 4),
  };
}

export function getExcessKcal(state: DietState) {
  return Math.max(0, state.used - state.goal);
}

export function diaryItemsForToday(state: DietState): FoodHistoryItem[] {
  const today = new Date();
  return state.history.filter((h) => {
    if (h.type !== "food") return false;
    const t = new Date(h.time);
    return (
      t.getFullYear() === today.getFullYear() &&
      t.getMonth() === today.getMonth() &&
      t.getDate() === today.getDate()
    );
  }) as FoodHistoryItem[];
}

export function getDueReminders(state: DietState): Reminder[] {
  const todayKey = toDateKey(new Date());
  return (state.reminders || []).filter((r) => !r.done && r.dueDate === todayKey);
}

export function getCompensationPlans(state: DietState) {
  const excess = getExcessKcal(state);
  if (excess <= 0) return [];

  const seed = Number(state.compensation?.seed || 1);

  const pick = <T,>(arr: T[], n: number) => {
    const a = [...arr];
    let s = seed;
    for (let i = a.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, n);
  };

  const todayActions = [
    { id: "walk_20", kind: "today", text: "今天多走 15–20 分鐘（或飯後散步 10 分鐘）" },
    { id: "walk_35", kind: "today", text: "今天加一段 25–35 分鐘快走／踩腳踏車（能講話但微喘）" },
    { id: "walk_split", kind: "today", text: "今天分兩段各 20 分鐘快走（飯後各一次）" },
    { id: "drink_nosugar", kind: "today", text: "今天飲料改無糖，宵夜先跳過" },
    { id: "sleep_early", kind: "today", text: "今晚提早睡：睡眠足夠比較不容易爆食" },
  ];

  const nextMealActions = [
    { id: "nextmeal_half", kind: "nextMeal", text: "下一餐主食減半，蛋白質＋蔬菜維持" },
    { id: "nextmeal_half_veg", kind: "nextMeal", text: "下一餐：主食 1/2 份＋多一份蔬菜（或湯類替代）" },
    { id: "nextmeal_third_veg", kind: "nextMeal", text: "下一餐：主食 1/3 份＋蛋白質正常＋蔬菜加量" },
  ];

  const tomorrowActions = [
    { id: "tomorrow_snack_swap", kind: "tomorrow", text: "明天把零食改成水果/優格/茶葉蛋擇一（份量固定）" },
    { id: "tomorrow_skip_oily", kind: "tomorrow", text: "明天少一次含油點心/手搖，改無糖茶＋堅果小包（約一掌心）" },
  ];

  const plans: { id: string; kind: string; text: string }[] = [];

  if (excess <= 150) {
    plans.push(...pick(todayActions, 2));
    plans.push(...pick(nextMealActions, 1));
  } else if (excess <= 350) {
    plans.push(...pick(todayActions, 1));
    plans.push(...pick(nextMealActions, 1));
    plans.push(...pick(tomorrowActions, 1));
  } else {
    plans.push(...pick(todayActions, 2));
    plans.push(...pick(nextMealActions, 1));
    plans.push(...pick(tomorrowActions, 1));
  }

  const seen = new Set();
  return plans.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  }).slice(0, 4);
}