import { useState } from "react";
import Icon from "./Icon";

export default function MemberModal({ member, members, onSave, onClose }) {
  const [f, setF] = useState(member || {
    first_name: "", last_name: "Додеровић", birth_year: "", death_year: "",
    gender: "male", spouse_id: null, notes: "", parent_ids: [],
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const others = members.filter(m => m.id !== f.id);

  const handleSave = async () => {
    if (!f.first_name) return;
    setSaving(true);
    await onSave(f);
    setSaving(false);
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <span className="modal-title">{member ? "Uredi člana" : "Dodaj novog člana"}</span>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Ime</label>
              <input className="form-input" value={f.first_name} onChange={e => set("first_name", e.target.value)} placeholder="npr. Марко" />
            </div>
            <div className="form-field">
              <label className="form-label">Prezime</label>
              <input className="form-input" value={f.last_name} onChange={e => set("last_name", e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Pol</label>
              <select className="form-select" value={f.gender} onChange={e => set("gender", e.target.value)}>
                <option value="male">Muški</option>
                <option value="female">Ženski</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Supružnik</label>
              <select className="form-select" value={f.spouse_id || ""} onChange={e => set("spouse_id", e.target.value ? parseInt(e.target.value) : null)}>
                <option value="">— bez supružnika —</option>
                {others.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">God. rođenja</label>
              <input className="form-input" type="number" value={f.birth_year || ""} onChange={e => set("birth_year", e.target.value || null)} placeholder="npr. 1920" />
            </div>
            <div className="form-field">
              <label className="form-label">God. smrti</label>
              <input className="form-input" type="number" value={f.death_year || ""} onChange={e => set("death_year", e.target.value || null)} placeholder="prazno ako je živ/a" />
            </div>
            <div className="form-field full">
              <label className="form-label">Roditelji</label>
              <select
                className="form-select"
                multiple
                style={{ height: 80 }}
                value={(f.parent_ids || []).map(String)}
                onChange={e => set("parent_ids", Array.from(e.target.selectedOptions, o => parseInt(o.value)))}
              >
                {others.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
              </select>
              <span style={{ fontSize: ".62rem", color: "#999", marginTop: 3 }}>Ctrl+klik za više roditelja</span>
            </div>
            <div className="form-field full">
              <label className="form-label">Beleške</label>
              <textarea className="form-textarea" value={f.notes || ""} onChange={e => set("notes", e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Otkaži</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><Icon name="spinner" size={14} />Čuvanje...</> : (member ? "Sačuvaj" : "Dodaj člana")}
          </button>
        </div>
      </div>
    </div>
  );
}
