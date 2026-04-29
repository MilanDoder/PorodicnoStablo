import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const todayStr = () => new Date().toISOString().split("T")[0];
const EMPTY    = { message: "", expires_at: "" };

function formatDate(d) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}.`;
}

export default function AnnouncementsAdmin({ currentUser }) {
  const [list, setList]         = useState([]);
  const [form, setForm]         = useState(EMPTY);
  const [editId, setEditId]     = useState(null);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const formRef                 = useRef(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("expires_at", { ascending: false });
    setList(data || []);
  };

  const reset = () => { setForm(EMPTY); setEditId(null); setError(""); setSuccess(""); };

  const handleSave = async () => {
    setError(""); setSuccess("");
    if (!form.message.trim()) { setError("Текст обавјештења не смије бити празан."); return; }
    if (!form.expires_at)     { setError("Одаберите датум истека."); return; }

    setSaving(true);
    try {
      let result;
      if (editId) {
        result = await supabase
          .from("announcements")
          .update({ message: form.message.trim(), expires_at: form.expires_at })
          .eq("id", editId);
      } else {
        result = await supabase
          .from("announcements")
          .insert({
            message:    form.message.trim(),
            expires_at: form.expires_at,
            created_by: currentUser?.id ?? null,
          });
      }
      if (result.error) throw result.error;
      setSuccess(editId ? "Обавјештење је ажурирано." : "Обавјештење је додато.");
      reset();
      await load();
    } catch (e) {
      setError(e?.message || e?.details || JSON.stringify(e) || "Грешка при чувању.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ann) => {
    setEditId(ann.id);
    setForm({ message: ann.message, expires_at: ann.expires_at });
    setError(""); setSuccess("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Обрисати ово обавјештење?")) return;
    setDeleting(id);
    const result = await supabase.from("announcements").delete().eq("id", id);
    setDeleting(null);
    if (result.error) { setError(result.error.message); return; }
    if (editId === id) reset();
    setSuccess("Обавјештење је обрисано.");
    await load();
  };

  const active  = list.filter(a => a.expires_at >= todayStr());
  const expired = list.filter(a => a.expires_at <  todayStr());

  return (
    <div className="admin-wrap" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ФОРМА */}
      <div ref={formRef}>
        <div className="section-title" style={{ marginBottom: ".75rem" }}>
          {editId ? "✏️ Измијени обавјештење" : "➕ Ново обавјештење"}
        </div>
        <div className="ann-form-box">
          <div className="ann-form-field">
            <label className="ann-label">Текст обавјештења</label>
            <textarea
              className="ann-textarea"
              rows={3}
              placeholder="Унесите текст који ће се приказивати у траци..."
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            />
          </div>
          <div className="ann-form-field">
            <label className="ann-label">Датум истека</label>
            <input
              type="date"
              className="ann-input"
              value={form.expires_at}
              onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
            />
            <span style={{ fontSize: ".7rem", color: "#aaa" }}>Обавјештење нестаје послије овог датума.</span>
          </div>

          {error   && <div className="ann-msg ann-msg--error">⚠ {error}</div>}
          {success && <div className="ann-msg ann-msg--success">✓ {success}</div>}

          <div style={{ display: "flex", gap: ".6rem", marginTop: ".75rem" }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Чување..." : editId ? "Сачувај измене" : "Додај обавјештење"}
            </button>
            {editId && <button className="btn btn-ghost" onClick={reset}>Одустани</button>}
          </div>
        </div>
      </div>

      {/* АКТИВНА ОБАВЈЕШТЕЊА */}
      <div>
        <div className="section-title" style={{ marginBottom: ".75rem" }}>
          Активна обавјештења
          <span className="ann-count ann-count--active">{active.length}</span>
        </div>
        {active.length === 0
          ? <div className="ann-empty">Нема активних обавјештења.</div>
          : <div className="ann-list">
              {active.map(ann => (
                <AnnRow key={ann.id} ann={ann} isEditing={editId === ann.id}
                  deleting={deleting === ann.id} onEdit={() => handleEdit(ann)}
                  onDelete={() => handleDelete(ann.id)} active />
              ))}
            </div>
        }
      </div>

      {/* ИСТЕКЛА ОБАВЈЕШТЕЊА */}
      {expired.length > 0 && (
        <div>
          <div className="section-title" style={{ marginBottom: ".75rem", opacity: .55 }}>
            Истекла обавјештења
            <span className="ann-count ann-count--expired">{expired.length}</span>
          </div>
          <div className="ann-list">
            {expired.map(ann => (
              <AnnRow key={ann.id} ann={ann} isEditing={editId === ann.id}
                deleting={deleting === ann.id} onEdit={() => handleEdit(ann)}
                onDelete={() => handleDelete(ann.id)} active={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnnRow({ ann, isEditing, deleting, onEdit, onDelete, active }) {
  return (
    <div className={[
      "ann-row",
      !active   ? "ann-row--expired" : "",
      isEditing ? "ann-row--editing" : "",
    ].filter(Boolean).join(" ")}>
      <div className={`ann-pill ${active ? "ann-pill--active" : "ann-pill--expired"}`}>
        {active ? "●" : "○"}
      </div>
      <div className="ann-row-body">
        <div className="ann-row-msg">{ann.message}</div>
        <div className="ann-row-meta">
          <span>Креирано: {formatDate(ann.created_at?.split("T")[0])}</span>
          <span className={active ? "ann-expires" : "ann-expires ann-expires--past"}>
            {active ? `Истиче: ${formatDate(ann.expires_at)}` : `Истекло: ${formatDate(ann.expires_at)}`}
          </span>
        </div>
      </div>
      <div className="ann-row-actions">
        <button className="ann-btn ann-btn--edit"   onClick={onEdit}   disabled={deleting}>Измијени</button>
        <button className="ann-btn ann-btn--delete" onClick={onDelete} disabled={deleting}>
          {deleting ? "..." : "Обриши"}
        </button>
      </div>
    </div>
  );
}
