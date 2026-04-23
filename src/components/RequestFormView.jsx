import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";

const STATUS_LABEL = { pending: "Na čekanju", approved: "Prihvaćen", rejected: "Odbijen" };
const STATUS_CLASS = { pending: "status-pending", approved: "status-approved", rejected: "status-rejected" };
const STATUS_ICON  = { pending: "clock", approved: "check", rejected: "x" };

const EMPTY_FORM = {
  first_name: "", last_name: "Додеровић", gender: "male",
  birth_year: "", death_year: "", notes: "", parent_ids: [], spouse_id: "",
};

export default function RequestFormView({ user, members }) {
  const [f, setF] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(true);

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  useEffect(() => { loadMyRequests(); }, []);

  const loadMyRequests = async () => {
    setLoadingReqs(true);
    const { data } = await supabase
      .from("data_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setMyRequests(data || []);
    setLoadingReqs(false);
  };

  const handleSubmit = async () => {
    if (!f.first_name) return;
    setSaving(true);
    try {
      const payload = {
        user_id:    user.id,
        user_email: user.email,
        first_name: f.first_name,
        last_name:  f.last_name,
        gender:     f.gender,
        birth_year: f.birth_year ? parseInt(f.birth_year) : null,
        death_year: f.death_year ? parseInt(f.death_year) : null,
        notes:      f.notes || null,
        parent_ids: f.parent_ids,
        spouse_id:  f.spouse_id ? parseInt(f.spouse_id) : null,
        status:     "pending",
      };
      const { error } = await supabase.from("data_requests").insert(payload);
      if (error) {
        console.error("Insert error:", error);
        alert("Greška pri slanju: " + error.message);
        return;
      }
      setSuccess(true);
      setF(EMPTY_FORM);
      setTimeout(() => setSuccess(false), 5000);
      loadMyRequests();
    } catch (e) {
      console.error("Unexpected error:", e);
      alert("Neočekivana greška. Pokušajte ponovo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="req-form-wrap">
      {/* ── FORMA ── */}
      <div className="req-form-card" style={{ marginBottom: "2rem" }}>
        <div className="req-form-title">Pošaljite zahtjev za unos člana</div>
        <p className="req-form-desc">
          Ukoliko znate podatke o članu porodice koji nije evidentiran, popunite formu ispod.
          Administrator će pregledati vaš zahtjev i odlučiti da li se unese u stablo.
        </p>
        {success && (
          <div className="req-success">✓ Zahtjev je uspješno poslat! Administrator će ga pregledati.</div>
        )}
        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">Ime *</label>
            <input className="form-input" value={f.first_name} onChange={e => set("first_name", e.target.value)} placeholder="npr. Марко" />
          </div>
          <div className="form-field">
            <label className="form-label">Prezime</label>
            <input className="form-input" value={f.last_name} onChange={e => set("last_name", e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">Pol</label>
            <select className="form-select" value={f.gender} onChange={e => set("gender", e.target.value)}>
              <option value="male">Muški</option>
              <option value="female">Ženski</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">God. rođenja</label>
            <input className="form-input" type="number" value={f.birth_year} onChange={e => set("birth_year", e.target.value)} placeholder="npr. 1955" />
          </div>
          <div className="form-field">
            <label className="form-label">God. smrti</label>
            <input className="form-input" type="number" value={f.death_year} onChange={e => set("death_year", e.target.value)} placeholder="prazno ako je živ/a" />
          </div>
          <div className="form-field">
            <label className="form-label">Supružnik (iz stabla)</label>
            <select className="form-select" value={f.spouse_id} onChange={e => set("spouse_id", e.target.value)}>
              <option value="">— bez supružnika —</option>
              {members.map(m => {
                const otac = members.find(p => (m.parent_ids || []).includes(p.id) && p.gender === "male");
                const godina = m.birth_year ? ` · ${m.birth_year}.` : "";
                const imeOca = otac ? ` (${otac.first_name})` : "";
                return (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name}{imeOca}{godina}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="form-field full">
            <label className="form-label">Roditelji (iz stabla)</label>
            <select
              className="form-select"
              multiple
              style={{ height: 110 }}
              value={(f.parent_ids || []).map(String)}
              onChange={e => set("parent_ids", Array.from(e.target.selectedOptions, o => parseInt(o.value)))}
            >
              {members.map(m => {
                const otac = members.find(p => (m.parent_ids || []).includes(p.id) && p.gender === "male");
                const godina = m.birth_year ? ` · ${m.birth_year}.` : "";
                const imeOca = otac ? ` (${otac.first_name})` : "";
                return (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name}{imeOca}{godina}
                  </option>
                );
              })}
            </select>
            <span style={{ fontSize: ".62rem", color: "#999", marginTop: 3 }}>Ctrl+klik za više roditelja</span>
          </div>
          <div className="form-field full">
            <label className="form-label">Napomena / Izvor podataka</label>
            <textarea
              className="form-textarea"
              value={f.notes}
              onChange={e => set("notes", e.target.value)}
              placeholder="Opisite vezu ili izvor ovih podataka..."
            />
          </div>
        </div>
        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || !f.first_name}>
            {saving
              ? <><Icon name="spinner" size={14} />Slanje...</>
              : <><Icon name="send" size={14} />Pošalji zahtjev</>}
          </button>
        </div>
      </div>

      {/* ── MOJI ZAHTJEVI ── */}
      <div className="section-title">Moji zahtjevi</div>
      {loadingReqs ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#aaa" }}>
          <Icon name="spinner" size={20} />
        </div>
      ) : myRequests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-text">Još niste poslali nijedan zahtjev.</div>
        </div>
      ) : (
        myRequests.map(req => (
          <div className="req-card" key={req.id}>
            <div className="req-card-head">
              <span className="req-card-name">{req.first_name} {req.last_name}</span>
              <span className={`status-badge ${STATUS_CLASS[req.status]}`}>
                <Icon name={STATUS_ICON[req.status]} size={10} />
                {STATUS_LABEL[req.status]}
              </span>
            </div>
            <div className="req-card-body">
              <div className="req-field">
                <div className="req-field-key">Pol</div>
                {req.gender === "male" ? "Muški" : "Ženski"}
              </div>
              {req.birth_year && (
                <div className="req-field">
                  <div className="req-field-key">God. rođenja</div>
                  {req.birth_year}.
                </div>
              )}
              <div className="req-field">
                <div className="req-field-key">Poslato</div>
                {new Date(req.created_at).toLocaleDateString("sr-Latn")}
              </div>
            </div>
            {req.admin_note && (
              <div style={{ padding: ".5rem 1rem", fontSize: ".72rem", color: "#666", borderTop: "1px solid rgba(200,150,62,.08)" }}>
                <span style={{ color: "var(--gold-dark)", fontWeight: 600 }}>Admin komentar:</span> {req.admin_note}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
