import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";

const TYPE_LABELS = { member: "Нови члан", member_edit: "Измјена члана", gallery: "Фотографија", history: "Прича", announcement: "Обавештење" };
const TYPE_ICONS  = { member: "👤", member_edit: "✏️", gallery: "🖼️", history: "📖", announcement: "📢" };

export default function AdminRequestsView({ members, onMemberAdded }) {
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [processing, setProcessing] = useState(null);
  const [noteMap, setNoteMap]       = useState({});
  const [filterStatus, setFilterStatus] = useState("pending");
  const [filterType, setFilterType] = useState("all");
  const [clearing,    setClearing]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => { loadRequests(); }, [filterStatus]);

  const loadRequests = async () => {
    setLoading(true);
    const q = supabase.from("data_requests").select("*").order("created_at", { ascending: true });
    if (filterStatus !== "all") q.eq("status", filterStatus);
    const { data } = await q;
    setRequests(data || []);
    setLoading(false);
  };

  const handleDecision = async (req, decision) => {
    setProcessing(req.id);
    const adminNote = noteMap[req.id] || null;
    const type = req.request_type || "member";

    if (decision === "approved") {
      if (type === "member") {
        const { data: newMember } = await supabase.from("members").insert({
          first_name: req.first_name, last_name: req.last_name,
          gender: req.gender, birth_year: req.birth_year,
          death_year: req.death_year, notes: req.notes,
          spouse_id: req.spouse_id || null,
          generational_line: req.generational_line || null,
          featured: false,
        }).select().single();
        const parentIds = Array.isArray(req.parent_ids) ? req.parent_ids : [];
        if (newMember && parentIds.length > 0) {
          await supabase.from("member_parents").insert(
            parentIds.map(pid => ({ member_id: newMember.id, parent_id: pid }))
          );
        }
        onMemberAdded?.();
      } else if (type === "member_edit") {
        await supabase.from("members").update({
          first_name: req.first_name,
          last_name:  req.last_name,
          birth_year: req.birth_year,
          death_year: req.death_year,
          notes:      req.notes || null,
        }).eq("id", req.edited_member_id);
        onMemberAdded?.();
      } else if (type === "gallery") {
        await supabase.from("gallery").insert({
          title: req.title, description: req.content || null,
          image_data: req.image_data, image_type: req.image_type || "image/jpeg",
          photo_year: req.photo_year || null,
        });
      } else if (type === "history") {
        await supabase.from("history_stories").insert({
          title: req.title, content: req.content,
          cover_image: req.image_data || null, image_type: req.image_type || "image/jpeg",
          story_date: req.story_date || null,
          have_pdf: req.have_pdf || false,
          pdf_data: req.have_pdf ? (req.pdf_data || null) : null,
        });
      } else if (type === "announcement") {
        await supabase.from("announcements").insert({
          message:    req.content,
          expires_at: req.expires_at,
        });
      }
    }

    await supabase.from("data_requests").update({
      status: decision, admin_note: adminNote,
      reviewed_at: new Date().toISOString(),
    }).eq("id", req.id);

    setProcessing(null);
    loadRequests();
  };

  const handleClearResolved = async () => {
    setClearing(true);
    await supabase.from("data_requests").delete().in("status", ["approved", "rejected"]);
    setClearing(false);
    setShowConfirm(false);
    loadRequests();
  };

  const parentNames = (parentIds) => {
    const ids = Array.isArray(parentIds) ? parentIds : [];
    return ids.map(pid => { const m = members.find(x => x.id === pid); return m ? `${m.first_name} ${m.last_name}` : `#${pid}`; }).join(", ") || "—";
  };

  const filtered = filterType === "all"
    ? requests
    : requests.filter(r => (r.request_type || "member") === filterType);

  const resolvedCount = requests.filter(r => r.status === "approved" || r.status === "rejected").length;

  if (loading) return <div style={{ textAlign: "center", padding: "3rem", color: "#aaa" }}><Icon name="spinner" size={24} /></div>;

  return (
    <div className="req-wrap">

      {/* Status tabs */}
      <div style={{ display: "flex", gap: ".4rem", marginBottom: ".75rem", borderBottom: "1px solid rgba(200,150,62,.12)", paddingBottom: ".75rem", alignItems: "center", flexWrap: "wrap" }}>
        {[
          { id: "pending",  label: "На чекању" },
          { id: "approved", label: "Одобрени" },
          { id: "rejected", label: "Одбијени" },
          { id: "all",      label: "Сви" },
        ].map(s => (
          <button key={s.id}
            className={`btn btn-sm ${filterStatus === s.id ? "btn-primary" : "btn-ghost"}`}
            onClick={() => { setFilterStatus(s.id); setFilterType("all"); }}
          >{s.label}</button>
        ))}

        <button
          className="btn btn-sm btn-danger"
          style={{ marginLeft: "auto", opacity: resolvedCount === 0 ? .4 : 1 }}
          onClick={() => resolvedCount > 0 && setShowConfirm(true)}
          disabled={resolvedCount === 0 || clearing}
          title={resolvedCount === 0 ? "Нема ријешених захтјева" : ""}
        >
          <Icon name="trash" size={11} />
          Обриши ријешене ({resolvedCount})
        </button>
      </div>

      {/* Type filter */}
      <div style={{ display: "flex", gap: ".4rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: ".6rem", color: "#bbb", letterSpacing: ".08em", textTransform: "uppercase", marginRight: ".2rem" }}>Tip:</span>
        {[
          { id: "all",          label: "Сви",         icon: null },
          { id: "member",       label: "Нови члан",   icon: "👤" },
          { id: "member_edit",  label: "Измјена",     icon: "✏️" },
          { id: "gallery",      label: "Фотографија", icon: "🖼️" },
          { id: "history",      label: "Прича",       icon: "📖" },
          { id: "announcement", label: "Обавештење",  icon: "📢" },
        ].map(t => {
          const cnt = t.id === "all" ? requests.length : requests.filter(r => (r.request_type || "member") === t.id).length;
          return (
            <button key={t.id}
              className={`btn btn-sm ${filterType === t.id ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setFilterType(t.id)}
            >
              {t.icon && `${t.icon} `}{t.label} ({cnt})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <div className="empty-state-text">Нема захтјева</div>
        </div>
      ) : filtered.map(req => {
        const type   = req.request_type || "member";
        const isPending = req.status === "pending";
        return (
          <div key={req.id} className="req-card">
            <div className="req-card-head">
              <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: ".6rem", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gold-dark)" }}>
                  {TYPE_ICONS[type]} {TYPE_LABELS[type]}
                </span>
                <span className="req-card-name">
                  {type === "member"
                    ? `${req.first_name} ${req.last_name}`
                    : type === "announcement"
                      ? (req.content?.slice(0, 80) || req.title)
                      : req.title}
                </span>
                {!isPending && (
                  <span style={{
                    fontSize: ".6rem", padding: ".15rem .5rem", letterSpacing: ".05em",
                    background: req.status === "approved" ? "#e8f5e9" : "#fce8e8",
                    color:      req.status === "approved" ? "#2e7d32" : "#b71c1c",
                    border:     `1px solid ${req.status === "approved" ? "#a5d6a7" : "#ef9a9a"}`,
                  }}>
                    {req.status === "approved" ? "✓ Odobreno" : "✗ Odbijeno"}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: ".2rem" }}>
                <span className="req-card-meta">{new Date(req.created_at).toLocaleDateString("sr-Latn")}</span>
                {req.user_email && <span className="req-card-meta" style={{ fontSize: ".6rem" }}>📧 {req.user_email}</span>}
              </div>
            </div>

            <div className="req-card-body">
              {type === "member" && <>
                <div className="req-field"><div className="req-field-key">Пол</div>{req.gender === "male" ? "Мушки" : "Женски"}</div>
                <div className="req-field"><div className="req-field-key">Годиште</div>{req.birth_year || "—"}</div>
                <div className="req-field"><div className="req-field-key">Родитељи</div>{parentNames(req.parent_ids)}</div>
                {req.notes && <div className="req-field" style={{ gridColumn: "1/-1" }}><div className="req-field-key">Биљешка</div>{req.notes}</div>}
              </>}

              {type === "member_edit" && <>
                {(() => {
                  const orig = members.find(m => m.id === req.edited_member_id);
                  return orig ? (
                    <div className="req-field" style={{ gridColumn: "1/-1", background: "#fffbe6", padding: ".4rem .6rem", border: "1px solid #ffe082", borderRadius: 2 }}>
                      <div className="req-field-key" style={{ marginBottom: ".3rem" }}>Тренутни подаци</div>
                      <span>{orig.first_name} {orig.last_name}</span>
                      {orig.birth_year && <span style={{ color: "#999", marginLeft: ".5rem" }}>{orig.birth_year}{orig.death_year ? `–${orig.death_year}` : ""}</span>}
                    </div>
                  ) : null;
                })()}
                <div className="req-field"><div className="req-field-key">Ново име</div>{req.first_name} {req.last_name}</div>
                <div className="req-field"><div className="req-field-key">Год. рођења</div>{req.birth_year || "—"}</div>
                {req.death_year && <div className="req-field"><div className="req-field-key">Год. смрти</div>{req.death_year}</div>}
                {req.notes && <div className="req-field" style={{ gridColumn: "1/-1" }}><div className="req-field-key">Напомена</div>{req.notes}</div>}
              </>}

              {type === "gallery" && <>
                {req.image_data && (
                  <div style={{ gridColumn: "1/-1" }}>
                    <img src={`data:${req.image_type || "image/jpeg"};base64,${req.image_data}`} alt={req.title}
                      style={{ maxHeight: 160, maxWidth: "100%", objectFit: "cover", border: "1px solid rgba(200,150,62,.2)" }} />
                  </div>
                )}
                {req.photo_year && <div className="req-field"><div className="req-field-key">Година</div>{req.photo_year}.</div>}
                {req.content && <div className="req-field" style={{ gridColumn: "1/-1" }}><div className="req-field-key">Опис</div>{req.content}</div>}
              </>}

              {type === "history" && <>
                {req.image_data && (
                  <div style={{ gridColumn: "1/-1" }}>
                    <img src={`data:${req.image_type || "image/jpeg"};base64,${req.image_data}`} alt={req.title}
                      style={{ maxHeight: 120, maxWidth: "100%", objectFit: "cover", border: "1px solid rgba(200,150,62,.2)" }} />
                  </div>
                )}
                {req.story_date && <div className="req-field"><div className="req-field-key">Датум</div>{new Date(req.story_date).toLocaleDateString("sr-Latn")}</div>}
                {req.content && <div className="req-field" style={{ gridColumn: "1/-1" }}><div className="req-field-key">Текст</div><div style={{ maxHeight: 120, overflow: "auto", fontSize: ".78rem", lineHeight: 1.5 }}>{req.content}</div></div>}
                {req.have_pdf && (
                  <div className="req-field" style={{ gridColumn: "1/-1" }}>
                    <div className="req-field-key">📄 PDF документ</div>
                    {req.pdf_data ? (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ marginTop: ".3rem" }}
                        onClick={() => {
                          const bytes = atob(req.pdf_data);
                          const arr   = new Uint8Array(bytes.length);
                          for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
                          const url = URL.createObjectURL(new Blob([arr], { type: "application/pdf" }));
                          const a = document.createElement("a");
                          a.href = url; a.download = `${req.title}.pdf`; a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        📄 Прегледај / Скини PDF
                      </button>
                    ) : (
                      <span style={{ fontSize: ".75rem", color: "#aaa" }}>PDF придружен захтјеву</span>
                    )}
                  </div>
                )}
              </>}

              {type === "announcement" && <>
                <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: ".5rem" }}>
                  <div className="req-field">
                    <div className="req-field-key">Tekst obaveštenja</div>
                    <div style={{ fontSize: ".92rem", fontFamily: "'Cormorant Garamond',serif", lineHeight: 1.6, color: "var(--ink)", marginTop: ".2rem" }}>{req.content}</div>
                  </div>
                  {req.expires_at && (
                    <div className="req-field">
                      <div className="req-field-key">Predloženi datum isteka</div>
                      <div>{req.expires_at}</div>
                    </div>
                  )}
                </div>
              </>}

              {req.admin_note && (
                <div className="req-field" style={{ gridColumn: "1/-1", background: "#fffbe6", padding: ".4rem .6rem", border: "1px solid #ffe082" }}>
                  <div className="req-field-key">Admin napomena</div>{req.admin_note}
                </div>
              )}
            </div>

            {isPending && (
              <div className="req-card-foot" style={{ flexDirection: "column", gap: ".5rem" }}>
                <input
                  className="form-input"
                  placeholder="Админ напомена (опционо)..."
                  value={noteMap[req.id] || ""}
                  onChange={e => setNoteMap(p => ({ ...p, [req.id]: e.target.value }))}
                  style={{ fontSize: ".72rem" }}
                />
                <div style={{ display: "flex", gap: ".5rem", justifyContent: "flex-end" }}>
                  <button className="btn btn-danger btn-sm" disabled={!!processing} onClick={() => handleDecision(req, "rejected")}>
                    <Icon name="close" size={11} />Одбиј
                  </button>
                  <button className="btn btn-success btn-sm" disabled={!!processing} onClick={() => handleDecision(req, "approved")}>
                    <Icon name="check" size={11} />Одобри
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Confirm modal */}
      {showConfirm && (
        <div className="overlay" style={{ zIndex: 1300 }} onClick={e => e.target === e.currentTarget && setShowConfirm(false)}>
          <div className="modal" style={{ width: 420, textAlign: "center" }}>
            <div className="modal-head" style={{ justifyContent: "center", borderBottom: "none", paddingBottom: 0 }}>
              <span style={{ fontSize: "2rem" }}>🗑️</span>
            </div>
            <div className="modal-body" style={{ paddingTop: ".5rem" }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.2rem", marginBottom: ".75rem", color: "var(--ink)" }}>
                Обришите ријешене захтјеве
              </div>
              <p style={{ fontSize: ".82rem", color: "#666", lineHeight: 1.6, marginBottom: 0 }}>
                Да ли сте сигурни да желите да избришете свих <strong>{resolvedCount}</strong> odobrenih/odbijenih захтјева из базе?
                <br />
                <span style={{ color: "var(--rust)", fontSize: ".75rem" }}>Ова радња се не може поништити.</span>
              </p>
            </div>
            <div className="modal-foot" style={{ justifyContent: "center", gap: "1rem" }}>
              <button className="btn btn-ghost" onClick={() => setShowConfirm(false)} style={{ minWidth: 90 }}>
                Не
              </button>
              <button className="btn btn-danger" onClick={handleClearResolved} disabled={clearing} style={{ minWidth: 90 }}>
                {clearing ? "Брисање..." : "Да, обриши"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
