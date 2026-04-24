import { useState, useRef, useEffect } from "react";
import Icon from "./Icon";

/**
 * ParentPicker — searchable lista za odabir roditelja
 * Props:
 *   members      — svi članovi
 *   selectedIds  — trenutno odabrani parent_ids (array brojeva)
 *   onChange     — callback(newIds)
 *   excludeId    — id člana koji se edituje (da ne može biti svoj roditelj)
 */
export default function ParentPicker({ members, selectedIds = [], onChange, excludeId }) {
  const [q, setQ] = useState("");
  const inputRef  = useRef(null);

  const candidates = members.filter(m => {
    if (m.id === excludeId) return false;
    return true;
  });

  const filtered = q.trim()
    ? candidates.filter(m =>
        `${m.first_name} ${m.last_name}`.toLowerCase().includes(q.toLowerCase())
      )
    : candidates;

  // Sortiraj: selektovani prvi, pa po kolenu, pa po imenu
  const sorted = [...filtered].sort((a, b) => {
    const asel = selectedIds.includes(a.id);
    const bsel = selectedIds.includes(b.id);
    if (asel !== bsel) return asel ? -1 : 1;
    const ag = a.generational_line ?? 999;
    const bg = b.generational_line ?? 999;
    if (ag !== bg) return ag - bg;
    return a.first_name.localeCompare(b.first_name);
  });

  const toggle = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedMembers = members.filter(m => selectedIds.includes(m.id));

  return (
    <div className="pp-wrap">
      {/* Odabrani — prikazani kao tagovi */}
      {selectedMembers.length > 0 && (
        <div className="pp-tags">
          {selectedMembers.map(m => (
            <span key={m.id} className="pp-tag">
              {m.gender === "male" ? "👨" : "👩"} {m.first_name} {m.last_name}
              <button className="pp-tag-remove" onClick={() => toggle(m.id)}>×</button>
            </span>
          ))}
        </div>
      )}

      {/* Pretraga */}
      <div className="pp-search-wrap">
        <Icon name="search" size={13} />
        <input
          ref={inputRef}
          className="pp-search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Pretraži po imenu..."
        />
        {q && (
          <button className="pp-clear" onClick={() => setQ("")}>×</button>
        )}
      </div>

      {/* Lista */}
      <div className="pp-list">
        {sorted.length === 0 && (
          <div className="pp-empty">Nema rezultata</div>
        )}
        {sorted.map(m => {
          const isSelected = selectedIds.includes(m.id);
          return (
            <div
              key={m.id}
              className={`pp-item${isSelected ? " pp-item-sel" : ""}`}
              onClick={() => toggle(m.id)}
            >
              <div className="pp-item-check">
                {isSelected ? "✓" : ""}
              </div>
              <div className="pp-item-info">
                <div className="pp-item-name">
                  {m.gender === "male" ? "👨" : "👩"} {m.first_name} {m.last_name}
                </div>
                <div className="pp-item-meta">
                  {m.generational_line && (
                    <span className="pp-meta-koleno">{m.generational_line}. koleno</span>
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

      <div className="pp-count">
        {selectedIds.length === 0
          ? "Nije odabran nijedan roditelj"
          : `Odabrano: ${selectedMembers.map(m => m.first_name).join(", ")}`}
      </div>
    </div>
  );
}
