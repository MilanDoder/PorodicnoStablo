import Icon from "./Icon";

export default function DetailPanel({ member, members, isAdmin, onEdit, onDelete }) {
  if (!member) {
    return (
      <div className="detail-panel">
        <div className="dp-empty">
          <span style={{ fontSize: "2rem" }}>👈</span>
          Kliknite na člana za detalje
        </div>
      </div>
    );
  }

  const parents  = members.filter(m => (member.parent_ids || []).includes(m.id));
  const children = members.filter(m => (m.parent_ids || []).includes(member.id));
  const spouse   = members.find(m => m.id === member.spouse_id);
  const age      = member.birth_year
    ? (member.death_year || new Date().getFullYear()) - member.birth_year
    : null;

  return (
    <div className="detail-panel">
      <div className="dp-head">
        <div className="dp-emoji">{member.gender === "male" ? "👨" : "👩"}</div>
        <div className="dp-name">{member.first_name} {member.last_name}</div>
        <div className="dp-tag">
          {member.gender === "male" ? "Muški" : "Ženski"}
          {member.death_year ? " · Preminuo/la" : ""}
        </div>
      </div>

      <div className="dp-body">
        <div className="dp-sec">
          <div className="dp-sec-title">Lični podaci</div>
          {member.birth_year && (
            <div className="dp-row">
              <span className="dp-key">Rođen/a</span>
              <span className="dp-val">{member.birth_year}.</span>
            </div>
          )}
          {member.death_year && (
            <div className="dp-row">
              <span className="dp-key">Preminuo/la</span>
              <span className="dp-val">{member.death_year}.</span>
            </div>
          )}
          {age && (
            <div className="dp-row">
              <span className="dp-key">Starost</span>
              <span className="dp-val">{age} god.</span>
            </div>
          )}
        </div>

        <div className="dp-sec">
          <div className="dp-sec-title">Porodica</div>
          {spouse && (
            <div className="dp-row">
              <span className="dp-key">Supružnik</span>
              <span className="dp-val">{spouse.first_name} {spouse.last_name}</span>
            </div>
          )}
          {parents.length > 0 && (
            <div className="dp-row">
              <span className="dp-key">Roditelji</span>
              <span className="dp-val">{parents.map(p => p.first_name).join(", ")}</span>
            </div>
          )}
          <div className="dp-row">
            <span className="dp-key">Djeca</span>
            <span className="dp-val">
              {children.length > 0 ? children.map(c => c.first_name).join(", ") : "—"}
            </span>
          </div>
        </div>

        {member.notes && (
          <div className="dp-sec">
            <div className="dp-sec-title">Beleške</div>
            <p className="dp-notes">{member.notes}</p>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="dp-foot">
          <button className="btn btn-ghost btn-sm" style={{ justifyContent: "center" }} onClick={onEdit}>
            <Icon name="edit" size={13} />Uredi
          </button>
          <button
            className="btn btn-danger btn-sm"
            style={{ justifyContent: "center" }}
            onClick={() => { if (window.confirm(`Obrisati ${member.first_name}?`)) onDelete(member.id); }}
          >
            <Icon name="trash" size={13} />Obriši
          </button>
        </div>
      )}
    </div>
  );
}
