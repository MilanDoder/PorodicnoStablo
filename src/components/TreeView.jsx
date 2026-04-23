import { useState, useRef } from "react";
import Icon from "./Icon";
import TreeNode from "./TreeNode";
import DetailPanel from "./DetailPanel";
import MemberModal from "./MemberModal";

export default function TreeView({ members, isAdmin, onEdit, onSaveMember, onDelete, selected, onSelect }) {
  const [addChildOf, setAddChildOf] = useState(null);
  const [scale, setScale] = useState(0.85);
  const canvasRef = useRef(null);
  const dragging  = useRef(false);
  const startPos  = useRef({ x: 0, y: 0 });
  const scrollPos = useRef({ left: 0, top: 0 });

  const roots = members.filter(
    m => !(m.parent_ids || []).length || !(m.parent_ids || []).some(pid => members.find(x => x.id === pid))
  );
  const primaryRoots = roots.filter(m => {
    if (!m.spouse_id) return true;
    const sp = members.find(x => x.id === m.spouse_id);
    return !sp || m.id < sp.id;
  });

  const handleSaveChild = async (form) => {
    await onSaveMember({
      ...form,
      parent_ids: [addChildOf.id, ...(addChildOf.spouse_id ? [addChildOf.spouse_id] : [])],
    });
    setAddChildOf(null);
  };

  // ── Drag to pan ──────────────────────────────────────────────────────────
  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    dragging.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    scrollPos.current = { left: canvasRef.current.scrollLeft, top: canvasRef.current.scrollTop };
    canvasRef.current.style.cursor = "grabbing";
  };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    canvasRef.current.scrollLeft = scrollPos.current.left - dx;
    canvasRef.current.scrollTop  = scrollPos.current.top  - dy;
  };
  const onMouseUp = () => {
    dragging.current = false;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
  };

  return (
    <div className="tree-wrap">
      <div
        className="tree-canvas"
        ref={canvasRef}
        style={{ cursor: "grab" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div className="tree-inner" style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}>
          <div style={{ display: "flex", gap: "60px", alignItems: "flex-start", flexWrap: "nowrap", justifyContent: "center" }}>
            {primaryRoots.map(root => (
              <div key={root.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px" }}>
                <div style={{ fontSize: ".6rem", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gold-dark)", marginBottom: "6px" }}>
                  Grana: {root.first_name} {root.last_name}
                </div>
                <TreeNode
                  member={root}
                  members={members}
                  selected={selected}
                  onSelect={onSelect}
                  isAdmin={isAdmin}
                  onEdit={onEdit}
                  onAddChild={setAddChildOf}
                />
              </div>
            ))}
          </div>
          {isAdmin && (
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <button className="btn btn-ghost" onClick={() => onEdit(null)}>
                <Icon name="plus" size={14} />Dodaj novog člana
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="tree-controls">
        <button className="tree-ctrl-btn" onClick={() => setScale(s => Math.min(s + 0.1, 2))}><Icon name="zoomin" size={16} /></button>
        <button className="tree-ctrl-btn" onClick={() => setScale(s => Math.max(s - 0.1, 0.3))}><Icon name="zoomout" size={16} /></button>
        <button className="tree-ctrl-btn" onClick={() => setScale(0.85)}><Icon name="reset" size={16} /></button>
      </div>

      <DetailPanel
        member={selected}
        members={members}
        isAdmin={isAdmin}
        onEdit={() => onEdit(selected)}
        onDelete={id => { onDelete(id); onSelect(null); }}
      />

      {addChildOf && (
        <MemberModal
          member={{
            first_name: "", last_name: addChildOf.last_name,
            birth_year: "", death_year: null, gender: "male",
            parent_ids: [addChildOf.id], spouse_id: null, notes: "",
          }}
          members={members}
          onSave={handleSaveChild}
          onClose={() => setAddChildOf(null)}
        />
      )}
    </div>
  );
}
