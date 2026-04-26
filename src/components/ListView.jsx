import { useState, useRef } from "react";
import Icon from "./Icon";
import MemberTreeModal from "./MemberTreeModal";

const SORTS = [
  { key: "name",   label: "Име" },
  { key: "gender", label: "Пол" },
  { key: "gen",    label: "Кољено" },
  { key: "birth",  label: "Год. рођења" },
];

function cmp(a, b, sortKey, sortDir) {
  let av, bv;
  switch (sortKey) {
    case "name":   av = `${a.first_name} ${a.last_name}`.toLowerCase(); bv = `${b.first_name} ${b.last_name}`.toLowerCase(); break;
    case "gender": av = a.gender; bv = b.gender; break;
    case "gen":    av = a.generational_line ?? 9999; bv = b.generational_line ?? 9999; break;
    case "birth":  av = a.birth_year ?? 9999; bv = b.birth_year ?? 9999; break;
    default:       av = 0; bv = 0;
  }
  if (av < bv) return sortDir === "asc" ? -1 :  1;
  if (av > bv) return sortDir === "asc" ?  1 : -1;
  return 0;
}

export default function ListView({ members, isAdmin, onEdit, onDelete }) {
  const [q,        setQ]        = useState("");
  const [sortKey,  setSortKey]  = useState("name");
  const [sortDir,  setSortDir]  = useState("asc");
  const [treeRoot, setTreeRoot] = useState(null);

  // Ref mapa za scroll-to-row
  const rowRefs = useRef({});

  const scrollToMember = (id) => {
    const el = rowRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("row-highlight");
      setTimeout(() => el.classList.remove("row-highlight"), 1500);
    }
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = members
    .filter(m => `${m.first_name} ${m.last_name}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => cmp(a, b, sortKey, sortDir));

  const SortTh = ({ sk, children }) => (
    <th
      style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
      onClick={() => toggleSort(sk)}
    >
      {children}
      {sortKey === sk && (
        <span style={{ marginLeft: 4, opacity: 0.7 }}>
          {sortDir === "asc" ? "↑" : "↓"}
        </span>
      )}
    </th>
  );

  return (
    <div className="list-wrap">
      <style>{`
        .row-highlight { background: rgba(200,150,62,.18) !important; transition: background .3s; }
        .parent-link { background: none; border: none; padding: 0; color: var(--gold-dark);
          cursor: pointer; font-size: .73rem; text-decoration: underline dotted;
          font-family: inherit; }
        .parent-link:hover { color: var(--gold); }
      `}</style>

      <div className="search-wrap">
        <span className="search-icon-abs"><Icon name="search" size={14} /></span>
        <input
          className="search-input"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Претражи по имену..."
        />
        <span style={{ fontSize: ".7rem", color: "#999" }}>{filtered.length} / {members.length}</span>
      </div>

      <table className="mtable">
        <thead>
          <tr>
            <SortTh sk="name">Име и презиме</SortTh>
            <SortTh sk="gender">Пол</SortTh>
            <SortTh sk="gen">Кољено</SortTh>
            <SortTh sk="birth">Годишта</SortTh>
            <th>Родитељи</th>
            <th>Дјеца</th>
            <th>Стабло</th>
            {isAdmin && <th>Акције</th>}
          </tr>
        </thead>
        <tbody>
          {filtered.map(m => {
            const parents     = members.filter(p => (m.parent_ids || []).includes(p.id));
            const children    = members.filter(c => (c.parent_ids || []).includes(m.id));
            const hasChildren = children.length > 0;

            return (
              <tr key={m.id} ref={el => { if (el) rowRefs.current[m.id] = el; }}>
                <td>
                  <strong>
                    {m.featured && <span style={{ color: "var(--gold)", marginRight: ".3rem" }}>★</span>}
                    {m.first_name} {m.last_name}
                  </strong>
                </td>
                <td>
                  <span className={`gbadge ${m.gender}`}>
                    {m.gender === "male" ? "👨 Мушки" : "👩 Женски"}
                  </span>
                </td>
                <td style={{ color: "var(--gold-dark)", fontWeight: 600 }}>
                  {m.generational_line ? `${m.generational_line}.` : <span style={{ color: "#ccc" }}>—</span>}
                </td>
                <td style={{ color: "#666" }}>
                  {m.birth_year || "?"}{m.death_year ? `–${m.death_year}` : ""}
                </td>
                <td>
                  {parents.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {parents.map(p => (
                        <button
                          key={p.id}
                          className="parent-link"
                          onClick={() => scrollToMember(p.id)}
                          title={`Иди на: ${p.first_name} ${p.last_name}`}
                        >
                          {p.first_name} {p.last_name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: "#ccc" }}>—</span>
                  )}
                </td>
                <td style={{ fontSize: ".73rem" }}>
                  {hasChildren ? children.length : <span style={{ color: "#ccc" }}>0</span>}
                </td>
                <td>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={!hasChildren ? { opacity: .3, cursor: "not-allowed", pointerEvents: "none" } : {}}
                    disabled={!hasChildren}
                    onClick={() => setTreeRoot(m)}
                    title={hasChildren ? `Прикажи стабло: ${m.first_name} ${m.last_name}` : "Нема потомака"}
                  >
                    🌳
                  </button>
                </td>
                {isAdmin && (
                  <td>
                    <div style={{ display: "flex", gap: ".35rem" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => onEdit(m)}>
                        <Icon name="edit" size={11} />Уреди
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => { if (window.confirm(`Обрисати ${m.first_name}?`)) onDelete(m.id); }}
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
