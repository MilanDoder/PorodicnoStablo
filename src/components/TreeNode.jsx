import Icon from "./Icon";

const NODE_WIDTH = 110;
const NODE_GAP   = 20;

/**
 * Dete se prikazuje u stablu samo ako ima bar jednog muškog roditelja
 * koji postoji u members listi. Ako su svi roditelji ženskog pola,
 * dete se sakriva iz stabla (ali ostaje vidljivo u DetailPanel-u).
 */
function hasVisibleMaleParent(child, members) {
  const parentIds = child.parent_ids || [];
  return parentIds.some(pid => {
    const parent = members.find(m => m.id === pid);
    return parent && parent.gender === "male";
  });
}

function getChildren(member, members) {
  return members.filter(m => {
    // Mora biti dijete ovog člana
    if (!(m.parent_ids || []).includes(member.id)) return false;

    // Izbjegni duplikate — ako dijete ima dva roditelja u stablu,
    // prikazuj ga samo pod onim s manjim id-em
    const otherParent = (m.parent_ids || []).find(
      pid => pid !== member.id && members.find(x => x.id === pid)
    );
    if (otherParent && otherParent < member.id) return false;

    // Sakrij dijete ako nema ni jednog muškog roditelja u stablu
    if (!hasVisibleMaleParent(m, members)) return false;

    return true;
  });
}

function subtreeWidth(member, members) {
  const children  = getChildren(member, members);
  const spouse    = members.find(m => m.id === member.spouse_id);
  const selfWidth = spouse ? NODE_WIDTH * 2 + 30 : NODE_WIDTH;
  if (children.length === 0) return selfWidth;
  const childrenWidth = children.reduce((sum, c) => sum + subtreeWidth(c, members) + NODE_GAP, -NODE_GAP);
  return Math.max(selfWidth, childrenWidth);
}

export default function TreeNode({ member, members, selected, onSelect, isAdmin, onEdit, onAddChild }) {
  const children = getChildren(member, members);
  const spouse   = members.find(m => m.id === member.spouse_id);

  // Broj sakrivene djece (samo ženske linije) — prikazujemo info na čvoru
  const hiddenChildrenCount = members.filter(m => {
    if (!(m.parent_ids || []).includes(member.id)) return false;
    if (!hasVisibleMaleParent(m, members)) return true;
    return false;
  }).length;

  const renderNode = (m, showAddChild = false) => {
    const hidden = members.filter(c => {
      if (!(c.parent_ids || []).includes(m.id)) return false;
      return !hasVisibleMaleParent(c, members);
    }).length;

    return (
      <div
        data-member-id={m.id}
        className={`member-node ${m.gender}${selected?.id === m.id ? " sel" : ""}${m.featured ? " featured" : ""}`}
        onClick={() => onSelect(m)}
      >
        {m.featured && <span className="node-featured-badge" title="Istaknuti član">★</span>}
        <div className="node-name">{m.first_name}<br />{m.last_name}</div>
        {m.birth_year && (
          <div className="node-note">{m.birth_year}{m.death_year ? `–${m.death_year}` : ""}</div>
        )}
        {m.generational_line && (
          <div className="node-note" style={{ color: "var(--gold-dark)", fontWeight: 600 }}>
            {m.generational_line}. koleno
          </div>
        )}
        {/* Indikator sakrivene djece */}
        {hidden > 0 && (
          <div className="node-hidden-children" title="Kliknite za detalje">
            +{hidden} ♀
          </div>
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
  };

  if (children.length === 0) {
    return (
      <div className="node-col">
        <div className="couple-box">
          {renderNode(member, true)}
          {spouse && <><span className="heart-sep">❤</span>{renderNode(spouse)}</>}
        </div>
      </div>
    );
  }

  const childWidths        = children.map(c => subtreeWidth(c, members));
  const totalChildrenWidth = childWidths.reduce((s, w) => s + w, 0) + NODE_GAP * (children.length - 1);

  return (
    <div className="node-col">
      <div className="couple-box">
        {renderNode(member, true)}
        {spouse && <><span className="heart-sep">❤</span>{renderNode(spouse)}</>}
      </div>

      <div className="vert-line" style={{ height: 20 }} />

      <div style={{ position: "relative", width: totalChildrenWidth, display: "flex", justifyContent: "center" }}>
        {children.length > 1 && (
          <div className="horiz-line" style={{
            position: "absolute",
            top: 0,
            left:  childWidths[0] / 2,
            width: totalChildrenWidth - childWidths[0] / 2 - childWidths[childWidths.length - 1] / 2,
          }} />
        )}
        <div style={{ display: "flex", gap: NODE_GAP, alignItems: "flex-start" }}>
          {children.map((child, i) => (
            <div key={child.id} style={{ width: childWidths[i], display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div className="vert-line" style={{ height: 20 }} />
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
      </div>
    </div>
  );
}
