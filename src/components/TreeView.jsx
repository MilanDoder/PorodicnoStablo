import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "./Icon";
import TreeNode from "./TreeNode";
import DetailPanel from "./DetailPanel";
import MemberModal from "./MemberModal";

const MIN_SCALE = 0.2;
const MAX_SCALE = 2.5;
const DEFAULT_SCALE = 0.85;

export default function TreeView({ members, isAdmin, onEdit, onSaveMember, onDelete, selected, onSelect }) {
  const [addChildOf, setAddChildOf] = useState(null);
  const [scale, setScale]           = useState(DEFAULT_SCALE);
  const canvasRef   = useRef(null);
  const innerRef    = useRef(null);
  const mmCanvasRef = useRef(null);

  const dragging  = useRef(false);
  const startPos  = useRef({ x: 0, y: 0 });
  const scrollPos = useRef({ left: 0, top: 0 });

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    dragging.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
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

  const lastTouches = useRef(null);
  const lastDist    = useRef(null);

  const getTouchDist = (t) =>
    Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      lastTouches.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      scrollPos.current   = { left: canvasRef.current.scrollLeft, top: canvasRef.current.scrollTop };
      lastDist.current    = null;
    } else if (e.touches.length === 2) {
      lastDist.current    = getTouchDist(e.touches);
      lastTouches.current = null;
    }
  };

  const onTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && lastTouches.current) {
      const dx = e.touches[0].clientX - lastTouches.current.x;
      const dy = e.touches[0].clientY - lastTouches.current.y;
      canvasRef.current.scrollLeft = scrollPos.current.left - dx;
      canvasRef.current.scrollTop  = scrollPos.current.top  - dy;
    } else if (e.touches.length === 2 && lastDist.current !== null) {
      const newDist = getTouchDist(e.touches);
      const ratio   = newDist / lastDist.current;
      setScale(s => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * ratio)));
      lastDist.current = newDist;
    }
  };

  const onTouchEnd = (e) => {
    if (e.touches.length === 0) {
      lastTouches.current = null;
      lastDist.current    = null;
    }
  };

  const scrollToMember = useCallback((memberId) => {
    if (!canvasRef.current || !innerRef.current) return;
    const el = innerRef.current.querySelector(`[data-member-id="${memberId}"]`);
    if (!el) return;
    const canvas    = canvasRef.current;
    const inner     = innerRef.current;
    const innerRect = inner.getBoundingClientRect();
    const elRect    = el.getBoundingClientRect();
    const elLeft    = (elRect.left - innerRect.left) / scale;
    const elTop     = (elRect.top  - innerRect.top)  / scale;
    const elW       = elRect.width  / scale;
    const elH       = elRect.height / scale;
    const targetLeft = (elLeft + elW / 2) * scale - canvas.clientWidth  / 2;
    const targetTop  = (elTop  + elH / 2) * scale - canvas.clientHeight / 2;
    canvas.scrollTo({ left: targetLeft, top: targetTop, behavior: "smooth" });
    el.classList.add("node-flash");
    setTimeout(() => el.classList.remove("node-flash"), 1200);
  }, [scale]);

  const drawMiniMap = useCallback(() => {
    const canvas = mmCanvasRef.current;
    const main   = canvasRef.current;
    const inner  = innerRef.current;
    if (!canvas || !main || !inner) return;
    const ctx    = canvas.getContext("2d");
    const W      = canvas.width;
    const H      = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const totalW = inner.scrollWidth;
    const totalH = inner.scrollHeight;
    if (!totalW || !totalH) return;
    const rx = W / totalW;
    const ry = H / totalH;
    members.forEach(m => {
      const el = inner.querySelector(`[data-member-id="${m.id}"]`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const i = inner.getBoundingClientRect();
      const x = ((r.left - i.left + main.scrollLeft) / scale) * rx;
      const y = ((r.top  - i.top  + main.scrollTop ) / scale) * ry;
      ctx.fillStyle = m.gender === "male" ? "#4a7fa8" : "#b06080";
      ctx.fillRect(x * scale, y * scale, Math.max(3, 8 * rx * scale), Math.max(2, 5 * ry * scale));
    });
    const vx = main.scrollLeft * rx;
    const vy = main.scrollTop  * ry;
    const vw = main.clientWidth  * rx;
    const vh = main.clientHeight * ry;
    ctx.strokeStyle = "rgba(200,150,62,0.8)";
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(vx, vy, vw, vh);
    ctx.fillStyle   = "rgba(200,150,62,0.06)";
    ctx.fillRect(vx, vy, vw, vh);
  }, [members, scale]);

  useEffect(() => {
    const main = canvasRef.current;
    if (!main) return;
    const handler = () => drawMiniMap();
    main.addEventListener("scroll", handler, { passive: true });
    return () => main.removeEventListener("scroll", handler);
  }, [drawMiniMap]);

  useEffect(() => {
    const t = setTimeout(drawMiniMap, 150);
    return () => clearTimeout(t);
  }, [drawMiniMap, scale, members]);

  const onMiniMapClick = (e) => {
    const canvas = mmCanvasRef.current;
    const main   = canvasRef.current;
    const inner  = innerRef.current;
    if (!canvas || !main || !inner) return;
    const rect = canvas.getBoundingClientRect();
    const px   = (e.clientX - rect.left) / canvas.width;
    const py   = (e.clientY - rect.top)  / canvas.height;
    main.scrollLeft = px * inner.scrollWidth  - main.clientWidth  / 2;
    main.scrollTop  = py * inner.scrollHeight - main.clientHeight / 2;
  };

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
      <div
        className="tree-canvas"
        ref={canvasRef}
        style={{ cursor: "grab" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="tree-inner"
          ref={innerRef}
          style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
        >
          <div style={{ display: "flex", gap: "60px", alignItems: "flex-start", flexWrap: "nowrap", justifyContent: "center" }}>
            {primaryRoots.map(root => (
              <div key={root.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px" }}>
                <div style={{ fontSize: ".6rem", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gold-dark)", marginBottom: "6px" }}>
                  Грана: {root.first_name} {root.last_name}
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
                <Icon name="plus" size={14} />Додај новог члана
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="tree-controls">
        <button className="tree-ctrl-btn" onClick={() => setScale(s => Math.min(MAX_SCALE, s + 0.1))} title="Увећај">
          <Icon name="zoomin" size={16} />
        </button>
        <button className="tree-ctrl-btn" onClick={() => setScale(s => Math.max(MIN_SCALE, s - 0.1))} title="Умањи">
          <Icon name="zoomout" size={16} />
        </button>
        <button className="tree-ctrl-btn" onClick={() => setScale(DEFAULT_SCALE)} title="Ресетуј">
          <Icon name="reset" size={16} />
        </button>
      </div>

      <div className="minimap-wrap">
        <div className="minimap-label">Мапа стабла</div>
        <canvas
          ref={mmCanvasRef}
          className="minimap-canvas"
          width={180}
          height={110}
          onClick={onMiniMapClick}
          title="Кликните за навигацију"
        />
      </div>

      <DetailPanel
        member={selected}
        members={members}
        isAdmin={isAdmin}
        onEdit={() => onEdit(selected)}
        onDelete={id => { onDelete(id); onSelect(null); }}
        onNavigateTo={scrollToMember}
        onSelect={onSelect}
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
