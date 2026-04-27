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

// ── Forma za dodavanje slike ───────────────────────────────────────────────
function AddImageForm({ onSaved, onClose }) {
  const [title,   setTitle]   = useState("");
  const [year,    setYear]    = useState("");
  const [desc,    setDesc]    = useState("");
  const [imgData, setImgData] = useState(null);
  const [imgType, setImgType] = useState("image/jpeg");
  const [preview, setPreview] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
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
    if (!title.trim() || !imgData || !year) { setError("Наслов, година и слика су обавезни"); return; }
    setSaving(true);
    const { error: e } = await supabase.from("seobe").insert({
      title: title.trim(),
      description: desc || null,
      year: parseInt(year),
      image_data: imgData,
      image_type: imgType,
    });
    setSaving(false);
    if (e) { setError("Грешка: " + e.message); return; }
    onSaved();
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 520 }}>
        <div className="modal-head">
          <span className="modal-title">Додај слику сеобе</span>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
          {error && <div className="media-error">{error}</div>}

          <div className="form-field">
            <label className="form-label">Наслов *</label>
            <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="нпр. Прва сеоба у Херцеговину" />
          </div>

          <div className="form-field">
            <label className="form-label">Година *</label>
            <input className="form-input" type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="нпр. 1880" />
          </div>

          <div className="form-field">
            <label className="form-label">Опис</label>
            <textarea className="form-textarea" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Кратак опис сеобе..." rows={3} />
          </div>

          <div className="form-field">
            <label className="form-label">Слика *</label>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
            <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current.click()}>
              <Icon name="image" size={13} /> Одабери слику
            </button>
            {preview && <img src={preview} alt="preview" className="media-preview" />}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Откажи</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><Icon name="spinner" size={14} />Чување...</> : "Додај слику"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Glavni prikaz slojeva ─────────────────────────────────────────────────
export default function SeoeView({ isAdmin }) {
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("seobe").select("*").order("year", { ascending: true });
    const rows = data || [];
    setItems(rows);
    // Defaultno sve izabrane
    setSelectedIds(new Set(rows.map(r => r.id)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleId = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleDelete = async (id) => {
    if (!confirm("Obrisati ovu sliku?")) return;
    await supabase.from("seobe").delete().eq("id", id);
    load();
  };

  // Samo selektovane, sortirane od najstarije ka najnovijoj
  const visible = items.filter(i => selectedIds.has(i.id));

  // Opacity logika: najstarija = 1.0, svaka novija je providnija
  // Najmlađa ima opacity 0.35 ako ih ima više, inače 1.0
  const getOpacity = (idx, total) => {
    if (total === 1) return 1;
    const MIN = 0.28;
    const MAX = 1.0;
    // idx 0 = najstarija (puna), idx total-1 = najnovija (najtransparentnija)
    return MAX - (MAX - MIN) * (idx / (total - 1));
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <Icon name="spinner" size={28} />
      </div>
    );
  }

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

        {/* Godina filteri */}
        <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap", flex: 1 }}>
          {items.map(item => {
            const on = selectedIds.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleId(item.id)}
                style={{
                  padding: ".25rem .65rem",
                  fontSize: ".65rem", fontFamily: "'Josefin Sans',sans-serif",
                  letterSpacing: ".08em", textTransform: "uppercase",
                  border: `1px solid ${on ? "var(--gold)" : "rgba(200,150,62,.25)"}`,
                  background: on ? "rgba(200,150,62,.12)" : "white",
                  color: on ? "var(--gold-dark)" : "#aaa",
                  cursor: "pointer", transition: "all .15s",
                }}
                title={item.title}
              >
                {item.year}.
              </button>
            );
          })}
        </div>

        {isAdmin && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
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

            {/* Legenda slojeva */}
            <div style={{
              display: "flex", gap: ".75rem", flexWrap: "wrap",
              padding: ".6rem 1rem", background: "white",
              border: "1px solid rgba(200,150,62,.18)",
              fontSize: ".65rem", color: "#777",
              letterSpacing: ".06em", alignItems: "center",
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

            {/* Složeni slojevi — apsolutno pozicionirani jedan preko drugog */}
            <div style={{ position: "relative", width: "100%" }}>
              {/* Container visina = visina prve (pune) slike */}
              {visible.map((item, idx) => {
                const opacity = getOpacity(idx, visible.length);
                const isOldest = idx === 0;

                return (
                  <div
                    key={item.id}
                    style={{
                      position: isOldest ? "relative" : "absolute",
                      top: 0, left: 0, width: "100%",
                      opacity,
                      zIndex: idx + 1,
                      mixBlendMode: idx === 0 ? "normal" : "multiply",
                    }}
                  >
                    <div style={{
                      background: "white",
                      border: "1px solid rgba(200,150,62,.2)",
                      boxShadow: `0 2px 12px rgba(26,16,8,${0.06 * opacity})`,
                      overflow: "hidden",
                    }}>
                      {/* Godina header */}
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
                          <button
                            onClick={() => handleDelete(item.id)}
                            style={{ background: "none", border: "none", color: "rgba(200,150,62,.4)", cursor: "pointer", padding: ".2rem" }}
                            title="Obriši"
                          >
                            <Icon name="close" size={14} />
                          </button>
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
        <AddImageForm
          onSaved={() => { setShowForm(false); load(); }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
