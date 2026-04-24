import { useState } from "react";
import Icon from "./Icon";

export default function ParentPicker({ members, selectedIds = [], onChange, excludeId }) {
  const [q, setQ] = useState("");

  const candidates = members.filter(m => m.id !== excludeId);

  const filtered = q.trim()
    ? candidates.filter(m =>
        `${m.first_name} ${m.last_name}`.toLowerCase().includes(q.toLowerCase())
      )
    : candidates;

  const sorted = [...filtered].sort((a, b) => {
    const ag = a.generational_line ?? 999;
    const bg = b.generational_line ?? 999;
    if (ag !== bg) return ag - bg;
    return a.first_name.localeCompare(b.first_name);
  });

  const selectedMember = members.find(m => selectedIds.includes(m.id));

  const select = (m) => { onChange([m.id]); setQ(""); };
  const clear  = () => onChange([]);

  return (
    <div className="pp-wrap">
      {selectedMember ? (
        <div className="pp-tags">
          <span className="pp-tag">
            {selectedMember.gender === "male" ? "👨" : "👩"} {selectedMember.first_name} {selectedMember.last_name}
            {selectedMember.birth_year && <span style={{ opacity: .6, marginLeft: ".3rem" }}>{selectedMember.birth_year}</span>}
            <button className="pp-tag-remove" onClick={clear}>×</button>
          </span>
        </div>
      ) : null}

      <div className="pp-search-wrap">
        <Icon name="search" size={13} />
        <input
          className="pp-search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={selectedMember ? "Промијени родитеља..." : "Претражи по имену..."}
        />
        {q && <button className="pp-clear" onClick={() => setQ("")}>×</button>}
      </div>

      <div className="pp-list">
        {sorted.length === 0 && (
          <div className="pp-empty">Нема резултата</div>
        )}
        {sorted.map(m => {
          const isSel = selectedIds.includes(m.id);
          return (
            <div
              key={m.id}
              className={`pp-item${isSel ? " pp-item-sel" : ""}`}
              onClick={() => select(m)}
            >
              <div className="pp-item-check">{isSel ? "✓" : ""}</div>
              <div className="pp-item-info">
                <div className="pp-item-name">
                  {m.gender === "male" ? "👨" : "👩"} {m.first_name} {m.last_name}
                </div>
                <div className="pp-item-meta">
                  {m.generational_line && (
                    <span className="pp-meta-koleno">{m.generational_line}. кољено</span>
                  )}
                  {m.birth_year && (
                    <span className="pp-meta-year">
                      {m.birth_year}{m.death_year ? `–${m.death_year}` : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!selectedMember && (
        <div className="pp-count">Није одабран родитељ</div>
      )}
    </div>
  );
}
