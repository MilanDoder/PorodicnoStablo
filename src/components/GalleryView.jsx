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

function ImageModal({ item, onClose }) {
  return (
    <div className="overlay" style={{ zIndex: 1100 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="gallery-modal">
        <div className="gallery-modal-head">
          <span className="modal-title">{item.title}</span>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <img src={`data:${item.image_type || "image/jpeg"};base64,${item.image_data}`} alt={item.title} className="gallery-modal-img" />
        {(item.description || item.photo_year) && (
          <div className="gallery-modal-body">
            {item.photo_year && <div className="gallery-modal-year">📅 {item.photo_year}. godina</div>}
            {item.description && <p className="gallery-modal-desc">{item.description}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function PhotoForm({ isAdmin, user, item, onSaved, onClose }) {
  const isEdit = !!item;
  const [title, setTitle]     = useState(item?.title || "");
  const [desc, setDesc]       = useState(item?.description || "");
  const [year, setYear]       = useState(item?.photo_year || "");
  const [imgData, setImgData] = useState(item?.image_data || null);
  const [imgType, setImgType] = useState(item?.image_type || "image/jpeg");
  const [preview, setPreview] = useState(item?.image_data ? `data:${item.image_type};base64,${item.image_data}` : null);
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
    if (!title.trim() || !imgData) { setError("Naslov i slika su obavezni"); return; }
    setSaving(true);
    try {
      if (isEdit) {
        const { error: e } = await supabase.from("gallery").update({
          title, description: desc || null,
          image_data: imgData, image_type: imgType,
          photo_year: year ? parseInt(year) : null,
        }).eq("id", item.id);
        if (e) throw e;
      } else if (isAdmin) {
        const { error: e } = await supabase.from("gallery").insert({
          title, description: desc || null,
          image_data: imgData, image_type: imgType,
          photo_year: year ? parseInt(year) : null,
          user_id: user.id,
        });
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from("data_requests").insert({
          request_type: "gallery", title, content: desc || null,
          image_data: imgData, image_type: imgType,
          photo_year: year ? parseInt(year) : null,
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
      <div className="modal" style={{ width: 480 }}>
        <div className="modal-head">
          <span className="modal-title">{isEdit ? "Uredi fotografiju" : isAdmin ? "Dodaj fotografiju" : "Pošalji fotografiju na odobravanje"}</span>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-field full">
              <label className="form-label">Naslov *</label>
              <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="npr. Porodično okuplanje 1985." />
            </div>
            <div className="form-field full">
              <label className="form-label">Fotografija * (max 3MB)</label>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
              <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => fileRef.current.click()}>
                <Icon name="image" size={14} />{preview ? "Promijeni sliku" : "Odaberi sliku"}
              </button>
              {preview && <img src={preview} alt="preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover", marginTop: ".5rem", border: "1px solid rgba(200,150,62,.2)" }} />}
            </div>
            <div className="form-field">
              <label className="form-label">Godina nastanka</label>
              <input className="form-input" type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="npr. 1985" />
            </div>
            <div className="form-field full">
              <label className="form-label">Opis</label>
              <textarea className="form-textarea" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Kratki opis fotografije..." rows={3} />
            </div>
            {error && <div className="form-field full" style={{ color: "var(--rust)", fontSize: ".75rem" }}>{error}</div>}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Otkaži</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Čuvanje..." : isEdit ? "Sačuvaj" : isAdmin ? "Dodaj" : "Pošalji zahtjev"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GalleryView({ isAdmin, user }) {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [showAdd, setShowAdd]   = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("gallery").select("*").order("photo_year", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Obrisati ovu fotografiju?")) return;
    await supabase.from("gallery").delete().eq("id", id);
    load();
  };

  return (
    <div className="gallery-wrap">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <p className="gallery-intro" style={{ margin: 0 }}>Фотографије и успомене породице Додеровић</p>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={13} />{isAdmin ? "Dodaj fotografiju" : "Pošalji fotografiju"}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#ccc" }}><Icon name="spinner" size={28} /></div>
      ) : items.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">🖼️</div><div className="empty-state-text">Još nema fotografija</div></div>
      ) : (
        <div className="gallery-grid">
          {items.map(item => (
            <div key={item.id} className="gallery-item">
              <img
                src={`data:${item.image_type || "image/jpeg"};base64,${item.image_data}`}
                alt={item.title}
                className="gallery-img"
                style={{ cursor: "pointer" }}
                onClick={() => setSelected(item)}
              />
              <div className="gallery-caption">
                <div className="gallery-caption-title" style={{ cursor: "pointer" }} onClick={() => setSelected(item)}>{item.title}</div>
                {item.photo_year && <div className="gallery-caption-sub">📅 {item.photo_year}. godina</div>}
                {item.description && <div className="gallery-caption-sub" style={{ marginTop: ".2rem" }}>{item.description}</div>}
                {isAdmin && (
                  <div style={{ display: "flex", gap: ".4rem", marginTop: ".6rem" }}>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => setEditItem(item)}>
                      <Icon name="edit" size={11} />Uredi
                    </button>
                    <button className="btn btn-danger btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => handleDelete(item.id)}>
                      <Icon name="trash" size={11} />Obriši
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && <ImageModal item={selected} onClose={() => setSelected(null)} />}
      {(showAdd || editItem) && (
        <PhotoForm
          isAdmin={isAdmin} user={user}
          item={editItem || null}
          onSaved={load}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}
