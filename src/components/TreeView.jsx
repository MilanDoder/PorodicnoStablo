import { useState } from "react";
import Icon from "./Icon";
import TreeNode from "./TreeNode";
import DetailPanel from "./DetailPanel";
import MemberModal from "./MemberModal";

export default function TreeView({ members, isAdmin, onEdit, onSaveMember, onDelete, selected, onSelect }) {
  const [addChildOf, setAddChildOf] = useState(null);
  const [scale, setScale] = useState(0.85);

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

  return (
    <div className="tree-wrap">
      <div className="tree-canvas">
        <div className="tree-inner" style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <div style={{ display: "flex", gap: "60px", alignItems: "flex-start", flexWrap: "wrap" }}>
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

      <div className="tree-legend">
        <div className="tree-legend-title">🌳 Додеровићи — Пољана</div>
        <div className="legend-row">
          <div className="legend-dot" style={{ background: "var(--male-bg)", border: "1.5px solid var(--male-border)" }} />
          Muški član
        </div>
        <div className="legend-row">
          <div className="legend-dot" style={{ background: "var(--female-bg)", border: "1.5px solid var(--female-border)" }} />
          Ženski član
        </div>
        <div className="legend-row">
          <span style={{ color: "var(--gold)", fontSize: ".7rem" }}>❤</span>&nbsp;Bračni par
        </div>
        <div style={{ fontSize: ".58rem", color: "#aaa", marginTop: ".3rem" }}>
          {members.length} evidentiranih članova
        </div>
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
