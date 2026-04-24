import { useState, useRef } from "react";
import Icon from "./Icon";

function collectDescendants(rootId, allMembers) {
  const result = new Set();
  const queue  = [rootId];
  while (queue.length) {
    const id = queue.shift();
    if (result.has(id)) continue;
    result.add(id);
    allMembers.forEach(m => {
      if ((m.parent_ids || []).includes(id) && !result.has(m.id))
        queue.push(m.id);
    });
  }
  return result;
}

function getChildren(member, subset) {
  return subset.filter(m => {
    if (!(m.parent_ids || []).includes(member.id)) return false;
    const otherParent = (m.parent_ids || []).find(
      pid => pid !== member.id && subset.find(x => x.id === pid)
    );
    if (otherParent && otherParent < member.id) return false;
    return true;
  });
}

const NODE_W = 110;
const GAP    = 20;

function subtreeWidth(member, subset) {
  const children  = getChildren(member, subset);
  const spouse    = subset.find(m => m.id === member.spouse_id);
  const selfWidth = spouse ? NODE_W * 2 + 30 : NODE_W;
  if (!children.length) return selfWidth;
  const childW = children.reduce((s, c) => s + subtreeWidth(c, subset) + GAP, -GAP);
  return Math.max(selfWidth, childW);
}

function MiniNode({ member, subset, selected, onSelect }) {
  const children = getChildren(member, subset);
  const spouse   = subset.find(m => m.id === member.spouse_id);

  const renderCard = (m) => (
    <div
      key={m.id}
      className={`member-node ${m.gender}${m.featured ? " featured" : ""}${selected?.id === m.id ? " sel" : ""}`}
      style={{ cursor: "pointer" }}
      onClick={() => onSelect(m)}
    >
      {m.featured && <span className="node-featured-badge">★</span>}
      <div className="node-name">{m.first_name}<br />{m.last_name}</div>
      {m.birth_year && (
        <div className="node-note">
          {m.birth_year}{m.death_year ? `–${m.death_year}` : ""}
        </div>
      )}
      {m.generational_line && (
        <div className="node-note" style={{ color: "var(--gold-dark)", fontWeight: 600 }}>
          {m.generational_line}. кољено
        </div>
      )}
    </div>
  );

  if (!children.length) {
    return (
      <div className="node-col">
        <div className="couple-box">
          {renderCard(member)}
          {spouse && <><span className="heart-sep">❤</span>{renderCard(spouse)}</>}
        </div>
      </div>
    );
  }

  const childWidths     = children.map(c => subtreeWidth(c, subset));
  const totalChildWidth = childWidths.reduce((s, w) => s + w, 0) + GAP * (children.length - 1);

  return (
    <div className="node-col">
      <div className="couple-box">
        {renderCard(member)}
        {spouse && <><span className="heart-sep">❤</span>{renderCard(spouse)}</>}
      </div>
      <div className="vert-line" style={{ height: 20 }} />
      <div style={{ position: "relative", width: totalChildWidth, display: "flex", justifyContent: "center" }}>
        {children.length > 1 && (
          <div className="horiz-line" style={{
            position: "absolute", top: 0,
            left:  childWidths[0] / 2,
            width: totalChildWidth - childWidths[0] / 2 - childWidths[childWidths.length - 1] / 2,
          }} />
        )}
        <div style={{ display: "flex", gap: GAP, alignItems: "flex-start" }}>
          {children.map((child, i) => (
            <div key={child.id} style={{ width: childWidths[i], display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div className="vert-line" style={{ height: 20 }} />
              <MiniNode member={child} subset={subset} selected={selected} onSelect={onSelect} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MemberTreeModal({ root, allMembers, onClose }) {
  const [scale, setScale]       = useState(0.85);
  const [selected, setSelected] = useState(null);
  const canvasRef = useRef(null);
  const dragging  = useRef(false);
  const startPos  = useRef({ x: 0, y: 0 });
  const scrollPos = useRef({ left: 0, top: 0 });

  const descIds = collectDescendants(root.id, allMembers);
  const subsetIds = new Set(descIds);
  allMembers.forEach(m => {
    if (descIds.has(m.id) && m.spouse_id) subsetIds.add(m.spouse_id);
  });
  const subset = allMembers.filter(m => subsetIds.has(m.id));

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    dragging.current = true;
    startPos.current  = { x: e.clientX, y: e.clientY };
    scrollPos.current = { left: canvasRef.current.scrollLeft, top: canvasRef.current.scrollTop };
    canvasRef.current.style.cursor = "grabbing";
  };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    canvasRef.current.scrollLeft = scrollPos.current.left - (e.clientX - startPos.current.x);
    canvasRef.current.scrollTop  = scrollPos.current.top  - (e.clientY - startPos.current.y);
  };
  const onMouseUp = () => {
    dragging.current = false;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
  };

  const lastTouch = useRef(null);
  const lastDist  = useRef(null);
  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      scrollPos.current = { left: canvasRef.current.scrollLeft, top: canvasRef.current.scrollTop };
      lastDist.current  = null;
    } else if (e.touches.length === 2) {
      lastDist.current  = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      lastTouch.current = null;
    }
  };
  const onTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && lastTouch.current) {
      canvasRef.current.scrollLeft = scrollPos.current.left - (e.touches[0].clientX - lastTouch.current.x);
      canvasRef.current.scrollTop  = scrollPos.current.top  - (e.touches[0].clientY - lastTouch.current.y);
    } else if (e.touches.length === 2 && lastDist.current) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      setScale(s => Math.min(2.5, Math.max(0.2, s * (d / lastDist.current))));
      lastDist.current = d;
    }
  };

  const totalDesc = descIds.size - 1;

  return (
    <div className="mtm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mtm-modal">
        <div className="mtm-header">
          <div>
            <div className="mtm-title">
              {root.featured && <span style={{ color: "var(--gold)", marginRight: ".4rem" }}>★</span>}
              Породично стабло: {root.first_name} {root.last_name}
            </div>
            <div className="mtm-sub">
              {root.generational_line ? `${root.generational_line}. кољено · ` : ""}
              {root.birth_year || "?"}{root.death_year ? `–${root.death_year}` : ""} · {totalDesc} потомака
            </div>
          </div>
          <button className="mtm-close" onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <div
          className="mtm-canvas"
          ref={canvasRef}
          style={{ cursor: "grab" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={() => { lastTouch.current = null; lastDist.current = null; }}
        >
          <div className="mtm-inner" style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}>
            <MiniNode member={root} subset={subset} selected={selected} onSelect={setSelected} />
          </div>
        </div>

        <div className="mtm-controls">
          <button className="tree-ctrl-btn" onClick={() => setScale(s => Math.min(2.5, s + 0.1))} title="Увећај"><Icon name="zoomin"  size={15} /></button>
          <button className="tree-ctrl-btn" onClick={() => setScale(s => Math.max(0.2, s - 0.1))} title="Умањи"><Icon name="zoomout" size={15} /></button>
          <button className="tree-ctrl-btn" onClick={() => setScale(0.85)} title="Ресетуј"><Icon name="reset" size={15} /></button>
        </div>

        {selected && (
          <div className="mtm-info">
            <span>{selected.gender === "male" ? "👨" : "👩"}</span>
            <strong>{selected.first_name} {selected.last_name}</strong>
            {selected.birth_year && <span style={{ color: "#999" }}>{selected.birth_year}{selected.death_year ? `–${selected.death_year}` : ""}</span>}
            {selected.generational_line && <span style={{ color: "var(--gold-dark)" }}>{selected.generational_line}. кољено</span>}
            <button className="mtm-info-close" onClick={() => setSelected(null)}><Icon name="close" size={12} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
