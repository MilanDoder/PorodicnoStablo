import Icon from "./Icon";

export default function DetailPanel({ member, members, isAdmin, onEdit, onDelete, onNavigateTo, onSelect, onRequestChild }) {
  if (!member) {
    return (
      <div className="detail-panel">
        <div className="dp-empty">
          <span style={{ fontSize: "2rem" }}>👈</span>
          Кликните на члана за детаље
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

  const goTo = (m) => { onSelect(m); onNavigateTo(m.id); };

  const PersonChip = ({ m }) => (
    <button
      className="dp-person-chip"
      onClick={() => goTo(m)}
      title={`Иди на: ${m.first_name} ${m.last_name}`}
    >
      <span>{m.gender === "male" ? "👨" : "👩"}</span>
      <span>{m.first_name} {m.last_name}</span>
      <Icon name="arrow" size={10} />
    </button>
  );

  return (
    <div className="detail-panel">
      <div className="dp-head">
        <div className="dp-emoji">{member.gender === "male" ? "👨" : "👩"}</div>
        <div className="dp-name">{member.first_name} {member.last_name}</div>
        <div className="dp-tag">
          {member.gender === "male" ? "Мушки" : "Женски"}
          {member.death_year ? " · Преминуо/ла" : ""}
        </div>
        {member.featured && (
          <div className="dp-featured-badge"><span>★</span> Истакнути члан</div>
        )}
        {member.featured && member.featured_note && (
          <div className="dp-featured-note">{member.featured_note}</div>
        )}
      </div>

      <div className="dp-body">
        <div className="dp-sec">
          <div className="dp-sec-title">Лични подаци</div>
          {member.generational_line && (
            <div className="dp-row">
              <span className="dp-key">Кољено</span>
              <span className="dp-val">{member.generational_line}. кољено</span>
            </div>
          )}
          {member.birth_year && (
            <div className="dp-row">
              <span className="dp-key">Рођен/а</span>
              <span className="dp-val">{member.birth_year}.</span>
            </div>
          )}
          {member.death_year && (
            <div className="dp-row">
              <span className="dp-key">Преминуо/ла</span>
              <span className="dp-val">{member.death_year}.</span>
            </div>
          )}
          {age && (
            <div className="dp-row">
              <span className="dp-key">Старост</span>
              <span className="dp-val">{age} год.</span>
            </div>
          )}
        </div>

        <div className="dp-sec">
          <div className="dp-sec-title">Породица</div>

          {spouse && (
            <div className="dp-nav-group">
              <span className="dp-key" style={{ fontSize: ".65rem" }}>Супружник</span>
              <PersonChip m={spouse} />
            </div>
          )}

          {parents.length > 0 && (
            <div className="dp-nav-group">
              <span className="dp-key" style={{ fontSize: ".65rem" }}>
                {parents.length === 1 ? "Родитељ" : "Родитељи"}
              </span>
              <div className="dp-chips">
                {parents.map(p => <PersonChip key={p.id} m={p} />)}
              </div>
            </div>
          )}

          {children.length > 0 && (
            <div className="dp-nav-group">
              <span className="dp-key" style={{ fontSize: ".65rem" }}>
                Дјеца ({children.length})
              </span>
              <div className="dp-chips">
                {children.map(c => <PersonChip key={c.id} m={c} />)}
              </div>
            </div>
          )}

          {children.length === 0 && parents.length === 0 && !spouse && (
            <div style={{ fontSize: ".72rem", color: "#ccc", fontStyle: "italic" }}>
              Нема повезаних чланова
            </div>
          )}
        </div>

        {member.notes && (
          <div className="dp-sec">
            <div className="dp-sec-title">Биљешке</div>
            <p className="dp-notes">{member.notes}</p>
          </div>
        )}
      </div>

      <div className="dp-foot">
        {/* Korisničko dugme za zahtjev */}
        {!isAdmin && onRequestChild && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ justifyContent: "center", width: "100%" }}
            onClick={() => onRequestChild(member)}
            title={`Додај дијете за ${member.first_name} ${member.last_name}`}
          >
            <Icon name="plus" size={13} />Предложи дијете
          </button>
        )}

        {/* Admin dugmad */}
        {isAdmin && (
          <>
            <button className="btn btn-ghost btn-sm" style={{ justifyContent: "center" }} onClick={onEdit}>
              <Icon name="edit" size={13} />Уреди
            </button>
            <button
              className="btn btn-danger btn-sm"
              style={{ justifyContent: "center" }}
              onClick={() => { if (window.confirm(`Обрисати ${member.first_name}?`)) onDelete(member.id); }}
            >
              <Icon name="trash" size={13} />Обриши
            </button>
          </>
        )}
      </div>
    </div>
  );
}
