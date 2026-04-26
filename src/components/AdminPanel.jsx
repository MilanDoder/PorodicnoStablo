import { useState } from "react";
import AdminRequestsView from "./AdminRequestsView";

const TAB_STYLE_BASE = {
  padding: ".6rem 1rem", fontSize: ".68rem", letterSpacing: ".08em",
  textTransform: "uppercase", border: "none", background: "none",
  cursor: "pointer", transition: "all .15s", fontFamily: "'Josefin Sans',sans-serif",
};

export default function AdminPanel({ members, currentUser, onMemberAdded }) {
  const [subTab, setSubTab] = useState("stats");

  const males       = members.filter(x => x.gender === "male").length;
  const females     = members.filter(x => x.gender === "female").length;
  const deceased    = members.filter(x => x.death_year).length;

  const STATS = [
    ["🌳", members.length, "Чланова укупно"],
    ["👨", males,          "Мушких"],
    ["👩", females,        "Женских"],
    ["✝",  deceased,       "Преминулих"],
  ];

  const TABS = [
    { id: "stats",    label: "Статистика" },
    { id: "requests", label: "Листа захтјева" },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Sub-tab traka */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(200,150,62,.15)", background: "white", padding: "0 1.5rem", gap: ".1rem", flexShrink: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            style={{
              ...TAB_STYLE_BASE,
              borderBottom: `2px solid ${subTab === t.id ? "var(--gold)" : "transparent"}`,
              color: subTab === t.id ? "var(--gold-dark)" : "#aaa",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "stats" && (
        <div className="admin-wrap">
          <div className="stat-row">
            {STATS.map(([emoji, val, lbl]) => (
              <div className="stat-box" key={lbl}>
                <div style={{ fontSize: "1.5rem" }}>{emoji}</div>
                <div className="stat-val">{val}</div>
                <div className="stat-lbl">{lbl}</div>
              </div>
            ))}
          </div>

          <div className="section-title">Информације о документу</div>
          <div className="info-box">
            <div><strong>Извор:</strong> Porodično stablo Додеровићи — Пољана</div>
            <div><strong>Аутор:</strong> Мићо Обрадов Додеровић (do Novembra 1990. godine)</div>
            <div><strong>Допунио:</strong> Бранко Светозаров Додеровић (do Oktobra 2017. godine)</div>
            <div><strong>Напомена:</strong> *1 Тешо — брат по оцу &nbsp;|&nbsp; *2 Драган — брат по оцу</div>
            <div style={{ marginTop: ".5rem", color: "#888", fontSize: ".75rem" }}>
              Улоговани као: <strong>{currentUser?.email}</strong> · Рола: <strong>{currentUser?.profile?.role}</strong>
            </div>
          </div>
        </div>
      )}

      {subTab === "requests" && (
        <AdminRequestsView members={members} onMemberAdded={onMemberAdded} />
      )}
    </div>
  );
}
