import { FAMILY_SHORT } from "../config";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result.split(",")[1]);
    r.onerror = () => rej(new Error("Greška čitanja fajla"));
    r.readAsDataURL(file);
  });
}

function downloadPdf(base64Data, title) {
  const byteChars = atob(base64Data);
  const byteArr   = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
  const blob = new Blob([byteArr], { type: "application/pdf" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${title}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── StoryModal ────────────────────────────────────────────────────────────────
function StoryModal({ item, onClose }) {
  return (
    <div className="overlay" style={{ zIndex: 1100 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="story-modal">
        <div className="gallery-modal-head">
          <span className="modal-title">{item.title}</span>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>

        {item.cover_image && (
          <div style={{ background: "#0d0800", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <img
              src={`data:${item.image_type || "image/jpeg"};base64,${item.cover_image}`}
              alt={item.title}
              style={{ width: "100%", maxHeight: 420, objectFit: "contain", display: "block" }}
            />
          </div>
        )}

        <div className="story-modal-body">
          {item.story_date && (
            <div className="story-modal-date">
              📅 {new Date(item.story_date).toLocaleDateString("sr-Latn", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          )}
          <div className="story-modal-content">{item.content}</div>

          {item.have_pdf && item.pdf_data && (
            <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid rgba(200,150,62,.15)" }}>
              <button
                className="btn btn-ghost"
                style={{ display: "inline-flex", alignItems: "center", gap: ".4rem" }}
                onClick={() => downloadPdf(item.pdf_data, item.title)}
              >
                <Icon name="image" size={14} />
                Скини PDF документ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── StoryForm ─────────────────────────────────────────────────────────────────
function StoryForm({ isAdmin, user, item, onSaved, onClose }) {
  const isEdit = !!item;

  const [title,    setTitle]    = useState(item?.title      || "");
  const [content,  setContent]  = useState(item?.content    || "");
  const [date,     setDate]     = useState(item?.story_date || "");
  const [imgData,  setImgData]  = useState(item?.cover_image || null);
  const [imgType,  setImgType]  = useState(item?.image_type  || "image/jpeg");
  const [preview,  setPreview]  = useState(item?.cover_image ? `data:${item.image_type};base64,${item.cover_image}` : null);
  const [havePdf,  setHavePdf]  = useState(item?.have_pdf  || false);
  const [pdfData,  setPdfData]  = useState(item?.pdf_data  || null);
  const [pdfName,  setPdfName]  = useState(null);
  const [pdfSize,  setPdfSize]  = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState("");

  const imgRef = useRef();
  const pdfRef = useRef();

  const handleImgFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setError("Слика мора бити мања од 3MB"); return; }
    setImgType(file.type || "image/jpeg");
    const b64 = await fileToBase64(file);
    setImgData(b64);
    setPreview(`data:${file.type};base64,${b64}`);
    setError("");
  };

  const handlePdfFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError("PDF мора бити мањи од 10MB"); return; }
    const b64 = await fileToBase64(file);
    setPdfData(b64);
    setPdfName(file.name);
    setPdfSize((file.size / 1024).toFixed(0));
    setHavePdf(true);
    setError("");
  };

  const handleRemovePdf = () => {
    setPdfData(null);
    setPdfName(null);
    setPdfSize(null);
    setHavePdf(false);
    if (pdfRef.current) pdfRef.current.value = "";
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) { setError("Наслов и текст су обавезни"); return; }
    setSaving(true);
    setError("");

    try {
      const payload = {
        title:       title.trim(),
        content:     content.trim(),
        story_date:  date || null,
        cover_image: imgData || null,
        image_type:  imgType,
        have_pdf:    havePdf,
        pdf_data:    havePdf ? pdfData : null,
      };

      if (isEdit) {
        const { error: e } = await supabase.from("history_stories").update(payload).eq("id", item.id);
        if (e) throw e;
        onSaved();
        onClose();

      } else if (isAdmin) {
        const { error: e } = await supabase.from("history_stories").insert({ ...payload, created_by: user.id });
        if (e) throw e;
        onSaved();
        onClose();

      } else {
        // Korisnik — sve u jednom INSERT-u
        const { error: e } = await supabase.from("data_requests").insert({
          request_type: "history",
          title:        payload.title,
          content:      payload.content,
          story_date:   payload.story_date,
          image_data:   imgData || null,
          image_type:   imgType,
          have_pdf:     havePdf,
          pdf_data:     havePdf ? pdfData : null,
          status:       "pending",
          user_id:      user.id,
          user_email:   user.email,
        });
        if (e) throw e;

        // Prikaži success ekran, zatvori nakon 2.5s
        onSaved();
        setSuccess(true);
        setTimeout(() => onClose(), 2500);
        return;
      }

    } catch (err) {
      console.error("handleSave greška:", err);
      setError(err.message || err.details || err.hint || JSON.stringify(err) || "Грешка при чувању.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 540 }}>
        <div className="modal-head">
          <span className="modal-title">
            {isEdit ? "Уреди причу" : isAdmin ? "Додај причу" : "Пошаљи причу на одобравање"}
          </span>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>

        <div className="modal-body">
          {success ? (
            // ── Success ekran ─────────────────────────────────────────────
            <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
              <div style={{ fontSize: "2.8rem", marginBottom: ".75rem" }}>✓</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.3rem", fontWeight: 600, color: "var(--ink)", marginBottom: ".5rem" }}>
                Захтјев је послат!
              </div>
              <div style={{ fontSize: ".82rem", color: "#888", lineHeight: 1.7 }}>
                Ваша прича{havePdf ? " и PDF документ" : ""} послати су администратору на одобрење.<br />
                Бићете обавијештени када буде објављена.
              </div>
            </div>
          ) : (
            // ── Forma ─────────────────────────────────────────────────────
            <div className="form-grid">
              <div className="form-field full">
                <label className="form-label">Наслов приче *</label>
                <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="нпр. Досељење у Пољану" />
              </div>

              <div className="form-field full">
                <label className="form-label">Текст приче *</label>
                <textarea className="form-textarea" value={content} onChange={e => setContent(e.target.value)} placeholder="Испишите причу овде..." rows={7} style={{ minHeight: 140 }} />
              </div>

              <div className="form-field">
                <label className="form-label">Датум догађаја</label>
                <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>

              {/* Slika */}
              <div className="form-field">
                <label className="form-label">Насловна слика (опционо)</label>
                <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImgFile} />
                <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => imgRef.current.click()}>
                  <Icon name="image" size={13} />{preview ? "Промјени слику" : "Додај слику"}
                </button>
              </div>

              {preview && (
                <div className="form-field full">
                  <img src={preview} alt="preview" style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 4, border: "1px solid rgba(200,150,62,.2)" }} />
                </div>
              )}

              {/* PDF checkbox + upload */}
              <div className="form-field full" style={{ borderTop: "1px solid rgba(200,150,62,.12)", paddingTop: ".75rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: ".5rem", cursor: "pointer", userSelect: "none" }}>
                  <input
                    type="checkbox"
                    checked={havePdf}
                    onChange={e => {
                      setHavePdf(e.target.checked);
                      if (!e.target.checked) handleRemovePdf();
                    }}
                    style={{ width: 15, height: 15, accentColor: "var(--gold-dark)", cursor: "pointer" }}
                  />
                  <span className="form-label" style={{ margin: 0 }}>Документа (PDF) максимално до 1МB</span>
                </label>
              </div>

              {havePdf && (
                <div className="form-field full">
                  <input ref={pdfRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={handlePdfFile} />
                  {pdfData ? (
                    <div style={{ display: "flex", alignItems: "center", gap: ".5rem", padding: ".5rem .75rem", background: "rgba(200,150,62,.07)", borderRadius: 6, border: "1px solid rgba(200,150,62,.2)" }}>
                      <span style={{ fontSize: "1.1rem" }}>📄</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--ink)" }}>{pdfName || "Документ.pdf"}</div>
                        {pdfSize && <div style={{ fontSize: ".68rem", color: "#aaa" }}>{pdfSize} KB</div>}
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => pdfRef.current.click()}>Промјени</button>
                      <button className="btn btn-danger btn-sm" onClick={handleRemovePdf}>✕</button>
                    </div>
                  ) : (
                    <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => pdfRef.current.click()}>
                      <Icon name="image" size={13} />Изабери PDF фајл
                    </button>
                  )}
                </div>
              )}

              {error && (
                <div className="form-field full" style={{ color: "var(--rust)", fontSize: ".75rem" }}>⚠ {error}</div>
              )}
            </div>
          )}
        </div>

        {!success && (
          <div className="modal-foot">
            <button className="btn btn-ghost" onClick={onClose}>Откажи</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Слање..." : isEdit ? "Сачувај" : isAdmin ? "Додај причу" : "Пошаљи захтев"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── HistoryView ───────────────────────────────────────────────────────────────
export default function HistoryView({ isAdmin, user }) {
  const [stories,  setStories]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [showAdd,  setShowAdd]  = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("history_stories")
      .select("id, title, content, cover_image, image_type, story_date, created_at, have_pdf")
      .order("story_date", { ascending: true });
    setStories(data || []);
    setLoading(false);
  };

  const handleSelect = async (story) => {
    if (story.have_pdf) {
      const { data } = await supabase
        .from("history_stories")
        .select("pdf_data")
        .eq("id", story.id)
        .single();
      setSelected({ ...story, pdf_data: data?.pdf_data || null });
    } else {
      setSelected(story);
    }
  };

  const handleEdit = async (story) => {
    if (story.have_pdf) {
      const { data } = await supabase
        .from("history_stories")
        .select("pdf_data")
        .eq("id", story.id)
        .single();
      setEditItem({ ...story, pdf_data: data?.pdf_data || null });
    } else {
      setEditItem(story);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Обрисати ову причу?")) return;
    await supabase.from("history_stories").delete().eq("id", id);
    load();
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("sr-Latn", { year: "numeric", month: "long" }) : null;
  const excerpt    = (text, len = 120) => text.length > len ? text.slice(0, len) + "..." : text;

  return (
    <div className="gallery-wrap">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <p className="gallery-intro" style={{ margin: 0 }}>Историјат и приче породице {FAMILY_SHORT}</p>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={13} />{isAdmin ? "Додај причу" : "Пошаљи причу"}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#ccc" }}><Icon name="spinner" size={28} /></div>
      ) : stories.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">📖</div><div className="empty-state-text">Још нема прича</div></div>
      ) : (
        <div className="gallery-grid">
          {stories.map(story => (
            <div key={story.id} className="gallery-item">
              {story.cover_image ? (
                <img
                  src={`data:${story.image_type || "image/jpeg"};base64,${story.cover_image}`}
                  alt={story.title}
                  className="gallery-img"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSelect(story)}
                />
              ) : (
                <div className="gallery-img-placeholder story-placeholder" style={{ cursor: "pointer" }} onClick={() => handleSelect(story)}>📖</div>
              )}
              <div className="gallery-caption">
                <div className="gallery-caption-title" style={{ cursor: "pointer" }} onClick={() => handleSelect(story)}>{story.title}</div>
                {story.story_date && <div className="gallery-caption-sub">📅 {formatDate(story.story_date)}</div>}
                <div className="gallery-caption-sub" style={{ marginTop: ".3rem", lineHeight: 1.5 }}>{excerpt(story.content)}</div>

                {story.have_pdf && (
                  <PdfDownloadButton storyId={story.id} title={story.title} />
                )}

                {isAdmin && (
                  <div style={{ display: "flex", gap: ".4rem", marginTop: ".6rem" }}>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => handleEdit(story)}>
                      <Icon name="edit" size={11} />Уреди
                    </button>
                    <button className="btn btn-danger btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => handleDelete(story.id)}>
                      <Icon name="trash" size={11} />Обриши
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
          isAdmin={isAdmin}
          user={user}
          item={editItem || null}
          onSaved={load}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}

// ── Lazy PDF download ─────────────────────────────────────────────────────────
function PdfDownloadButton({ storyId, title }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("history_stories")
        .select("pdf_data")
        .eq("id", storyId)
        .single();
      if (data?.pdf_data) downloadPdf(data.pdf_data, title);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="btn btn-ghost btn-sm"
      style={{ marginTop: ".5rem", display: "inline-flex", alignItems: "center", gap: ".35rem" }}
      onClick={handleDownload}
      disabled={loading}
    >
      <Icon name="image" size={11} />
      {loading ? "Учитавање..." : "📄 PDF"}
    </button>
  );
}
