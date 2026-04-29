import { useState } from "react";
import Icon from "./Icon";

const NODE_WIDTH = 110;
const NODE_GAP   = 20;

function hasVisibleMaleParent(child, members) {
  const parentIds = child.parent_ids || [];
  return parentIds.some(pid => {
    const parent = members.find(m => m.id === pid);
    return parent && parent.gender === "male";
  });
}

function getChildren(member, members) {
  return members.filter(m => {
    if (!(m.parent_ids || []).includes(member.id)) return false;
    const otherParent = (m.parent_ids || []).find(
      pid => pid !== member.id && members.find(x => x.id === pid)
    );
    if (otherParent && otherParent < member.id) return false;
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

function getOffTreeChildren(member, members) {
  return members.filter(c =>
    (c.parent_ids || []).includes(member.id) && !hasVisibleMaleParent(c, members)
  );
}

function getAllChildren(member, members) {
  return members.filter(c => (c.parent_ids || []).includes(member.id));
}

function OffTreeSubtree({ member, members, selected, onSelect, isAdmin, onEdit, onRequestEdit, depth = 0, isDeep = false }) {
  const [expanded, setExpanded] = useState(new Set());

  const children = isDeep ? getAllChildren(member, members) : getOffTreeChildren(member, members);

  const toggle = (id, e) => {
    e.stopPropagation();
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (children.length === 0) return null;

  return (
    <div className="female-children-panel" style={{ marginTop: depth === 0 ? ".5rem" : ".35rem", marginLeft: depth * 14 }}>
      <div className="female-children-label">Дјеца: {member.first_name} {member.last_name}</div>
      <div className="female-children-list">
        {children.map(child => {
          const grandchildren = getAllChildren(child, members);
          const isOpen = expanded.has(child.id);
          return (
            <div key={child.id} style={{ width: "100%" }}>
              <div
                className={`female-child-card ${child.gender}${selected?.id === child.id ? " sel" : ""}`}
                data-member-id={child.id}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: ".4rem", textAlign: "left", padding: ".35rem .5rem" }}
                onClick={e => { e.stopPropagation(); onSelect(child); }}
              >
                <div style={{ flex: 1 }}>
                  <div className="female-child-name">{child.first_name} {child.last_name}</div>
                  {child.birth_year && (
                    <div className="female-child-note">{child.birth_year}{child.death_year ? `–${child.death_year}` : ""}</div>
                  )}
                  {child.generational_line && (
                    <div className="female-child-note" style={{ color: "var(--gold-dark)", fontWeight: 600 }}>{child.generational_line}. кољено</div>
                  )}
                </div>
                {grandchildren.length > 0 && (
                  <button className="node-hidden-children"
                    style={{ margin: 0, cursor: "pointer", border: "none", background: "none", padding: ".1rem .3rem", flexShrink: 0 }}
                    title="Прикажи дјецу" onClick={e => toggle(child.id, e)}>
                    {isOpen ? "▲" : "▼"} {grandchildren.length}
                  </button>
                )}
                {isAdmin ? (
                  <button className="node-act" style={{ flexShrink: 0 }} onClick={e => { e.stopPropagation(); onEdit(child); }}>
                    <Icon name="edit" size={9} />
                  </button>
                ) : (
                  <button className="node-act" style={{ flexShrink: 0 }} title="Предложи измјену"
                    onClick={e => { e.stopPropagation(); onRequestEdit(child); }}>
                    <Icon name="edit" size={9} />
                  </button>
                )}
              </div>
              {isOpen && (
                <OffTreeSubtree member={child} members={members} selected={selected} onSelect={onSelect}
                  isAdmin={isAdmin} onEdit={onEdit} onRequestEdit={onRequestEdit} depth={depth + 1} isDeep={true} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TreeNode({ member, members, selected, onSelect, isAdmin, onEdit, onAddChild, onRequestChild, onRequestEdit }) {
  const children = getChildren(member, members);
  const spouse   = members.find(m => m.id === member.spouse_id);
  const [expandedOffTree, setExpandedOffTree] = useState(new Set());

  const toggleOffTree = (id) => setExpandedOffTree(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const renderNode = (m, showAddChild = false) => {
    const offTreeKids = getOffTreeChildren(m, members);
    const isExpanded  = expandedOffTree.has(m.id);

    return (
      <div
        data-member-id={m.id}
        className={`member-node ${m.gender}${selected?.id === m.id ? " sel" : ""}${m.featured ? " featured" : ""}`}
        onClick={() => { onSelect(m); if (offTreeKids.length > 0) toggleOffTree(m.id); }}
      >
        {m.featured && <span className="node-featured-badge" title="Истакнути члан">★</span>}
        <div className="node-name">{m.first_name}<br />{m.last_name}</div>
        {m.birth_year && (
          <div className="node-note">{m.birth_year}{m.death_year ? `–${m.death_year}` : ""}</div>
        )}
        {m.generational_line && (
          <div className="node-note" style={{ color: "var(--gold-dark)", fontWeight: 600 }}>{m.generational_line}. кољено</div>
        )}
        {offTreeKids.length > 0 && (
          <div className="node-hidden-children" title="Кликните за приказ дјеце">
            {isExpanded ? "▲" : "▼"} {offTreeKids.length}
          </div>
        )}
        <div className="node-actions">
          {/* Lijevo dugme: admin = direktan edit, korisnik = predlog izmjene */}
          {isAdmin ? (
            <button className="node-act" title="Уреди члана" onClick={e => { e.stopPropagation(); onEdit(m); }}>
              <Icon name="edit" size={9} />
            </button>
          ) : (
            <button className="node-act" title="Предложи измјену података" onClick={e => { e.stopPropagation(); onRequestEdit(m); }}>
              <Icon name="edit" size={9} />
            </button>
          )}

          {/* Desno dugme: + za dodavanje/predlog djeteta — samo na glavnom cvoru */}
          {showAddChild && (
            isAdmin ? (
              <button className="node-act" title="Додај дијете" onClick={e => { e.stopPropagation(); onAddChild(m); }}>+</button>
            ) : (
              <button className="node-act" title="Предложи дијете" onClick={e => { e.stopPropagation(); onRequestChild(m); }}>+</button>
            )
          )}
        </div>
      </div>
    );
  };

  const renderOffTree = (m) => {
    if (!expandedOffTree.has(m.id)) return null;
    return (
      <OffTreeSubtree member={m} members={members} selected={selected} onSelect={onSelect}
        isAdmin={isAdmin} onEdit={onEdit} onRequestEdit={onRequestEdit} depth={0} isDeep={false} />
    );
  };

  if (children.length === 0) {
    return (
      <div className="node-col">
        <div className="couple-box">
          {renderNode(member, true)}
          {spouse && <><span className="heart-sep">❤</span>{renderNode(spouse)}</>}
        </div>
        {renderOffTree(member)}
        {spouse && renderOffTree(spouse)}
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
      {renderOffTree(member)}
      {spouse && renderOffTree(spouse)}

      <div className="vert-line" style={{ height: 20 }} />

      <div style={{ position: "relative", width: totalChildrenWidth, display: "flex", justifyContent: "center" }}>
        {children.length > 1 && (
          <div className="horiz-line" style={{
            position: "absolute", top: 0,
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
                onRequestChild={onRequestChild}
                onRequestEdit={onRequestEdit}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
