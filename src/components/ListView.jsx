import { useState, useRef } from "react";
import Icon from "./Icon";
import MemberTreeModal from "./MemberTreeModal";
import { supabase } from "../lib/supabase";
import { FAMILY_SURNAME } from "../config";

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

export default function ListView({ members, isAdmin, onEdit, onDelete, onAddMember, user }) {
  const [q,        setQ]        = useState("");
  const [sortKey,  setSortKey]  = useState("name");
  const [sortDir,  setSortDir]  = useState("asc");
  const [treeRoot,    setTreeRoot]    = useState(null);
  const [editRequest, setEditRequest] = useState(null);

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
            <th>Акције</th>
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
                <td>
                  <div style={{ display: "flex", gap: ".35rem" }}>
                    {isAdmin ? (
                      <>
                        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(m)}>
                          <Icon name="edit" size={11} />Уреди
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => { if (window.confirm(`Обрисати ${m.first_name}?`)) onDelete(m.id); }}
                        >
                          <Icon name="trash" size={11} />
                        </button>
                      </>
                    ) : user ? (
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditRequest(m)}>
                        <Icon name="edit" size={11} />Измени
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {editRequest && (
        <EditRequestModal
          member={editRequest}
          user={user}
          onClose={() => setEditRequest(null)}
        />
      )}

      {treeRoot && (
        <MemberTreeModal
          root={treeRoot}
          allMembers={members}
          onClose={() => setTreeRoot(null)}
          isAdmin={isAdmin}
          user={user}
          onEdit={(member) => { setTreeRoot(null); onEdit && onEdit(member); }}
          onAddMember={(parent) => { setTreeRoot(null); onAddMember && onAddMember(parent); }}
        />
      )}
    </div>
  );
}

// ── Modal za zahtjev izmjene člana ──────────────────────────────────────────
function EditRequestModal({ member, user, onClose }) {
  const [f, setF] = useState({
    first_name:  member.first_name  || "",
    last_name:   member.last_name   || FAMILY_SURNAME,
    birth_year:  member.birth_year  || "",
    death_year:  member.death_year  || "",
    notes:       member.notes       || "",
    spouse_name: "",
  });
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!f.first_name.trim()) { setError("Ime је обавезно."); return; }
    setSaving(true); setError("");
    try {
      const { error: err } = await supabase.from("data_requests").insert({
        request_type:     "member_edit",
        edited_member_id: member.id,
        title:            `Измјена: ${member.first_name} ${member.last_name}`,
        status:           "pending",
        user_id:          user?.id,
        user_email:       user?.email,
        first_name:       f.first_name.trim(),
        last_name:        f.last_name.trim(),
        birth_year:       f.birth_year ? parseInt(f.birth_year) : null,
        death_year:       f.death_year ? parseInt(f.death_year) : null,
        notes:            f.notes || null,
        spouse_name:      f.spouse_name || null,
      });
      if (err) throw err;
      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (e) {
      setError(e.message || "Грешка при слању.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" style={{ zIndex: 1200 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 500 }}>
        <div className="modal-head">
          <span className="modal-title">✏️ Предложи измјену — {member.first_name} {member.last_name}</span>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: ".75rem", color: "#888", marginBottom: "1rem", lineHeight: 1.6 }}>
            Промјене које унесете биће послате администратору на одобрење и неће бити одмах видљиве у стаблу.
          </p>

          {success ? (
            <div style={{ textAlign: "center", padding: "1.5rem 0", color: "#2e7d32", fontSize: "1rem" }}>
              ✓ Захтјев је послат администратору на одобрење!
            </div>
          ) : (
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Ime *</label>
                <input className="form-input" value={f.first_name} onChange={e => set("first_name", e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-label">Презиме</label>
                <input className="form-input" value={f.last_name} onChange={e => set("last_name", e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-label">Год. рођења</label>
                <input className="form-input" type="number" value={f.birth_year} onChange={e => set("birth_year", e.target.value)} placeholder="нпр. 1980" />
              </div>
              <div className="form-field">
                <label className="form-label">Год. смрти</label>
                <input className="form-input" type="number" value={f.death_year} onChange={e => set("death_year", e.target.value)} placeholder="оставити празно ако је жив/а" />
              </div>
              <div className="form-field full">
                <label className="form-label">Супружник</label>
                <input className="form-input" value={f.spouse_name} onChange={e => set("spouse_name", e.target.value)} placeholder="Ime и презиме супружника" />
              </div>
              <div className="form-field full">
                <label className="form-label">Напомена / Разлог измјене</label>
                <textarea className="form-textarea" rows={3} value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="Објасните зашто предлажете ову измјену..." />
              </div>
            </div>
          )}

          {error && <div style={{ color: "var(--rust)", fontSize: ".75rem", marginTop: ".5rem" }}>⚠ {error}</div>}
        </div>

        {!success && (
          <div className="modal-foot">
            <button className="btn btn-ghost" onClick={onClose}>Откажи</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? "Слање..." : "Пошаљи на одобрење"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
