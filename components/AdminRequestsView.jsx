import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";

export default function AdminRequestsView({ members, onMemberAdded }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [noteMap, setNoteMap] = useState({});

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
      const { data: newMember } = await supabase.from("members").insert({
        first_name: req.first_name,
        last_name:  req.last_name,
        gender:     req.gender,
        birth_year: req.birth_year,
        death_year: req.death_year,
        notes:      req.notes,
        spouse_id:  req.spouse_id || null,
      }).select().single();

      const parentIds = Array.isArray(req.parent_ids) ? req.parent_ids : [];
      if (newMember && parentIds.length > 0) {
        await supabase.from("member_parents").insert(
          parentIds.map(pid => ({ member_id: newMember.id, parent_id: pid }))
        );
      }
      onMemberAdded?.();
    }

    await supabase.from("data_requests").update({
      status:      decision,
      admin_note:  adminNote,
      reviewed_at: new Date().toISOString(),
    }).eq("id", req.id);

    setProcessing(null);
    loadRequests();
  };

  const parentNames = (parentIds) => {
    const ids = Array.isArray(parentIds) ? parentIds : [];
    return ids.map(pid => {
      const m = members.find(x => x.id === pid);
      return m ? `${m.first_name} ${m.last_name}` : `#${pid}`;
    }).join(", ") || "—";
  };

  const spouseName = (spouseId) => {
    const m = members.find(x => x.id === spouseId);
    return m ? `${m.first_name} ${m.last_name}` : `#${spouseId}`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#aaa" }}>
        <Icon name="spinner" size={24} />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="req-wrap">
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <div className="empty-state-text">Nema aktivnih zahtjeva.</div>
          <p style={{ fontSize: ".75rem", color: "#bbb", marginTop: ".5rem" }}>Svi zahtjevi su obrađeni.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="req-wrap">
      <div style={{ marginBottom: "1rem", fontSize: ".75rem", color: "#888" }}>
        {requests.length} aktivnih zahtjeva na čekanju
      </div>
      {requests.map(req => (
        <div className="req-card" key={req.id}>
          <div className="req-card-head">
            <div>
              <span className="req-card-name">{req.first_name} {req.last_name}</span>
              <span style={{ marginLeft: ".5rem", fontSize: ".65rem", color: "#aaa" }}>od: {req.user_email}</span>
            </div>
            <span className="req-card-meta">
              {new Date(req.created_at).toLocaleDateString("sr-Latn")} · {new Date(req.created_at).toLocaleTimeString("sr-Latn", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          <div className="req-card-body">
            <div className="req-field">
              <div className="req-field-key">Pol</div>
              {req.gender === "male" ? "👨 Muški" : "👩 Ženski"}
            </div>
            {req.birth_year && (
              <div className="req-field"><div className="req-field-key">God. rođenja</div>{req.birth_year}.</div>
            )}
            {req.death_year && (
              <div className="req-field"><div className="req-field-key">God. smrti</div>{req.death_year}.</div>
            )}
            <div className="req-field">
              <div className="req-field-key">Roditelji</div>
              {parentNames(req.parent_ids)}
            </div>
            {req.spouse_id && (
              <div className="req-field">
                <div className="req-field-key">Supružnik</div>
                {spouseName(req.spouse_id)}
              </div>
            )}
          </div>

          {req.notes && (
            <div style={{ padding: ".4rem 1rem .6rem", fontSize: ".72rem", color: "#666", borderTop: "1px solid rgba(200,150,62,.08)" }}>
              <span style={{ color: "var(--gold-dark)", fontWeight: 600 }}>Napomena: </span>{req.notes}
            </div>
          )}

          <div style={{ padding: ".5rem 1rem", borderTop: "1px solid rgba(200,150,62,.08)" }}>
            <label style={{ fontSize: ".6rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--gold-dark)", display: "block", marginBottom: ".3rem" }}>
              Komentar (opcionalno)
            </label>
            <input
              className="form-input"
              style={{ width: "100%", marginBottom: ".5rem" }}
              placeholder="Komentar pri prihvatanju ili odbijanju..."
              value={noteMap[req.id] || ""}
              onChange={e => setNoteMap(m => ({ ...m, [req.id]: e.target.value }))}
            />
          </div>

          <div className="req-card-foot">
            <button className="btn btn-danger btn-sm" onClick={() => handleDecision(req, "rejected")} disabled={processing === req.id}>
              {processing === req.id ? <Icon name="spinner" size={12} /> : <Icon name="x" size={12} />}
              Odbij
            </button>
            <button className="btn btn-success btn-sm" onClick={() => handleDecision(req, "approved")} disabled={processing === req.id}>
              {processing === req.id ? <Icon name="spinner" size={12} /> : <Icon name="check" size={12} />}
              Prihvati i dodaj u stablo
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
