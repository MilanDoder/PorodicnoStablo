import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result.split(",")[1]);
    r.onerror = () => rej(new Error("Greška"));
    r.readAsDataURL(file);
  });
}

function StoryModal({ item, onClose }) {
  return (
    <div className="overlay" style={{ zIndex: 1100 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="story-modal">
        <div className="gallery-modal-head">
          <span className="modal-title">{item.title}</span>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        {item.cover_image && (
          <img src={`data:${item.image_type || "image/jpeg"};base64,${item.cover_image}`} alt={item.title} className="story-modal-img" />
        )}
        <div className="story-modal-body">
          {item.story_date && (
            <div className="story-modal-date">
              📅 {new Date(item.story_date).toLocaleDateString("sr-Latn", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          )}
          <div className="story-modal-content">{item.content}</div>
        </div>
      </div>
    </div>
  );
}

function StoryForm({ isAdmin, user, item, onSaved, onClose }) {
  const isEdit = !!item;
  const [title, setTitle]     = useState(item?.title || "");
  const [content, setContent] = useState(item?.content || "");
  const [date, setDate]       = useState(item?.story_date || "");
  const [imgData, setImgData] = useState(item?.cover_image || null);
  const [imgType, setImgType] = useState(item?.image_type || "image/jpeg");
  const [preview, setPreview] = useState(item?.cover_image ? `data:${item.image_type};base64,${item.cover_image}` : null);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const fileRef               = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setError("Slika mora biti manja od 3MB"); return; }
    setImgType(file.type || "image/jpeg");
    const b64 = await fileToBase64(file);
    setImgData(b64);
    setPreview(`data:${file.type};base64,${b64}`);
    setError("");
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) { setError("Naslov i tekst su obavezni"); return; }
    setSaving(true);
    try {
      if (isEdit) {
        const { error: e } = await supabase.from("history_stories").update({
          title, content, story_date: date || null,
          cover_image: imgData || null, image_type: imgType,
        }).eq("id", item.id);
        if (e) throw e;
      } else if (isAdmin) {
        const { error: e } = await supabase.from("history_stories").insert({
          title, content, story_date: date || null,
          cover_image: imgData || null, image_type: imgType,
          created_by: user.id,
        });
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from("data_requests").insert({
          request_type: "history", title, content,
          story_date: date || null,
          image_data: imgData || null, image_type: imgType,
          status: "pending", user_id: user.id, user_email: user.email,
        });
        if (e) throw e;
      }
      onSaved();
      onClose();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 540 }}>
        <div className="modal-head">
          <span className="modal-title">{isEdit ? "Uredi priču" : isAdmin ? "Dodaj priču" : "Pošalji priču na odobravanje"}</span>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-field full">
              <label className="form-label">Naslov priče *</label>
              <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="npr. Doselavanje u Poljanu" />
            </div>
            <div className="form-field full">
              <label className="form-label">Tekst priče *</label>
              <textarea className="form-textarea" value={content} onChange={e => setContent(e.target.value)} placeholder="Ispišite priču ovde..." rows={7} style={{ minHeight: 140 }} />
            </div>
            <div className="form-field">
              <label className="form-label">Datum događaja</label>
              <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Naslovna slika (opciono)</label>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
              <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => fileRef.current.click()}>
                <Icon name="image" size={13} />{preview ? "Promijeni" : "Dodaj sliku"}
              </button>
            </div>
            {preview && (
              <div className="form-field full">
                <img src={preview} alt="preview" style={{ width: "100%", maxHeight: 160, objectFit: "cover", border: "1px solid rgba(200,150,62,.2)" }} />
              </div>
            )}
            {error && <div className="form-field full" style={{ color: "var(--rust)", fontSize: ".75rem" }}>{error}</div>}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Otkaži</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Čuvanje..." : isEdit ? "Sačuvaj" : isAdmin ? "Dodaj priču" : "Pošalji zahtjev"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HistoryView({ isAdmin, user }) {
  const [stories, setStories]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [showAdd, setShowAdd]   = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("history_stories").select("*").order("story_date", { ascending: true });
    setStories(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Obrisati ovu priču?")) return;
    await supabase.from("history_stories").delete().eq("id", id);
    load();
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("sr-Latn", { year: "numeric", month: "long" }) : null;
  const excerpt = (text, len = 120) => text.length > len ? text.slice(0, len) + "..." : text;

  return (
    <div className="gallery-wrap">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <p className="gallery-intro" style={{ margin: 0 }}>Историјат и приче породице Додеровић</p>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={13} />{isAdmin ? "Dodaj priču" : "Pošalji priču"}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#ccc" }}><Icon name="spinner" size={28} /></div>
      ) : stories.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">📖</div><div className="empty-state-text">Još nema priča</div></div>
      ) : (
        <div className="gallery-grid">
          {stories.map(story => (
            <div key={story.id} className="gallery-item">
              {story.cover_image ? (
                <img src={`data:${story.image_type || "image/jpeg"};base64,${story.cover_image}`} alt={story.title} className="gallery-img" style={{ cursor: "pointer" }} onClick={() => setSelected(story)} />
              ) : (
                <div className="gallery-img-placeholder story-placeholder" style={{ cursor: "pointer" }} onClick={() => setSelected(story)}>📖</div>
              )}
              <div className="gallery-caption">
                <div className="gallery-caption-title" style={{ cursor: "pointer" }} onClick={() => setSelected(story)}>{story.title}</div>
                {story.story_date && <div className="gallery-caption-sub">📅 {formatDate(story.story_date)}</div>}
                <div className="gallery-caption-sub" style={{ marginTop: ".3rem", lineHeight: 1.5 }}>{excerpt(story.content)}</div>
                {isAdmin && (
                  <div style={{ display: "flex", gap: ".4rem", marginTop: ".6rem" }}>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => setEditItem(story)}>
                      <Icon name="edit" size={11} />Uredi
                    </button>
                    <button className="btn btn-danger btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => handleDelete(story.id)}>
                      <Icon name="trash" size={11} />Obriši
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && <StoryModal item={selected} onClose={() => setSelected(null)} />}
      {(showAdd || editItem) && (
        <StoryForm
          isAdmin={isAdmin} user={user}
          item={editItem || null}
          onSaved={load}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}
