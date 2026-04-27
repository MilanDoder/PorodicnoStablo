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

// Djeca koja NISU u glavnom stablu — nemaju muškog roditelja koji je u stablu
function getOffTreeChildren(member, members) {
  return members.filter(c => (c.parent_ids || []).includes(member.id) && !hasVisibleMaleParent(c, members));
}

// Set svih off-tree clanova (rekurzivno) — za provjeru tokom rekurzije
function buildOffTreeSet(members) {
  const roots = new Set(
    members
      .filter(m => !(m.parent_ids || []).some(pid => members.find(x => x.id === pid)))
      .map(m => m.id)
  );
  // Off-tree su svi koji nemaju muškog roditelja u glavnom stablu
  return new Set(members.filter(m => !hasVisibleMaleParent(m, members) && !roots.has(m.id)).map(m => m.id));
}

// Djeca nekog off-tree clana — sva direktna djeca (bez obzira na pol)
// jer je roditelj vec off-tree, pa i njegova djeca jesu
function getOffTreeChildrenDeep(member, members) {
  return members.filter(c => (c.parent_ids || []).includes(member.id));
}

// Rekurzivna komponenta za off-tree podstablo
function OffTreeSubtree({ member, members, selected, onSelect, isAdmin, onEdit, depth = 0, isDeep = false }) {
  const [expanded, setExpanded] = useState(new Set());

  // Na prvom nivou (direktna djeca zenskog clana stabla): samo off-tree
  // Na dubljim nivoima (djeca off-tree clanova): SVA djeca
  const children = isDeep
    ? getOffTreeChildrenDeep(member, members)
    : getOffTreeChildren(member, members);

  const toggle = (id) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  if (children.length === 0) return null;

  return (
    <div className="female-children-panel" style={{ marginTop: depth === 0 ? ".5rem" : ".35rem", marginLeft: depth * 12 }}>
      <div className="female-children-label">
        Дјеца: {member.first_name} {member.last_name}
      </div>
      <div className="female-children-list">
        {children.map(child => {
          const grandchildren = isDeep
            ? getOffTreeChildrenDeep(child, members)
            : getOffTreeChildren(child, members);
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
                  <button
                    className="node-hidden-children"
                    style={{ margin: 0, cursor: "pointer", border: "none", background: "none", padding: ".1rem .3rem", flexShrink: 0 }}
                    title="Прикажи дјецу"
                    onClick={e => { e.stopPropagation(); toggle(child.id); }}
                  >
                    {isOpen ? "▲" : "▼"} {grandchildren.length}
                  </button>
                )}

                {isAdmin && (
                  <button
                    className="node-act"
                    style={{ flexShrink: 0 }}
                    onClick={e => { e.stopPropagation(); onEdit(child); }}
                  >
                    <Icon name="edit" size={9} />
                  </button>
                )}
              </div>

              {isOpen && (
                <OffTreeSubtree
                  member={child}
                  members={members}
                  selected={selected}
                  onSelect={onSelect}
                  isAdmin={isAdmin}
                  onEdit={onEdit}
                  depth={depth + 1}
                  isDeep={true}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TreeNode({ member, members, selected, onSelect, isAdmin, onEdit, onAddChild, onRequestChild }) {
  const children = getChildren(member, members);
  const spouse   = members.find(m => m.id === member.spouse_id);
  const [expandedFemale, setExpandedFemale] = useState(new Set());

  const toggleFemale = (id) => setExpandedFemale(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const renderNode = (m, showAddChild = false) => {
    const offTreeChildren = getOffTreeChildren(m, members);
    const isExpanded = expandedFemale.has(m.id);
    const isFemale = m.gender === "female";

    return (
      <div
        data-member-id={m.id}
        className={`member-node ${m.gender}${selected?.id === m.id ? " sel" : ""}${m.featured ? " featured" : ""}`}
        onClick={() => {
          onSelect(m);
          if (isFemale && offTreeChildren.length > 0) toggleFemale(m.id);
        }}
      >
        {m.featured && <span className="node-featured-badge" title="Истакнути члан">★</span>}
        <div className="node-name">{m.first_name}<br />{m.last_name}</div>
        {m.birth_year && (
          <div className="node-note">{m.birth_year}{m.death_year ? `–${m.death_year}` : ""}</div>
        )}
        {m.generational_line && (
          <div className="node-note" style={{ color: "var(--gold-dark)", fontWeight: 600 }}>
            {m.generational_line}. кољено
          </div>
        )}
        {offTreeChildren.length > 0 && (
          <div className="node-hidden-children" title="Кликните за приказ дјеце">
            {isExpanded ? "▲" : "▼"} {offTreeChildren.length} ♀
          </div>
        )}
        <div className="node-actions">
          {isAdmin && (
            <button className="node-act" onClick={e => { e.stopPropagation(); onEdit(m); }}>
              <Icon name="edit" size={9} />
            </button>
          )}
          {isAdmin && showAddChild && (
            <button className="node-act" title="Додај дијете" onClick={e => { e.stopPropagation(); onAddChild(m); }}>+</button>
          )}
          {!isAdmin && showAddChild && (
            <button className="node-act" title="Предложи дијете" onClick={e => { e.stopPropagation(); onRequestChild(m); }}>+</button>
          )}
        </div>
      </div>
    );
  };

  const renderOffTree = (m) => {
    if (!expandedFemale.has(m.id)) return null;
    return (
      <OffTreeSubtree
        member={m}
        members={members}
        selected={selected}
        onSelect={onSelect}
        isAdmin={isAdmin}
        onEdit={onEdit}
        depth={0}
      />
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
                onRequestChild={onRequestChild}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
