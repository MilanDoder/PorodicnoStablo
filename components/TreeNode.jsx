import Icon from "./Icon";

export default function TreeNode({ member, members, selected, onSelect, isAdmin, onEdit, onAddChild }) {
  const children = members.filter(m => {
    if (!(m.parent_ids || []).includes(member.id)) return false;
    const otherParent = (m.parent_ids || []).find(pid => pid !== member.id && members.find(x => x.id === pid));
    if (otherParent && otherParent < member.id) return false;
    return true;
  });

  const spouse = members.find(m => m.id === member.spouse_id);

  const renderNode = (m, showAddChild = false) => (
    <div
      className={`member-node ${m.gender}${selected?.id === m.id ? " sel" : ""}`}
      onClick={() => onSelect(m)}
    >
      <div className="node-emoji">{m.gender === "male" ? "👨" : "👩"}</div>
      <div className="node-name">{m.first_name}<br />{m.last_name}</div>
      {m.birth_year && (
        <div className="node-note">{m.birth_year}{m.death_year ? `–${m.death_year}` : ""}</div>
      )}
      {isAdmin && (
        <div className="node-actions">
          <button className="node-act" onClick={e => { e.stopPropagation(); onEdit(m); }}>
            <Icon name="edit" size={9} />
          </button>
          {showAddChild && (
            <button className="node-act" onClick={e => { e.stopPropagation(); onAddChild(m); }}>+</button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="node-col">
      <div className="couple-box">
        {renderNode(member, true)}
        {spouse && (
          <>
            <span className="heart-sep">❤</span>
            {renderNode(spouse, false)}
          </>
        )}
      </div>

      {children.length > 0 && (
        <>
          <div className="vert-line" style={{ height: 18 }} />
          <div style={{ position: "relative", display: "flex", alignItems: "flex-start" }}>
            {children.length > 1 && (
              <div className="horiz-line" style={{
                position: "absolute", top: 0,
                left: `calc(50% - ${(children.length - 1) * 63}px)`,
                width: `${(children.length - 1) * 126}px`,
              }} />
            )}
            {children.map(child => (
              <div key={child.id} className="child-stem">
                <div className="vert-line" style={{ height: 18 }} />
                <TreeNode
                  member={child}
                  members={members}
                  selected={selected}
                  onSelect={onSelect}
                  isAdmin={isAdmin}
                  onEdit={onEdit}
                  onAddChild={onAddChild}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
