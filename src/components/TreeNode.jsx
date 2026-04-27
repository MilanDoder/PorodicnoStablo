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

export default function TreeNode({ member, members, selected, onSelect, isAdmin, onEdit, onAddChild, onRequestChild }) {
  const children = getChildren(member, members);
  const spouse   = members.find(m => m.id === member.spouse_id);
  const [expandedFemale, setExpandedFemale] = useState(null);

  const getHiddenChildren = (m) => members.filter(c => {
    if (!(c.parent_ids || []).includes(m.id)) return false;
    return !hasVisibleMaleParent(c, members);
  });

  const renderNode = (m, showAddChild = false) => {
    const hiddenChildren = getHiddenChildren(m);
    const isExpanded = expandedFemale === m.id;
    const isFemale = m.gender === "female";

    return (
      <div
        data-member-id={m.id}
        className={`member-node ${m.gender}${selected?.id === m.id ? " sel" : ""}${m.featured ? " featured" : ""}`}
        onClick={() => {
          onSelect(m);
          if (isFemale && hiddenChildren.length > 0) {
            setExpandedFemale(isExpanded ? null : m.id);
          }
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
        {hiddenChildren.length > 0 && (
          <div className="node-hidden-children" title="Кликните за приказ дјеце">
            {isExpanded ? "▲" : "▼"} {hiddenChildren.length} ♀
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

  const renderFemaleChildren = (m) => {
    const hiddenChildren = getHiddenChildren(m);
    if (expandedFemale !== m.id || hiddenChildren.length === 0) return null;
    return (
      <div className="female-children-panel">
        <div className="female-children-label">
          Дјеца: {m.first_name} {m.last_name}
        </div>
        <div className="female-children-list">
          {hiddenChildren.map(child => (
            <div
              key={child.id}
              className={`female-child-card ${child.gender}${selected?.id === child.id ? " sel" : ""}`}
              data-member-id={child.id}
              onClick={e => { e.stopPropagation(); onSelect(child); }}
            >
              <div className="female-child-name">{child.first_name} {child.last_name}</div>
              {child.birth_year && (
                <div className="female-child-note">{child.birth_year}{child.death_year ? `–${child.death_year}` : ""}</div>
              )}
              {isAdmin && (
                <button
                  className="node-act"
                  style={{ position: "absolute", top: 2, right: 2, opacity: 1 }}
                  onClick={e => { e.stopPropagation(); onEdit(child); }}
                >
                  <Icon name="edit" size={9} />
                </button>
              )}
            </div>
          ))}
        </div>
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
        {renderFemaleChildren(member)}
        {spouse && renderFemaleChildren(spouse)}
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
      {renderFemaleChildren(member)}
      {spouse && renderFemaleChildren(spouse)}

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
