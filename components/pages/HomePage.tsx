"use client";

import React, { useMemo, useState } from "react";
import { monsterQuotes } from "@/lib/dietData";
import {
  estimateKcal,
  estimateMacros,
  getCompensationPlans,
  getDueReminders,
  getExcessKcal,
  makeId,
  toDateKey,
  toNum,
} from "@/lib/dietHelpers";
import { DietState, Reminder } from "@/lib/types";

type Props = {
  state: DietState;
  setState: React.Dispatch<React.SetStateAction<DietState>>;
  setTab?: (tab: string) => void;
};

export default function HomePage({ state, setState, setTab }: Props) {
  const [foodInput, setFoodInput] = useState("");
  const [foodKcalInput, setFoodKcalInput] = useState("");
  const [monsterBubble, setMonsterBubble] = useState("和我聊聊天吧");
  const [isMonsterAnimating, setIsMonsterAnimating] = useState(false);
  const [hearts, setHearts] = useState<Array<{ id: string }>>([]);

  const limit = state.goal + state.flex;
  const remaining = Math.max(0, limit - state.used);
  const progress = Math.min(100, (state.used / limit) * 100);

  const foodEstimate = useMemo(() => {
    const kcalInput = toNum(foodKcalInput);
    const kcal = kcalInput > 0 ? kcalInput : foodInput.trim() ? estimateKcal(foodInput.trim()) : 0;
    if (!foodInput.trim()) return "—";
    const macros = estimateMacros(foodInput.trim(), kcal);
    return `P${macros.protein} / F${macros.fat} / C${macros.carbs}g（約 ${kcal} kcal）`;
  }, [foodInput, foodKcalInput]);

  const addFood = () => {
    const name = foodInput.trim();
    if (!name) return;

    const kcalInput = toNum(foodKcalInput);
    const kcal = kcalInput > 0 ? kcalInput : estimateKcal(name);
    const macros = estimateMacros(name, kcal);

    setState((prev: DietState) => ({
      ...prev,
      used: prev.used + kcal,
      history: [
        {
          id: makeId(),
          type: "food",
          name,
          kcal,
          protein: macros.protein,
          fat: macros.fat,
          carbs: macros.carbs,
          photo: prev.pendingFoodPhotoDataUrl || null,
          time: new Date().toISOString(),
        },
        ...prev.history,
      ],
      pendingFoodPhotoDataUrl: null,
    }));

    setFoodInput("");
    setFoodKcalInput("");
  };

  const onFoodPhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setState((prev: DietState) => ({
        ...prev,
        pendingFoodPhotoDataUrl: result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const clearFoodPhoto = () => {
    setState((prev: DietState) => ({
      ...prev,
      pendingFoodPhotoDataUrl: null,
    }));
  };

  const onMonsterClick = () => {
    setIsMonsterAnimating(true);
    setTimeout(() => setIsMonsterAnimating(false), 600);
    
    // 生成爱心
    const heartId = `heart_${Date.now()}_${Math.random()}`;
    setHearts((prev) => [...prev, { id: heartId }]);
    
    // 1秒后移除爱心
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== heartId));
    }, 1000);
    
    // 打开聊天页面
    if (setTab) {
      setTab("chat");
    }
  };

  const toggleSleep = () => {
    if (!state.isSleeping) {
      setState((prev: DietState) => ({
        ...prev,
        isSleeping: true,
        sleepStart: new Date().toISOString(),
        history: [
          {
            id: makeId(),
            type: "sleep_start",
            time: new Date().toISOString(),
          },
          ...prev.history,
        ],
      }));
      setMonsterBubble("晚安！睡眠也是飲控的一部分，我會幫你記錄起床時間。");
    } else {
      const end = new Date().toISOString();
      const start = state.sleepStart ? new Date(state.sleepStart) : null;
      const minutes = start ? Math.max(0, Math.round((new Date(end).getTime() - start.getTime()) / 60000)) : 0;

      setState((prev: DietState) => ({
        ...prev,
        isSleeping: false,
        sleepStart: null,
        history: [
          {
            id: makeId(),
            type: "sleep_end",
            time: end,
            minutes,
          },
          ...prev.history,
        ],
      }));

      setMonsterBubble(`起床啦！你剛剛睡了約 ${minutes} 分鐘。今天也一起穩穩來。`);
    }
  };

  const excess = getExcessKcal(state);
  const dueReminders = getDueReminders(state);
  const compPlans = getCompensationPlans(state);

  const selectCompPlan = (planId: string) => {
    setState((prev: DietState) => {
      const plans = getCompensationPlans(prev);
      const picked = plans.find((p) => p.id === planId);

      let reminders = [...prev.reminders];
      if (picked?.kind === "tomorrow") {
        const due = new Date();
        due.setDate(due.getDate() + 1);
        const dueKey = toDateKey(due);
        const reminderId = `rem_${picked.id}_${dueKey}`;
        if (!reminders.some((r) => r.id === reminderId)) {
          reminders.unshift({
            id: reminderId,
            dueDate: dueKey,
            text: picked.text,
            done: false,
            createdAt: new Date().toISOString(),
          });
        }
      }

      return {
        ...prev,
        reminders,
        compensation: {
          ...prev.compensation,
          selectedPlanId: planId,
        },
      };
    });
  };

  const refreshCompPlans = () => {
    setState((prev: DietState) => ({
      ...prev,
      compensation: {
        ...prev.compensation,
        seed: prev.compensation.seed + 1,
        selectedPlanId: null,
      },
    }));
  };

  const onProofSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setState((prev: DietState) => ({
        ...prev,
        compensation: {
          ...prev.compensation,
          proofDataUrl: result,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const clearCompProof = () => {
    setState((prev: DietState) => ({
      ...prev,
      compensation: {
        ...prev.compensation,
        proofDataUrl: null,
      },
    }));
  };

  const completeCompensation = () => {
    const selected = state.compensation.selectedPlanId;
    if (!selected) return;

    const picked = compPlans.find((p) => p.id === selected);

    setState((prev: DietState) => ({
      ...prev,
      history: [
        {
          id: makeId(),
          type: "comp_done",
          planId: selected,
          planText: picked?.text || "",
          time: new Date().toISOString(),
          proof: Boolean(prev.compensation.proofDataUrl),
          proofDataUrl: prev.compensation.proofDataUrl || null,
        },
        ...prev.history,
      ],
      compensation: {
        ...prev.compensation,
        selectedPlanId: null,
        proofDataUrl: null,
      },
    }));

    setMonsterBubble("收到！補償已記錄。你不需要完美，但你有在行動。");
  };

  const markReminderDone = (id: string) => {
    setState((prev: DietState) => ({
      ...prev,
      reminders: prev.reminders.map((r: Reminder) => (r.id === id ? { ...r, done: true } : r)),
      history: [
        {
          id: makeId(),
          type: "reminder_done",
          reminderId: id,
          time: new Date().toISOString(),
        },
        ...prev.history,
      ],
    }));
  };

  return (
    <div className="page active">
      <div className="character-stage">
        <div
          onClick={onMonsterClick}
          className={isMonsterAnimating ? "monster-bounce" : ""}
          style={{ cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}
        >
          <svg
            width="150"
            height="120"
            viewBox="0 0 51 38"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: "block" }}
          >
          <path d="M25.2613 0.5C29.8534 0.5 34.0357 2.23259 37.174 5.07144C38.4958 4.17884 40.5268 5.22038 42.1753 6.19708C43.718 7.11109 45.981 8.78134 47.205 11.1188C48.6144 13.8105 50.5223 16.7321 50.4998 19.295C50.4801 21.5207 49.5094 23.9986 48.3818 25.1264C47.1237 26.3846 44.6691 27.8788 42.9019 27.0138C42.6956 29.3163 42.1814 31.4012 41.0096 32.7118C37.7776 36.3265 30.5293 37.5 25.2613 37.5C19.9933 37.5 13.0598 36.3265 9.82792 32.7118C8.955 31.7354 8.41537 30.3291 8.08392 28.7236C6.62483 29.2787 4.81998 28.8965 3.74329 27.9278C2.39998 26.7192 0.429132 23.9564 0.501962 21.287C0.56525 18.9691 2.5519 15.6207 3.691 13.2026C4.79854 10.8514 6.90292 8.37974 8.36751 7.34738C10.0019 6.19535 11.379 4.95623 12.6602 5.72948C15.8617 2.50278 20.3245 0.500032 25.2613 0.5Z" fill="white"/>
          <path d="M25.2613 0.5V0H25.2613L25.2613 0.5ZM37.174 5.07144L36.8386 5.44224L37.1292 5.70507L37.4538 5.4858L37.174 5.07144ZM42.1753 6.19708L42.4302 5.76692L42.4302 5.76691L42.1753 6.19708ZM47.205 11.1188L46.762 11.3507V11.3507L47.205 11.1188ZM50.4998 19.295L50.9998 19.2994V19.2994L50.4998 19.295ZM48.3818 25.1264L48.7353 25.48L48.7354 25.48L48.3818 25.1264ZM42.9019 27.0138L43.1217 26.5647L42.4687 26.2452L42.4038 26.9692L42.9019 27.0138ZM41.0096 32.7118L41.3823 33.045L41.3823 33.045L41.0096 32.7118ZM25.2613 37.5L25.2613 38H25.2613V37.5ZM9.82792 32.7118L9.45517 33.045L9.45518 33.045L9.82792 32.7118ZM8.08392 28.7236L8.57359 28.6225L8.45488 28.0475L7.90612 28.2562L8.08392 28.7236ZM3.74329 27.9278L3.40886 28.2995H3.40886L3.74329 27.9278ZM0.501962 21.287L0.00214824 21.2733L0.00214794 21.2734L0.501962 21.287ZM3.691 13.2026L4.14332 13.4157L4.14333 13.4157L3.691 13.2026ZM8.36751 7.34738L8.07945 6.9387L8.07944 6.9387L8.36751 7.34738ZM12.6602 5.72948L12.4018 6.15756L12.7383 6.36064L13.0151 6.08165L12.6602 5.72948ZM25.0674 27.0529L25.4292 26.7079L24.9463 26.2014L24.6237 26.8225L25.0674 27.0529ZM19.9792 27.5003C19.7455 27.3533 19.4368 27.4235 19.2898 27.6572C19.1427 27.891 19.2129 28.1997 19.4467 28.3467L19.713 27.9235L19.9792 27.5003ZM31.072 28.2945C31.2769 28.1094 31.2929 27.7932 31.1078 27.5883C30.9227 27.3834 30.6065 27.3674 30.4016 27.5525L30.7368 27.9235L31.072 28.2945ZM25.2613 0.5V1C29.7255 1 33.7892 2.68382 36.8386 5.44224L37.174 5.07144L37.5094 4.70064C34.2822 1.78136 29.9814 0 25.2613 0V0.5ZM37.174 5.07144L37.4538 5.4858C37.9269 5.16631 38.5787 5.15648 39.4049 5.4111C40.2225 5.66307 41.0983 6.14016 41.9205 6.62725L42.1753 6.19708L42.4302 5.76691C41.6038 5.2773 40.6398 4.74527 39.6994 4.45545C38.7675 4.16827 37.7428 4.08397 36.8942 4.65707L37.174 5.07144ZM42.1753 6.19708L41.9205 6.62725C43.4351 7.52464 45.6024 9.13622 46.762 11.3507L47.205 11.1188L47.6479 10.8869C46.3596 8.42647 44.0009 6.69754 42.4302 5.76692L42.1753 6.19708ZM47.205 11.1188L46.762 11.3507C47.4851 12.7317 48.2909 14.09 48.9367 15.4675C49.5785 16.8366 50.0101 18.1243 49.9998 19.2906L50.4998 19.295L50.9998 19.2994C51.0121 17.9029 50.5009 16.4483 49.8421 15.043C49.1871 13.6459 48.3342 12.1976 47.6479 10.8869L47.205 11.1188ZM50.4998 19.295L49.9998 19.2906C49.9906 20.337 49.7566 21.4554 49.3876 22.4482C49.0162 23.4473 48.5238 24.2773 48.0282 24.7729L48.3818 25.1264L48.7354 25.48C49.3674 24.8478 49.9241 23.8749 50.3249 22.7967C50.728 21.7122 50.9893 20.4788 50.9998 19.2994L50.4998 19.295ZM48.3818 25.1264L48.0282 24.7729C47.4367 25.3644 46.5605 26.0126 45.6367 26.4063C44.7018 26.8048 43.815 26.9041 43.1217 26.5647L42.9019 27.0138L42.6821 27.4629C43.7559 27.9885 44.9801 27.7732 46.0288 27.3263C47.0887 26.8745 48.0688 26.1466 48.7353 25.48L48.3818 25.1264ZM42.9019 27.0138L42.4038 26.9692C42.1993 29.2536 41.6942 31.1959 40.6369 32.3785L41.0096 32.7118L41.3823 33.045C42.6686 31.6064 43.192 29.379 43.3999 27.0584L42.9019 27.0138ZM41.0096 32.7118L40.6369 32.3785C39.1178 34.0774 36.6111 35.2417 33.7735 35.9774C30.9485 36.7097 27.8629 37 25.2613 37V37.5V38C27.9276 38 31.1002 37.7035 34.0244 36.9454C36.9359 36.1906 39.6694 34.9608 41.3823 33.045L41.0096 32.7118ZM25.2613 37.5L25.2613 37C22.6599 37 19.6543 36.7098 16.9098 35.9783C14.1552 35.244 11.7228 34.081 10.2007 32.3785L9.82792 32.7118L9.45518 33.045C11.1649 34.9573 13.8152 36.1883 16.6523 36.9445C19.4995 37.7034 22.5946 38 25.2613 38L25.2613 37.5ZM9.82792 32.7118L10.2007 32.3785C9.41318 31.4977 8.89757 30.1918 8.57359 28.6225L8.08392 28.7236L7.59424 28.8246C7.93317 30.4663 8.49683 31.9731 9.45517 33.045L9.82792 32.7118ZM8.08392 28.7236L7.90612 28.2562C6.62571 28.7434 5.01789 28.402 4.07771 27.5561L3.74329 27.9278L3.40886 28.2995C4.62207 29.391 6.62395 29.814 8.26171 29.1909L8.08392 28.7236ZM3.74329 27.9278L4.07771 27.5561C3.44859 26.99 2.65438 26.0413 2.02889 24.9128C1.4019 23.7816 0.968677 22.5138 1.00178 21.3006L0.501962 21.287L0.00214794 21.2734C-0.0375831 22.7296 0.478203 24.1779 1.15426 25.3976C1.8318 26.62 2.69467 27.6569 3.40886 28.2995L3.74329 27.9278ZM0.501962 21.287L1.00178 21.3006C1.03043 20.251 1.50283 18.9149 2.14855 17.4886C2.46741 16.7842 2.82045 16.0745 3.16766 15.3848C3.51308 14.6986 3.85496 14.0278 4.14332 13.4157L3.691 13.2026L3.23867 12.9895C2.95748 13.5864 2.62387 14.241 2.27444 14.9352C1.92681 15.6258 1.56565 16.3514 1.23755 17.0762C0.589349 18.508 0.0367771 20.0051 0.00214824 21.2733L0.501962 21.287ZM3.691 13.2026L4.14333 13.4157C5.21853 11.1331 7.27002 8.73271 8.65558 7.75606L8.36751 7.34738L8.07944 6.9387C6.53583 8.02676 4.37855 10.5697 3.23867 12.9895L3.691 13.2026ZM8.36751 7.34738L8.65557 7.75606C9.511 7.1531 10.2065 6.59798 10.8713 6.26296C11.5117 5.94023 11.9749 5.89992 12.4018 6.15756L12.6602 5.72948L12.9185 5.3014C12.0642 4.78579 11.1983 4.97841 10.4213 5.36994C9.66868 5.74918 8.85842 6.38963 8.07945 6.9387L8.36751 7.34738ZM12.6602 5.72948L13.0151 6.08165C16.1259 2.94635 20.4622 1.00003 25.2613 1L25.2613 0.5L25.2613 0C20.1867 3.34084e-05 15.5974 2.05921 12.3052 5.37731L12.6602 5.72948ZM25.0674 25.3118H24.5674V27.4882H25.0674H25.5674V25.3118H25.0674ZM25.0674 27.0529C24.6237 26.8225 24.6237 26.8224 24.6237 26.8223C24.6237 26.8223 24.6238 26.8223 24.6238 26.8222C24.6238 26.8222 24.6238 26.8222 24.6238 26.8222C24.6238 26.8222 24.6237 26.8224 24.6236 26.8227C24.6232 26.8233 24.6227 26.8244 24.6218 26.8259C24.6202 26.8291 24.6174 26.8343 24.6137 26.8412C24.6062 26.8552 24.5947 26.8764 24.5795 26.9039C24.5489 26.959 24.5035 27.0389 24.4455 27.1352C24.329 27.3289 24.1646 27.5843 23.971 27.8371C23.7751 28.0927 23.5616 28.3293 23.3495 28.4977C23.1293 28.6724 22.9666 28.7294 22.8626 28.7294V29.2294V29.7294C23.2958 29.7294 23.6772 29.5143 23.9712 29.281C24.2732 29.0412 24.5437 28.7338 24.7647 28.4453C24.988 28.1539 25.1734 27.8652 25.3024 27.6508C25.3672 27.5431 25.4185 27.4529 25.454 27.389C25.4717 27.357 25.4855 27.3315 25.4951 27.3135C25.4999 27.3046 25.5037 27.2975 25.5064 27.2924C25.5077 27.2899 25.5088 27.2879 25.5096 27.2864C25.51 27.2856 25.5103 27.285 25.5105 27.2845C25.5107 27.2842 25.5108 27.284 25.5109 27.2838C25.5109 27.2838 25.511 27.2837 25.511 27.2836C25.511 27.2835 25.5111 27.2834 25.0674 27.0529ZM22.8626 29.2294V28.7294C22.6798 28.7294 22.4127 28.6704 22.0842 28.5541C21.7648 28.4409 21.4247 28.2873 21.1085 28.1292C20.7935 27.9718 20.5099 27.8138 20.3046 27.6949C20.2022 27.6356 20.1199 27.5863 20.0636 27.5522C20.0355 27.5351 20.0139 27.5218 19.9995 27.513C19.9924 27.5085 19.9871 27.5052 19.9836 27.5031C19.9819 27.502 19.9807 27.5013 19.98 27.5008C19.9796 27.5006 19.9793 27.5004 19.9792 27.5003C19.9792 27.5003 19.9791 27.5003 19.9791 27.5003C19.9791 27.5003 19.9792 27.5003 19.9792 27.5003C19.9792 27.5003 19.9792 27.5003 19.713 27.9235C19.4467 28.3467 19.4467 28.3468 19.4468 28.3468C19.4468 28.3468 19.4469 28.3469 19.447 28.3469C19.4471 28.347 19.4472 28.3471 19.4474 28.3472C19.4478 28.3474 19.4483 28.3478 19.449 28.3482C19.4502 28.349 19.452 28.3501 19.4542 28.3515C19.4587 28.3543 19.4652 28.3583 19.4735 28.3634C19.4901 28.3737 19.5141 28.3885 19.5448 28.4071C19.6062 28.4444 19.6944 28.4971 19.8034 28.5602C20.0209 28.6862 20.3232 28.8547 20.6614 29.0237C20.9983 29.1921 21.3784 29.3649 21.7503 29.4967C22.1131 29.6252 22.5083 29.7294 22.8626 29.7294V29.2294ZM25.0674 27.0529C24.7055 27.398 24.7056 27.398 24.7056 27.3981C24.7057 27.3981 24.7057 27.3982 24.7058 27.3983C24.7059 27.3984 24.7061 27.3986 24.7063 27.3988C24.7066 27.3991 24.7071 27.3997 24.7077 27.4003C24.709 27.4016 24.7107 27.4034 24.7129 27.4057C24.7174 27.4104 24.7238 27.417 24.7321 27.4255C24.7486 27.4425 24.7725 27.4671 24.8031 27.498C24.8643 27.5599 24.9524 27.6477 25.0612 27.7527C25.2782 27.9623 25.5806 28.2432 25.9193 28.5253C26.256 28.8059 26.6393 29.0967 27.0175 29.3199C27.3776 29.5325 27.807 29.7294 28.217 29.7294V29.2294V28.7294C28.0899 28.7294 27.8571 28.6543 27.5259 28.4588C27.2128 28.2739 26.8758 28.0206 26.5594 27.757C26.245 27.4951 25.9613 27.2318 25.7557 27.0333C25.6532 26.9343 25.5707 26.852 25.5142 26.7949C25.486 26.7664 25.4643 26.7441 25.4498 26.7293C25.4426 26.7218 25.4373 26.7162 25.4338 26.7126C25.4321 26.7108 25.4308 26.7095 25.43 26.7087C25.4297 26.7083 25.4294 26.7081 25.4293 26.7079C25.4292 26.7079 25.4292 26.7078 25.4292 26.7078C25.4292 26.7078 25.4292 26.7078 25.4292 26.7078C25.4292 26.7079 25.4292 26.7079 25.0674 27.0529ZM28.217 29.2294V29.7294C28.5798 29.7294 28.9422 29.6211 29.2604 29.4852C29.5833 29.3472 29.8917 29.1673 30.1548 28.994C30.4192 28.8199 30.6464 28.6467 30.8074 28.5173C30.8882 28.4523 30.9529 28.3979 30.9981 28.3591C31.0207 28.3397 31.0385 28.3242 31.0509 28.3133C31.0572 28.3078 31.0621 28.3034 31.0656 28.3003C31.0673 28.2987 31.0688 28.2974 31.0698 28.2965C31.0704 28.296 31.0708 28.2956 31.0712 28.2953C31.0713 28.2951 31.0715 28.295 31.0716 28.2948C31.0717 28.2948 31.0718 28.2947 31.0718 28.2947C31.0719 28.2946 31.072 28.2945 30.7368 27.9235C30.4016 27.5525 30.4016 27.5525 30.4017 27.5524C30.4017 27.5524 30.4018 27.5524 30.4018 27.5523C30.4018 27.5523 30.4019 27.5523 30.4019 27.5523C30.4019 27.5523 30.4018 27.5523 30.4016 27.5525C30.4013 27.5528 30.4006 27.5534 30.3996 27.5543C30.3976 27.5561 30.3943 27.5591 30.3896 27.5631C30.3804 27.5713 30.366 27.5838 30.347 27.6002C30.3089 27.6328 30.2524 27.6804 30.1809 27.7379C30.0373 27.8533 29.836 28.0066 29.6047 28.1589C29.3722 28.3121 29.1178 28.4586 28.8675 28.5656C28.6126 28.6745 28.3914 28.7294 28.217 28.7294V29.2294Z" fill="black"/>
          <path d="M21.5 18.75C21.7761 18.75 22 18.9739 22 19.25C22 19.5261 21.7761 19.75 21.5 19.75C21.2239 19.75 21 19.5261 21 19.25C21 18.9739 21.2239 18.75 21.5 18.75ZM28.5 18.75C28.7761 18.75 29 18.9739 29 19.25C29 19.5261 28.7761 19.75 28.5 19.75C28.2239 19.75 28 19.5261 28 19.25C28 18.9739 28.2239 18.75 28.5 18.75Z" fill="black" stroke="black"/>
          <ellipse cx="25.5" cy="24.25" rx="6" ry="3" fill="black"/>
          </svg>
        </div>

        <div className="monster-bubble">{monsterBubble}</div>

        <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 10 }}>
          (當現實誘惑發生且防禦成功，點擊下方卡牌紀錄)
        </div>

        {hearts.map((heart) => (
          <div
            key={heart.id}
            className="floating-heart"
          >
            ❤️
          </div>
        ))}
      </div>

      <div className="card" style={{ background: "var(--ink)", color: "white", borderRadius: "var(--radius)" }}>
        <p style={{ fontSize: 11, opacity: 0.7 }}>盾牌防禦能量 (剩餘彈性)</p>
        <div style={{ fontFamily: "'StarPandaKids'", fontSize: 40, margin: "5px 0" }}>
          {remaining}
        </div>
        <div style={{ background: "rgba(210, 222, 229, 0.5)", height: 5, borderRadius: 3, overflow: "hidden" }}>
          <div
            style={{
              background: state.used > state.goal ? "var(--accent)" : "var(--green)",
              height: "100%",
              width: `${progress}%`,
              transition: "0.5s",
            }}
          />
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="text"
            className="btn"
            style={{
              flex: 1,
              background: "var(--bg)",
              textAlign: "left",
              marginBottom: 0,
              border: "1px solid var(--border)",
              cursor: "text",
            }}
            placeholder="輸入飲食... 例如：雞胸便當"
            value={foodInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFoodInput(e.target.value)}
          />
        </div>

        <div className="row" style={{ marginTop: 10, justifyContent: "space-between", alignItems: "flex-start" }}>
          <input
            type="file"
            accept="image/*"
            onChange={onFoodPhotoSelected}
            style={{ flex: 1, minWidth: 180 }}
          />
          <button className="btn btn-outline btn-sm" style={{ marginTop: 0 }} onClick={clearFoodPhoto}>
            掃描照片
          </button>
        </div>

        {state.pendingFoodPhotoDataUrl ? (
          <img
            src={state.pendingFoodPhotoDataUrl}
            alt=""
            style={{
              display: "block",
              width: "100%",
              marginTop: 10,
              borderRadius: 12,
              border: "1px solid var(--border)",
            }}
          />
        ) : null}

        <div className="divider" />
        <div style={{ fontWeight: 900, fontSize: 13 }}>營養（比卡路里重要）</div>
        <div className="muted" style={{ marginTop: 8 }}>
          我會依照你輸入的食物名稱自動估算 P/F/C（蛋白質/脂肪/碳水）。
        </div>

        <div className="row" style={{ marginTop: 10, justifyContent: "space-between" }}>
          <div>
            <span className="muted">本次預估</span>{" "}
            <span style={{ fontWeight: 900 }}>{foodEstimate}</span>
          </div>
        </div>

        <div className="row" style={{ marginTop: 10, justifyContent: "space-between", alignItems: "center" }}>
          <input
            className="field"
            inputMode="decimal"
            placeholder="熱量 kcal（選填，留空則估算）"
            style={{ flex: 1, minWidth: 180 }}
            value={foodKcalInput}
            onChange={(e) => setFoodKcalInput(e.target.value)}
          />
          <button
            className="btn btn-outline btn-sm"
            style={{ marginTop: 0 }}
            onClick={() => setFoodKcalInput("")}
          >
            紀錄熱量
          </button>
        </div>

        <button className="btn btn-accent" style={{ marginTop: 10 }} onClick={addFood}>
          記錄飲食
        </button>

        <button className="btn btn-outline" onClick={toggleSleep}>
          {state.isSleeping ? "🌙 睡眠中（起床按我）" : "💤 準備睡覺"}
        </button>
      </div>

      {(excess > 0 || dueReminders.length > 0) && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div className="muted">熱量超過與補償</div>
              <div style={{ fontWeight: 900, fontSize: 15, marginTop: 4 }}>
                {excess > 0 ? `今日已超標 ${excess} kcal（選 1 個補償就好）` : `今天沒有超標，但你有 ${dueReminders.length} 則提醒`}
              </div>
            </div>
            <button className="btn btn-outline btn-sm" style={{ marginTop: 0 }} onClick={refreshCompPlans}>
              換一組
            </button>
          </div>

          <div className="divider" />

          {dueReminders.map((r) => (
            <div key={r.id} className="card notice" style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 900, fontSize: 13 }}>⏰ 今天提醒你</div>
              <div style={{ marginTop: 6, color: "var(--ink2)", fontSize: 13, lineHeight: 1.4 }}>
                {r.text}
              </div>
              <div className="row" style={{ marginTop: 10, justifyContent: "space-between" }}>
                <div className="muted">（完成後點一下）</div>
                <button className="btn btn-accent btn-sm" style={{ marginTop: 0 }} onClick={() => markReminderDone(r.id)}>
                  我完成了
                </button>
              </div>
            </div>
          ))}

          {excess > 0 ? (
            <>
              <div style={{ fontWeight: 900, fontSize: 13 }}>補償方案（點一下選取）</div>
              <div className="row" style={{ marginTop: 10 }}>
                {compPlans.map((p) => (
                  <button
                    key={p.id}
                    className={`btn-chip ${state.compensation.selectedPlanId === p.id ? "active" : ""}`}
                    onClick={() => selectCompPlan(p.id)}
                  >
                    {p.text}
                  </button>
                ))}
              </div>

              <div className="muted" style={{ marginTop: 10 }}>
                提示：若你選到「明天…」類型，我會自動在明天提醒你。
              </div>

              <div className="divider" />

              <div>
                <div style={{ fontWeight: 900, fontSize: 13 }}>拍照認證（可選）</div>
                <div className="muted" style={{ marginTop: 4 }}>
                  上傳你完成補償的證明照，會保存在本機瀏覽器。
                </div>

                <div className="row" style={{ marginTop: 10, justifyContent: "space-between", alignItems: "flex-start" }}>
                  <input type="file" accept="image/*" onChange={onProofSelected} style={{ flex: 1, minWidth: 180 }} key="proofPhoto" />
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: 0 }}
                    onClick={clearCompProof}
                    disabled={!state.compensation.proofDataUrl}
                  >
                    清除
                  </button>
                  <button
                    className="btn btn-accent btn-sm"
                    style={{ marginTop: 0 }}
                    onClick={completeCompensation}
                    disabled={!state.compensation.selectedPlanId}
                  >
                    完成補償
                  </button>
                </div>

                {state.compensation.proofDataUrl ? (
                  <img
                    src={state.compensation.proofDataUrl}
                    alt=""
                    style={{
                      display: "block",
                      width: "100%",
                      marginTop: 10,
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                    }}
                  />
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}