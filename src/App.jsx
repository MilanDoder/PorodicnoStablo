import { FAMILY_SURNAME } from "./config";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";
import ParentPicker from "./ParentPicker";

const EMPTY_FORM = {
  first_name: "", last_name: FAMILY_SURNAME, gender: "male",
  birth_year: "", death_year: "", notes: "", parent_ids: [], spouse_name: "",
};

export default function RequestFormView({ user, members, onSuccess }) {
  const [f,       setF]       = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!f.first_name) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("data_requests").insert({
        user_id:     user.id,
        user_email:  user.email,
        first_name:  f.first_name,
        last_name:   f.last_name,
        gender:      f.gender,
        birth_year:  f.birth_year ? parseInt(f.birth_year) : null,
        death_year:  f.death_year ? parseInt(f.death_year) : null,
        notes:       f.notes || null,
        parent_ids:  f.parent_ids,
        spouse_name: f.spouse_name || null,
        status:      "pending",
      });
      if (error) { alert("Грешка при слању: " + error.message); return; }
      setSuccess(true);
      setF(EMPTY_FORM);
      setTimeout(() => setSuccess(false), 5000);
      onSuccess?.();
    } catch {
      alert("Неочекивана грешка. Покушајте поново.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="req-form-wrap">
      <div className="req-form-card">
        <div className="req-form-title">Пошаљите захтјев за унос члана</div>
        <p className="req-form-desc">
          Уколико знате податке о члану породице који није евидентиран, попуните форму испод.
          Администратор ће прегледати ваш захтјев и одлучити да ли се унесе у стабло.
        </p>

        {success && (
          <div className="req-success">✓ Захтјев је успјешно послат! Администратор ће га прегледати.</div>
        )}

        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">Ime *</label>
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
            <label className="form-label">Год. рођења</label>
            <input className="form-input" type="number" value={f.birth_year} onChange={e => set("birth_year", e.target.value)} placeholder="нпр. 1955" />
          </div>
          <div className="form-field">
            <label className="form-label">Год. смрти</label>
            <input className="form-input" type="number" value={f.death_year} onChange={e => set("death_year", e.target.value)} placeholder="празно ако је жив/а" />
          </div>
          <div className="form-field">
            <label className="form-label">Супружник</label>
            <input
              className="form-input"
              value={f.spouse_name || ""}
              onChange={e => set("spouse_name", e.target.value)}
              placeholder="Ime и презиме супружника"
            />
          </div>
          <div className="form-field full">
            <label className="form-label">Родитељи (из стабла)</label>
            <ParentPicker members={members} selectedIds={f.parent_ids || []} onChange={ids => set("parent_ids", ids)} />
          </div>
          <div className="form-field full">
            <label className="form-label">Напомена / Извор података</label>
            <textarea className="form-textarea" value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="Опишите везу или извор ових података..." />
          </div>
        </div>

        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || !f.first_name}>
            {saving
              ? <><Icon name="spinner" size={14} />Слање...</>
              : <><Icon name="send" size={14} />Пошаљи захтјев</>}
          </button>
        </div>
      </div>
    </div>
  );
}
