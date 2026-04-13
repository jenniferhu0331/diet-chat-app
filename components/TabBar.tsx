type Props = {
  tab: string;
  setTab: (tab: string) => void;
};

export default function TabBar({ tab, setTab }: Props) {
  const itemClass = (key: string) =>
    `tab-item ${tab === key ? "active" : ""}`;

  return (
    <div className="tab-bar">
      <div className={itemClass("home")} onClick={() => setTab("home")}>
        今天的阿姆阿姆
      </div>
      <div className={itemClass("diary")} onClick={() => setTab("diary")}>
        吃吃日記
      </div>
    </div>
  );
}