import { diaryItemsForToday, formatTime } from "@/lib/dietHelpers";
import { DietState } from "@/lib/types";

type Props = {
  state: DietState;
  setState: React.Dispatch<React.SetStateAction<DietState>>;
};

export default function DiaryPage({ state, setState }: Props) {
  const items = diaryItemsForToday(state);
  const usedToday = items.reduce((sum, x) => sum + (Number(x.kcal) || 0), 0);
  const proteinToday = items.reduce((sum, x) => sum + (Number(x.protein) || 0), 0);
  const fatToday = items.reduce((sum, x) => sum + (Number(x.fat) || 0), 0);
  const carbsToday = items.reduce((sum, x) => sum + (Number(x.carbs) || 0), 0);
  const limit = state.goal + state.flex;

  const deleteDiaryItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      history: prev.history.filter((h) => h.id !== id),
    }));
  };

  const deleteProofItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      history: prev.history.filter((h) => h.id !== id),
    }));
  };

  const proofs = state.history.filter(
    (h) => h.type === "comp_done" && h.proofDataUrl
  );

  return (
    <div className="page active">
      <h2 style={{ marginBottom: 16, fontFamily: "'StarPandaKids'" }}>今日吃了什麼</h2>

      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink3)" }}>今天累積</div>
            <div style={{ fontFamily: "'StarPandaKids'", fontSize: 34, lineHeight: 1.1 }}>
              <span>{usedToday}</span> kcal
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--ink3)" }}>距離目標＋彈性</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              <span>{Math.max(0, limit - usedToday)}</span> kcal
            </div>
          </div>
        </div>

        <div className="divider" />

        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div><span className="muted">蛋白質</span> <span style={{ fontWeight: 900 }}>{Math.round(proteinToday)}</span><span className="muted"> g</span></div>
          <div><span className="muted">脂肪</span> <span style={{ fontWeight: 900 }}>{Math.round(fatToday)}</span><span className="muted"> g</span></div>
          <div><span className="muted">碳水</span> <span style={{ fontWeight: 900 }}>{Math.round(carbsToday)}</span><span className="muted"> g</span></div>
        </div>
      </div>

      <div>
        {!items.length ? (
          <div className="card" style={{ color: "var(--ink2)" }}>
            今天還沒有記錄。去「戰鬥舞台」輸入你吃的東西吧。
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {item.photo ? (
                    <img
                      className="thumb"
                      src={item.photo}
                      alt=""
                    />
                  ) : null}

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 4 }}>
                      {formatTime(item.time)} ・ {item.kcal} kcal ・ P{item.protein} / F{item.fat} / C{item.carbs}g
                    </div>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-outline"
                style={{ width: "auto", padding: "10px 12px", marginTop: 0 }}
                onClick={() => deleteDiaryItem(item.id)}
              >
                刪除
              </button>
            </div>
          ))
        )}
      </div>

      <div style={{ height: 12 }} />
      <h2 style={{ margin: "6px 0 12px", fontFamily: "'StarPandaKids'", fontSize: 18 }}>
        補償打卡牆
      </h2>

      <div>
        {!proofs.length ? (
          <div className="card" style={{ color: "var(--ink2)" }}>
            目前還沒有補償打卡。完成補償並上傳照片後，會出現在這裡。
          </div>
        ) : (
          proofs.map((p) => (
            <div
              key={p.id}
              className="card"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {p.proofDataUrl ? <img className="thumb" src={p.proofDataUrl} alt="" /> : null}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.planText || "補償完成"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 4 }}>
                      {formatTime(p.time)} ・ 補償打卡
                    </div>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-outline"
                style={{ width: "auto", padding: "10px 12px", marginTop: 0 }}
                onClick={() => deleteProofItem(p.id)}
              >
                刪除
              </button>
            </div>
          ))
        )}
      </div>

      <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 10 }}>
        提示：你在「戰鬥舞台」記錄的飲食，會同步出現在這裡。
      </div>
    </div>
  );
}