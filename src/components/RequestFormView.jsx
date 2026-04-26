import { FAMILY_SURNAME } from "../config";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";
import ParentPicker from "./ParentPicker";

const STATUS_LABEL = { pending: "На чекању", approved: "Прихваћен", rejected: "Одбијен" };
const STATUS_CLASS = { pending: "status-pending", approved: "status-approved", rejected: "status-rejected" };
const STATUS_ICON  = { pending: "clock", approved: "check", rejected: "x" };

const EMPTY_FORM = {
  first_name: "", last_name: FAMILY_SURNAME, gender: "male",
  birth_year: "", death_year: "", notes: "", parent_ids: [], spouse_name: "",
};

export default function RequestFormView({ user, members }) {
  const [f,           setF]           = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [myRequests,  setMyRequests]  = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  useEffect(() => { loadMyRequests(); }, []);

  const loadMyRequests = async () => {
    setLoadingReqs(true);
    const { data } = await supabase
      .from("data_requests")
      .select("*")
      .eq("user_id", user.id)          // samo moji zahtjevi
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
        spouse_name: f.spouse_name || null,
        status:     "pending",
      };
      const { error } = await supabase.from("data_requests").insert(payload);
      if (error) { alert("Грешка при слању: " + error.message); return; }
      setSuccess(true);
      setF(EMPTY_FORM);
      setTimeout(() => setSuccess(false), 5000);
      loadMyRequests();
    } catch {
      alert("Неочекивана грешка. Покушајте поново.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = filterStatus === "all"
    ? myRequests
    : myRequests.filter(r => r.status === filterStatus);

  const counts = {
    all:      myRequests.length,
    pending:  myRequests.filter(r => r.status === "pending").length,
    approved: myRequests.filter(r => r.status === "approved").length,
    rejected: myRequests.filter(r => r.status === "rejected").length,
  };

  return (
    <div className="req-form-wrap">

      {/* ── ФОРМА ── */}
      <div className="req-form-card" style={{ marginBottom: "2rem" }}>
        <div className="req-form-title">Пошаљите захтјев за унос члана</div>
        <p className="req-form-desc">
          Уколико знате податке о члану породице који није евидентиран, попуните форму испод.
          Администратор ће прегледати ваш захтјев и одлучити да ли се унесе у стабло.
        </p>
        {success && (
          <div className="req-success">✓ Захтјев је успјешно послат! Администратор ће га прегледати.</div>
        )}
        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">Ime *</label>
            <input className="form-input" value={f.first_name} onChange={e => set("first_name", e.target.value)} placeholder="нпр. Марко" />
          </div>
          <div className="form-field">
            <label className="form-label">Презиме</label>
            <input className="form-input" value={f.last_name} onChange={e => set("last_name", e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">Пол</label>
            <select className="form-select" value={f.gender} onChange={e => set("gender", e.target.value)}>
              <option value="male">Мушки</option>
              <option value="female">Женски</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Год. рођења</label>
            <input className="form-input" type="number" value={f.birth_year} onChange={e => set("birth_year", e.target.value)} placeholder="нпр. 1955" />
          </div>
          <div className="form-field">
            <label className="form-label">Год. смрти</label>
            <input className="form-input" type="number" value={f.death_year} onChange={e => set("death_year", e.target.value)} placeholder="празно ако је жив/а" />
          </div>
          <div className="form-field">
            <label className="form-label">Супружник</label>
            <input
              className="form-input"
              value={f.spouse_name || ""}
              onChange={e => set("spouse_name", e.target.value)}
              placeholder="Ime и презиме супружника"
            />
          </div>
          <div className="form-field full">
            <label className="form-label">Родитељи (из стабла)</label>
            <ParentPicker members={members} selectedIds={f.parent_ids || []} onChange={ids => set("parent_ids", ids)} />
          </div>
          <div className="form-field full">
            <label className="form-label">Напомена / Извор података</label>
            <textarea className="form-textarea" value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="Опишите везу или извор ових података..." />
          </div>
        </div>
        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || !f.first_name}>
            {saving ? <><Icon name="spinner" size={14} />Слање...</> : <><Icon name="send" size={14} />Пошаљи захтјев</>}
          </button>
        </div>
      </div>

      {/* ── МОЈИ ЗАХТЈЕВИ ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".75rem", flexWrap: "wrap", gap: ".5rem" }}>
        <div className="section-title" style={{ margin: 0 }}>Моји захтјеви</div>

        {/* Filter dugmad */}
        <div style={{ display: "flex", gap: ".35rem" }}>
          {[
            ["all",      "Сви",         counts.all],
            ["pending",  "На чекању",   counts.pending],
            ["approved", "Прихваћени",  counts.approved],
            ["rejected", "Одбијени",    counts.rejected],
          ].map(([val, lbl, cnt]) => (
            <button
              key={val}
              onClick={() => setFilterStatus(val)}
              style={{
                padding: ".25rem .65rem",
                fontSize: ".62rem",
                letterSpacing: ".08em",
                textTransform: "uppercase",
                border: `1px solid ${filterStatus === val ? "var(--gold)" : "rgba(200,150,62,.25)"}`,
                background: filterStatus === val ? "rgba(200,150,62,.12)" : "white",
                color: filterStatus === val ? "var(--gold-dark)" : "#aaa",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {lbl} {cnt > 0 && <span style={{ fontWeight: 700 }}>({cnt})</span>}
            </button>
          ))}
        </div>
      </div>

      {loadingReqs ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#aaa" }}>
          <Icon name="spinner" size={20} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-text">
            {myRequests.length === 0 ? "Још нисте послали ниједан захтјев." : "Нема захтјева за изабрани филтер."}
          </div>
        </div>
      ) : (
        <table className="mtable">
          <thead>
            <tr>
              <th>Ime и презиме</th>
              <th>Пол</th>
              <th>Год. рођења</th>
              <th>Родитељи</th>
              <th>Послато</th>
              <th>Статус</th>
              <th>Коментар админа</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(req => {
              const parentNames = (req.parent_ids || [])
                .map(pid => members.find(m => m.id === pid))
                .filter(Boolean)
                .map(m => `${m.first_name} ${m.last_name}`)
                .join(", ");

              return (
                <tr key={req.id}>
                  <td><strong>{req.first_name} {req.last_name}</strong></td>
                  <td>
                    <span className={`gbadge ${req.gender}`}>
                      {req.gender === "male" ? "👨 Мушки" : "👩 Женски"}
                    </span>
                  </td>
                  <td style={{ color: "#666" }}>{req.birth_year || <span style={{ color: "#ccc" }}>—</span>}</td>
                  <td style={{ fontSize: ".73rem", color: "#555" }}>
                    {parentNames || <span style={{ color: "#ccc" }}>—</span>}
                  </td>
                  <td style={{ fontSize: ".72rem", color: "#999", whiteSpace: "nowrap" }}>
                    {new Date(req.created_at).toLocaleDateString("sr-Latn")}
                  </td>
                  <td>
                    <span className={`status-badge ${STATUS_CLASS[req.status]}`}>
                      <Icon name={STATUS_ICON[req.status]} size={10} />
                      {STATUS_LABEL[req.status]}
                    </span>
                  </td>
                  <td style={{ fontSize: ".72rem", color: "#666", fontStyle: req.admin_note ? "normal" : "italic" }}>
                    {req.admin_note || <span style={{ color: "#ccc" }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
