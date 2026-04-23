import { useState } from "react";
import Icon from "./Icon";

export default function ListView({ members, isAdmin, onEdit, onDelete }) {
  const [q, setQ] = useState("");

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
            <th>Godišta</th>
            <th>Roditelji</th>
            <th>Djeca</th>
            {isAdmin && <th>Akcije</th>}
          </tr>
        </thead>
        <tbody>
          {filtered.map(m => {
            const parents  = members.filter(p => (m.parent_ids || []).includes(p.id));
            const children = members.filter(c => (c.parent_ids || []).includes(m.id));
            return (
              <tr key={m.id}>
                <td><strong>{m.first_name} {m.last_name}</strong></td>
                <td>
                  <span className={`gbadge ${m.gender}`}>
                    {m.gender === "male" ? "👨 Muški" : "👩 Ženski"}
                  </span>
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
                  {children.length > 0 ? children.length : <span style={{ color: "#ccc" }}>0</span>}
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
    </div>
  );
}
