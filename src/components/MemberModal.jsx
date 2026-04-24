import { useState } from "react";
import Icon from "./Icon";
import ParentPicker from "./ParentPicker";

function memberLabel(m, members) {
  const otac   = members.find(p => (m.parent_ids || []).includes(p.id) && p.gender === "male");
  const godina = m.birth_year ? ` · ${m.birth_year}.` : "";
  const imeOca = otac ? ` (${otac.first_name})` : "";
  return `${m.first_name} ${m.last_name}${imeOca}${godina}`;
}

export default function MemberModal({ member, members, onSave, onClose }) {
  const existingChildIds = member
    ? members.filter(m => (m.parent_ids || []).includes(member.id)).map(m => m.id)
    : [];

  const [f, setF] = useState(member || {
    first_name: "", last_name: "Додеровић", birth_year: "", death_year: "",
    gender: "male", spouse_id: null, notes: "", parent_ids: [], generational_line: null,
    featured: false, featured_note: "",
  });
  const [childIds, setChildIds] = useState(existingChildIds);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const others = members.filter(m => m.id !== f.id);

  const handleSave = async () => {
    if (!f.first_name) return;
    setSaving(true);
    await onSave(f, childIds);
    setSaving(false);
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <span className="modal-title">{member ? "Уреди члана" : "Додај новог члана"}</span>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Име</label>
              <input className="form-input" value={f.first_name} onChange={e => set("first_name", e.target.value)} placeholder="нпр. Марко" />
            </div>
            <div className="form-field">
              <label className="form-label">Презиме</label>
              <input className="form-input" value={f.last_name} onChange={e => set("last_name", e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Пол</label>
              <select className="form-select" value={f.gender} onChange={e => set("gender", e.target.value)}>
                <option value="male">Мушки</option>
                <option value="female">Женски</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Супружник</label>
              <select className="form-select" value={f.spouse_id || ""} onChange={e => set("spouse_id", e.target.value ? parseInt(e.target.value) : null)}>
                <option value="">— без супружника —</option>
                {others.map(m => <option key={m.id} value={m.id}>{memberLabel(m, members)}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Год. рођења</label>
              <input className="form-input" type="number" value={f.birth_year || ""} onChange={e => set("birth_year", e.target.value || null)} placeholder="нпр. 1920" />
            </div>
            <div className="form-field">
              <label className="form-label">Год. смрти</label>
              <input className="form-input" type="number" value={f.death_year || ""} onChange={e => set("death_year", e.target.value || null)} placeholder="празно ако је жив/а" />
            </div>
            <div className="form-field">
              <label className="form-label">Кољено</label>
              <input className="form-input" type="number" value={f.generational_line || ""} onChange={e => set("generational_line", e.target.value ? parseInt(e.target.value) : null)} placeholder="нпр. 3" />
            </div>

            {/* ── Istaknuti član ── */}
            <div className="form-field" style={{ display: "flex", alignItems: "center", gap: ".6rem", paddingTop: "1.4rem" }}>
              <input
                type="checkbox"
                id="featured-check"
                checked={!!f.featured}
                onChange={e => set("featured", e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "var(--gold)", cursor: "pointer" }}
              />
              <label htmlFor="featured-check" className="form-label" style={{ margin: 0, cursor: "pointer" }}>
                ★ Истакнути члан
              </label>
            </div>

            {f.featured && (
              <div className="form-field full">
                <label className="form-label">★ Посебна напомена (истакнути члан)</label>
                <textarea
                  className="form-textarea"
                  value={f.featured_note || ""}
                  onChange={e => set("featured_note", e.target.value)}
                  placeholder="Кратка напомена која ће бити истакнута уз име овог члана..."
                  rows={3}
                />
              </div>
            )}

            <div className="form-field full">
              <label className="form-label">Родитељ</label>
              <ParentPicker
                members={others}
                selectedIds={f.parent_ids || []}
                onChange={ids => set("parent_ids", ids)}
                excludeId={f.id}
              />
            </div>

            {member && (
              <div className="form-field full">
                <label className="form-label">Дјеца</label>
                <select
                  className="form-select"
                  multiple
                  style={{ height: 100 }}
                  value={childIds.map(String)}
                  onChange={e => setChildIds(Array.from(e.target.selectedOptions, o => parseInt(o.value)))}
                >
                  {others.map(m => (
                    <option key={m.id} value={m.id}>{memberLabel(m, members)}</option>
                  ))}
                </select>
                <span style={{ fontSize: ".62rem", color: "#999", marginTop: 3 }}>
                  Ctrl+клик за више дјеце · тренутно: {childIds.length === 0 ? "нема" : others.filter(m => childIds.includes(m.id)).map(m => m.first_name).join(", ")}
                </span>
              </div>
            )}

            <div className="form-field full">
              <label className="form-label">Биљешке</label>
              <textarea className="form-textarea" value={f.notes || ""} onChange={e => set("notes", e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Откажи</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><Icon name="spinner" size={14} />Чување...</> : (member ? "Сачувај" : "Додај члана")}
          </button>
        </div>
      </div>
    </div>
  );
}
