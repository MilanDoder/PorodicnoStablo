import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";

const TYPE_LABELS = { member: "Član", gallery: "Fotografija", history: "Priča" };
const TYPE_ICONS  = { member: "👤", gallery: "🖼️", history: "📖" };

export default function AdminRequestsView({ members, onMemberAdded }) {
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [processing, setProcessing] = useState(null);
  const [noteMap, setNoteMap]     = useState({});
  const [filterType, setFilterType] = useState("all");

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("data_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setRequests(data || []);
    setLoading(false);
  };

  const handleDecision = async (req, decision) => {
    setProcessing(req.id);
    const adminNote = noteMap[req.id] || null;

    if (decision === "approved") {
      const type = req.request_type || "member";

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

  const parentNames = (parentIds) => {
    const ids = Array.isArray(parentIds) ? parentIds : [];
    return ids.map(pid => { const m = members.find(x => x.id === pid); return m ? `${m.first_name} ${m.last_name}` : `#${pid}`; }).join(", ") || "—";
  };

  const filtered = filterType === "all" ? requests : requests.filter(r => (r.request_type || "member") === filterType);

  if (loading) return <div style={{ textAlign: "center", padding: "3rem", color: "#aaa" }}><Icon name="spinner" size={24} /></div>;

  return (
    <div className="req-wrap">
      {/* Filter tab-ovi */}
      <div style={{ display: "flex", gap: ".5rem", marginBottom: "1rem" }}>
        {["all", "member", "gallery", "history"].map(t => (
          <button key={t} className={`btn btn-sm ${filterType === t ? "btn-primary" : "btn-ghost"}`} onClick={() => setFilterType(t)}>
            {t === "all" ? `Svi (${requests.length})` : `${TYPE_ICONS[t]} ${TYPE_LABELS[t]} (${requests.filter(r => (r.request_type || "member") === t).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-text">Nema zahtjeva na čekanju</div></div>
      ) : filtered.map(req => {
        const type = req.request_type || "member";
        return (
          <div key={req.id} className="req-card">
            <div className="req-card-head">
              <div>
                <span style={{ fontSize: ".6rem", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gold-dark)", marginRight: ".5rem" }}>
                  {TYPE_ICONS[type]} {TYPE_LABELS[type]}
                </span>
                <span className="req-card-name">
                  {type === "member" ? `${req.first_name} ${req.last_name}` : req.title}
                </span>
              </div>
              <span className="req-card-meta">{new Date(req.created_at).toLocaleDateString("sr-Latn")}</span>
            </div>

            <div className="req-card-body">
              {type === "member" && <>
                <div className="req-field"><div className="req-field-key">Pol</div>{req.gender === "male" ? "Muški" : "Ženski"}</div>
                <div className="req-field"><div className="req-field-key">Godište</div>{req.birth_year || "—"}</div>
                <div className="req-field"><div className="req-field-key">Roditelji</div>{parentNames(req.parent_ids)}</div>
                {req.notes && <div className="req-field" style={{ gridColumn: "1/-1" }}><div className="req-field-key">Beleška</div>{req.notes}</div>}
              </>}

              {type === "gallery" && <>
                {req.image_data && <div style={{ gridColumn: "1/-1" }}>
                  <img src={`data:${req.image_type || "image/jpeg"};base64,${req.image_data}`} alt={req.title} style={{ maxHeight: 160, maxWidth: "100%", objectFit: "cover", border: "1px solid rgba(200,150,62,.2)" }} />
                </div>}
                {req.photo_year && <div className="req-field"><div className="req-field-key">Godina</div>{req.photo_year}.</div>}
                {req.content && <div className="req-field" style={{ gridColumn: "1/-1" }}><div className="req-field-key">Opis</div>{req.content}</div>}
              </>}

              {type === "history" && <>
                {req.image_data && <div style={{ gridColumn: "1/-1" }}>
                  <img src={`data:${req.image_type || "image/jpeg"};base64,${req.image_data}`} alt={req.title} style={{ maxHeight: 120, maxWidth: "100%", objectFit: "cover", border: "1px solid rgba(200,150,62,.2)" }} />
                </div>}
                {req.story_date && <div className="req-field"><div className="req-field-key">Datum</div>{new Date(req.story_date).toLocaleDateString("sr-Latn")}</div>}
                {req.content && <div className="req-field" style={{ gridColumn: "1/-1" }}><div className="req-field-key">Tekst</div><div style={{ maxHeight: 120, overflow: "auto", fontSize: ".78rem", lineHeight: 1.5 }}>{req.content}</div></div>}
              </>}
            </div>

            <div className="req-card-foot" style={{ flexDirection: "column", gap: ".5rem" }}>
              <input
                className="form-input"
                placeholder="Admin napomena (opciono)..."
                value={noteMap[req.id] || ""}
                onChange={e => setNoteMap(p => ({ ...p, [req.id]: e.target.value }))}
                style={{ fontSize: ".72rem" }}
              />
              <div style={{ display: "flex", gap: ".5rem", justifyContent: "flex-end" }}>
                <button className="btn btn-danger btn-sm" disabled={!!processing} onClick={() => handleDecision(req, "rejected")}>
                  <Icon name="close" size={11} />Odbij
                </button>
                <button className="btn btn-success btn-sm" disabled={!!processing} onClick={() => handleDecision(req, "approved")}>
                  <Icon name="check" size={11} />Odobri
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
