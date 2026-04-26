// Horizontalni prikaz stabla — koljeno po koljeno s lijeva na desno

function getChildren(member, members) {
  return members.filter(m => (m.parent_ids || []).includes(member.id));
}

function HorizNode({ member, members, selected, onSelect }) {
  const children = getChildren(member, members);
  const spouse   = members.find(m => m.id === member.spouse_id);

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {/* Čvor(ovi) */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Glavni član */}
        <div
          data-member-id={member.id}
          className={`member-node ${member.gender}${selected?.id === member.id ? " sel" : ""}${member.featured ? " featured" : ""}`}
          style={{ width: 120, cursor: "pointer", marginBottom: spouse ? 2 : 0 }}
          onClick={() => onSelect(member)}
        >
          {member.featured && <span className="node-featured-badge">★</span>}
          <div className="node-name">{member.first_name} {member.last_name}</div>
          {member.generational_line && (
            <div className="node-note" style={{ color: "var(--gold-dark)", fontWeight: 600 }}>
              {member.generational_line}. кољено
            </div>
          )}
        </div>
        {/* Supružnik ispod */}
        {spouse && (
          <div
            data-member-id={spouse.id}
            className={`member-node ${spouse.gender}${selected?.id === spouse.id ? " sel" : ""}`}
            style={{ width: 120, cursor: "pointer", marginTop: 2 }}
            onClick={() => onSelect(spouse)}
          >
            <div className="node-name">{spouse.first_name} {spouse.last_name}</div>
          </div>
        )}
      </div>

      {/* Linija i djeca */}
      {children.length > 0 && (
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Horizontalna linija od roditelja */}
          <div style={{ width: 24, height: 2, background: "rgba(200,150,62,.5)", flexShrink: 0 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {children.map((child, i) => (
              <div key={child.id} style={{ display: "flex", alignItems: "center" }}>
                {/* Kratka horizontalna linija do djeteta */}
                <div style={{ width: 16, height: 2, background: "rgba(200,150,62,.5)", flexShrink: 0 }} />
                <HorizNode
                  member={child}
                  members={members}
                  selected={selected}
                  onSelect={onSelect}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HorizTree({ members, selected, onSelect }) {
  // Pronađi korijene (bez roditelja u stablu)
  const roots = members.filter(
    m => !(m.parent_ids || []).length || !(m.parent_ids || []).some(pid => members.find(x => x.id === pid))
  );
  const primaryRoots = roots.filter(m => {
    if (!m.spouse_id) return true;
    const sp = members.find(x => x.id === m.spouse_id);
    return !sp || m.id < sp.id;
  });

  return (
    <div style={{ padding: "32px 40px", minWidth: "max-content" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        {primaryRoots.map(root => (
          <HorizNode
            key={root.id}
            member={root}
            members={members}
            selected={selected}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
