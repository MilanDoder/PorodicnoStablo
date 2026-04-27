import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result.split(",")[1]);
    r.onerror = () => rej(new Error("Greška pri čitanju fajla"));
    r.readAsDataURL(file);
  });
}

// ── Forma za dodavanje i editovanje ───────────────────────────────────────
function ImageForm({ item, onSaved, onClose }) {
  const isEdit = !!item;
  const [title,   setTitle]   = useState(item?.title || "");
  const [year,    setYear]    = useState(item?.year || "");
  const [desc,    setDesc]    = useState(item?.description || "");
  const [imgData, setImgData] = useState(item?.image_data || null);
  const [imgType, setImgType] = useState(item?.image_type || "image/jpeg");
  const [preview, setPreview] = useState(
    item?.image_data ? `data:${item.image_type};base64,${item.image_data}` : null
  );
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { setError("Слика мора бити мања од 4MB"); return; }
    setImgType(file.type || "image/jpeg");
    const b64 = await fileToBase64(file);
    setImgData(b64);
    setPreview(`data:${file.type};base64,${b64}`);
    setError("");
  };

  const handleSave = async () => {
    if (!title.trim() || !year || !imgData) { setError("Наслов, година и слика су обавезни"); return; }
    setSaving(true);
    const payload = {
      title: title.trim(),
      description: desc || null,
      year: parseInt(year),
      image_data: imgData,
      image_type: imgType,
    };
    const { error: e } = isEdit
      ? await supabase.from("seobe").update(payload).eq("id", item.id)
      : await supabase.from("seobe").insert(payload);
    setSaving(false);
    if (e) { setError("Грешка: " + e.message); return; }
    onSaved();
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 520 }}>
        <div className="modal-head">
          <span className="modal-title">{isEdit ? "Уреди слику сеобе" : "Додај слику сеобе"}</span>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
          {error && <div className="media-error">{error}</div>}

          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Наслов *</label>
              <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="нпр. Прва сеоба у Херцеговину" autoFocus />
            </div>
            <div className="form-field">
              <label className="form-label">Година *</label>
              <input className="form-input" type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="нпр. 1880" />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Опис</label>
            <textarea className="form-textarea" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Кратак опис сеобе..." rows={3} />
          </div>

          <div className="form-field">
            <label className="form-label">Слика {isEdit ? "(оставите празно да задржите постојећу)" : "*"}</label>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
            <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current.click()}>
              <Icon name="image" size={13} /> {isEdit ? "Замијени слику" : "Одабери слику"}
            </button>
            {preview && (
              <img src={preview} alt="preview" className="media-preview" style={{ maxHeight: 160, objectFit: "contain" }} />
            )}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Откажи</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><Icon name="spinner" size={14} />Чување...</> : (isEdit ? "Сачувај измјене" : "Додај слику")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Glavni prikaz ─────────────────────────────────────────────────────────
export default function SeoeView({ isAdmin }) {
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [editItem,    setEditItem]    = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("seobe").select("*").order("year", { ascending: true });
    const rows = data || [];
    setItems(rows);
    setSelectedIds(new Set(rows.map(r => r.id)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleId = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleDelete = async (id, title) => {
    if (!confirm(`Obrisati "${title}"?`)) return;
    await supabase.from("seobe").delete().eq("id", id);
    load();
  };

  const visible = items.filter(i => selectedIds.has(i.id));

  const getOpacity = (idx, total) => {
    if (total === 1) return 1;
    return 1.0 - (1.0 - 0.28) * (idx / (total - 1));
  };

  if (loading) return <div className="loading-screen"><Icon name="spinner" size={28} /></div>;

  return (
    <div className="gallery-wrap" style={{ display: "flex", flexDirection: "column", gap: 0, padding: 0, overflow: "hidden", height: "100%" }}>

      {/* ── Toolbar ── */}
      <div style={{
        padding: ".75rem 1.5rem", background: "white",
        borderBottom: "1px solid rgba(200,150,62,.15)",
        display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", flexShrink: 0,
      }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.1rem", color: "var(--ink)", marginRight: ".5rem" }}>
          Сеобе
        </div>
        <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap", flex: 1 }}>
          {items.map(item => {
            const on = selectedIds.has(item.id);
            return (
              <button key={item.id} onClick={() => toggleId(item.id)} title={item.title} style={{
                padding: ".25rem .65rem", fontSize: ".65rem", fontFamily: "'Josefin Sans',sans-serif",
                letterSpacing: ".08em", textTransform: "uppercase",
                border: `1px solid ${on ? "var(--gold)" : "rgba(200,150,62,.25)"}`,
                background: on ? "rgba(200,150,62,.12)" : "white",
                color: on ? "var(--gold-dark)" : "#aaa",
                cursor: "pointer", transition: "all .15s",
              }}>
                {item.year}.
              </button>
            );
          })}
        </div>
        {isAdmin && (
          <button className="btn btn-primary btn-sm" onClick={() => { setEditItem(null); setShowForm(true); }}>
            <Icon name="plus" size={13} /> Додај слику
          </button>
        )}
      </div>

      {/* ── Prikaz slojeva ── */}
      <div style={{ flex: 1, overflow: "auto", padding: "1.5rem", background: "var(--cream)" }}>
        {visible.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🗺️</div>
            <div className="empty-state-text">Нема одабраних слика</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* Legenda */}
            <div style={{
              display: "flex", gap: ".75rem", flexWrap: "wrap", padding: ".6rem 1rem",
              background: "white", border: "1px solid rgba(200,150,62,.18)",
              fontSize: ".65rem", color: "#777", letterSpacing: ".06em", alignItems: "center",
            }}>
              <span style={{ color: "var(--gold-dark)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em" }}>Слојеви →</span>
              {visible.map((item, idx) => (
                <span key={item.id} style={{ display: "flex", alignItems: "center", gap: ".3rem" }}>
                  <span style={{
                    display: "inline-block", width: 28, height: 10,
                    background: `rgba(200,150,62,${getOpacity(idx, visible.length)})`,
                    border: "1px solid rgba(200,150,62,.3)",
                  }} />
                  {item.year}. — {item.title}
                </span>
              ))}
            </div>

            {/* Slojevi */}
            <div style={{ position: "relative", width: "100%" }}>
              {visible.map((item, idx) => {
                const opacity = getOpacity(idx, visible.length);
                const isOldest = idx === 0;
                return (
                  <div key={item.id} style={{
                    position: isOldest ? "relative" : "absolute",
                    top: 0, left: 0, width: "100%",
                    opacity, zIndex: idx + 1,
                    mixBlendMode: idx === 0 ? "normal" : "multiply",
                  }}>
                    <div style={{
                      background: "white", border: "1px solid rgba(200,150,62,.2)",
                      boxShadow: `0 2px 12px rgba(26,16,8,${0.06 * opacity})`, overflow: "hidden",
                    }}>
                      <div style={{
                        padding: ".4rem .9rem",
                        background: `rgba(26,16,8,${0.85 * opacity})`,
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}>
                        <div>
                          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1rem", color: "var(--gold-light)" }}>
                            {item.year}. — {item.title}
                          </span>
                          {item.description && (
                            <div style={{ fontSize: ".62rem", color: "rgba(200,150,62,.55)", marginTop: ".1rem" }}>{item.description}</div>
                          )}
                        </div>
                        {isAdmin && (
                          <div style={{ display: "flex", gap: ".3rem" }}>
                            <button
                              onClick={() => { setEditItem(item); setShowForm(true); }}
                              style={{ background: "none", border: "none", color: "rgba(200,150,62,.6)", cursor: "pointer", padding: ".2rem" }}
                              title="Уреди"
                            >
                              <Icon name="edit" size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.title)}
                              style={{ background: "none", border: "none", color: "rgba(200,150,62,.4)", cursor: "pointer", padding: ".2rem" }}
                              title="Обриши"
                            >
                              <Icon name="close" size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                      <img
                        src={`data:${item.image_type || "image/jpeg"};base64,${item.image_data}`}
                        alt={item.title}
                        style={{ width: "100%", display: "block", maxHeight: "70vh", objectFit: "contain", background: "#f0e8d4" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </div>

      {showForm && (
        <ImageForm
          item={editItem}
          onSaved={() => { setShowForm(false); setEditItem(null); load(); }}
          onClose={() => { setShowForm(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}
