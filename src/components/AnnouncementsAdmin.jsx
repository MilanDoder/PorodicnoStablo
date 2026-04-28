import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const today = () => new Date().toISOString().split("T")[0];

const EMPTY_FORM = { message: "", expires_at: "" };

export default function AnnouncementsAdmin({ currentUser }) {
  const [list, setList]         = useState([]);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [editId, setEditId]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setList(data || []);
  };

  const resetForm = () => { setForm(EMPTY_FORM); setEditId(null); setError(""); setSuccess(""); };

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!form.message.trim())   { setError("Поље порука не сме бити празно."); return; }
    if (!form.expires_at)       { setError("Одаберите датум истека."); return; }
    if (form.expires_at < today()) { setError("Датум истека не може бити у прошлости."); return; }

    setLoading(true);
    try {
      if (editId) {
        const { error } = await supabase
          .from("announcements")
          .update({ message: form.message.trim(), expires_at: form.expires_at })
          .eq("id", editId);
        if (error) throw error;
        setSuccess("Обавештење је ажурирано.");
      } else {
        const { error } = await supabase
          .from("announcements")
          .insert({
            message:    form.message.trim(),
            expires_at: form.expires_at,
            created_by: currentUser?.id ?? null,
          });
        if (error) throw error;
        setSuccess("Обавештење је додато.");
      }
      resetForm();
      await load();
    } catch (e) {
      setError(e.message || "Грешка при чувању.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ann) => {
    setEditId(ann.id);
    setForm({ message: ann.message, expires_at: ann.expires_at });
    setError(""); setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Да ли сте сигурни да желите да обришете ово обавештење?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    await load();
    setSuccess("Обавештење је обрисано.");
  };

  const isExpired = (expires_at) => expires_at < today();

  return (
    <div className="admin-wrap">

      {/* ── Form ── */}
      <div className="section-title">{editId ? "Измени обавештење" : "Ново обавештење"}</div>
      <div className="ann-form-box">
        <div className="ann-form-field">
          <label className="ann-label">Текст обавештења</label>
          <textarea
            className="ann-textarea"
            rows={3}
            placeholder="Унесите текст обавештења..."
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          />
        </div>
        <div className="ann-form-field">
          <label className="ann-label">Датум истека</label>
          <input
            type="date"
            className="ann-input"
            min={today()}
            value={form.expires_at}
            onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
          />
        </div>

        {error   && <div className="ann-msg ann-msg--error">⚠ {error}</div>}
        {success && <div className="ann-msg ann-msg--success">✓ {success}</div>}

        <div style={{ display: "flex", gap: ".6rem", marginTop: ".5rem" }}>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Чување..." : editId ? "Сачувај измене" : "+ Додај обавештење"}
          </button>
          {editId && (
            <button className="btn btn-ghost" onClick={resetForm}>
              Одустани
            </button>
          )}
        </div>
      </div>

      {/* ── List ── */}
      <div className="section-title" style={{ marginTop: "1.5rem" }}>
        Постојећа обавештења
        <span style={{ fontSize: ".7rem", color: "#aaa", fontFamily: "sans-serif", fontWeight: 400, marginLeft: ".6rem" }}>
          ({list.length})
        </span>
      </div>

      {list.length === 0 ? (
        <div className="info-box" style={{ color: "#aaa", fontStyle: "italic" }}>
          Нема обавештења.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
          {list.map(ann => (
            <div key={ann.id} className={`ann-row${isExpired(ann.expires_at) ? " ann-row--expired" : ""}`}>
              <div className="ann-row-body">
                <div className="ann-row-msg">{ann.message}</div>
                <div className="ann-row-meta">
                  <span>Креирано: {new Date(ann.created_at).toLocaleDateString("sr-Latn")}</span>
                  <span className={`ann-expires${isExpired(ann.expires_at) ? " ann-expires--past" : ""}`}>
                    {isExpired(ann.expires_at) ? "⛔ Истекло" : "⏳ Истиче"}: {ann.expires_at}
                  </span>
                </div>
              </div>
              <div className="ann-row-actions">
                <button className="btn btn-ghost" style={{ fontSize: ".7rem", padding: ".3rem .7rem" }} onClick={() => handleEdit(ann)}>
                  Измени
                </button>
                <button
                  className="btn"
                  style={{ fontSize: ".7rem", padding: ".3rem .7rem", background: "#fee", color: "#c00", border: "1px solid #fcc" }}
                  onClick={() => handleDelete(ann.id)}
                >
                  Обриши
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
