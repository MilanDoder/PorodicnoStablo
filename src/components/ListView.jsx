import { useState } from "react";
import Icon from "./Icon";
import MemberTreeModal from "./MemberTreeModal";

export default function ListView({ members, isAdmin, onEdit, onDelete }) {
  const [q, setQ]           = useState("");
  const [treeRoot, setTreeRoot] = useState(null); // otvara MemberTreeModal

  const filtered = members.filter(m =>
    `${m.first_name} ${m.last_name}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="list-wrap">
      <div className="search-wrap">
        <span className="search-icon-abs"><Icon name="search" size={14} /></span>
        <input
          className="search-input"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Pretraži po imenu..."
        />
        <span style={{ fontSize: ".7rem", color: "#999" }}>{filtered.length} / {members.length}</span>
      </div>

      <table className="mtable">
        <thead>
          <tr>
            <th>Ime i prezime</th>
            <th>Pol</th>
            <th>Koleno</th>
            <th>Godišta</th>
            <th>Roditelji</th>
            <th>Djeca</th>
            <th>Stablo</th>
            {isAdmin && <th>Akcije</th>}
          </tr>
        </thead>
        <tbody>
          {filtered.map(m => {
            const parents  = members.filter(p => (m.parent_ids || []).includes(p.id));
            const children = members.filter(c => (c.parent_ids || []).includes(m.id));
            const hasChildren = children.length > 0;

            return (
              <tr key={m.id}>
                <td>
                  <strong>
                    {m.featured && <span style={{ color: "var(--gold)", marginRight: ".3rem" }}>★</span>}
                    {m.first_name} {m.last_name}
                  </strong>
                </td>
                <td>
                  <span className={`gbadge ${m.gender}`}>
                    {m.gender === "male" ? "👨 Muški" : "👩 Ženski"}
                  </span>
                </td>
                <td style={{ color: "var(--gold-dark)", fontWeight: 600 }}>
                  {m.generational_line ? `${m.generational_line}.` : <span style={{ color: "#ccc" }}>—</span>}
                </td>
                <td style={{ color: "#666" }}>
                  {m.birth_year || "?"}{m.death_year ? `–${m.death_year}` : ""}
                </td>
                <td style={{ fontSize: ".73rem" }}>
                  {parents.length > 0
                    ? parents.map(p => p.first_name).join(", ")
                    : <span style={{ color: "#ccc" }}>—</span>}
                </td>
                <td style={{ fontSize: ".73rem" }}>
                  {hasChildren ? children.length : <span style={{ color: "#ccc" }}>0</span>}
                </td>

                {/* ── Stablo dugme ── */}
                <td>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={!hasChildren ? { opacity: .3, cursor: "not-allowed", pointerEvents: "none" } : {}}
                    disabled={!hasChildren}
                    onClick={() => setTreeRoot(m)}
                    title={hasChildren ? `Prikaži stablo: ${m.first_name} ${m.last_name}` : "Nema potomaka"}
                  >
                    🌳
                  </button>
                </td>

                {isAdmin && (
                  <td>
                    <div style={{ display: "flex", gap: ".35rem" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => onEdit(m)}>
                        <Icon name="edit" size={11} />Uredi
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => { if (window.confirm(`Obrisati ${m.first_name}?`)) onDelete(m.id); }}
                      >
                        <Icon name="trash" size={11} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ── Popup stablo ── */}
      {treeRoot && (
        <MemberTreeModal
          root={treeRoot}
          allMembers={members}
          onClose={() => setTreeRoot(null)}
        />
      )}
    </div>
  );
}
