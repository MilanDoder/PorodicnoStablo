import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";
import TreeNode from "./TreeNode";
import HorizTree from "./HorizTree";
import DetailPanel from "./DetailPanel";
import MemberModal from "./MemberModal";
import { FAMILY_SURNAME } from "../config";

const MIN_SCALE = 0.2;
const MAX_SCALE = 2.5;
const DEFAULT_SCALE = 0.85;

const EMPTY_REQ = {
  first_name: "", last_name: FAMILY_SURNAME, gender: "male",
  birth_year: "", death_year: "", notes: "", parent_ids: [], spouse_name: "",
};

export default function TreeView({ members, isAdmin, user, onEdit, onSaveMember, onDelete, selected, onSelect }) {
  const [addChildOf,    setAddChildOf]    = useState(null);
  const [requestParent, setRequestParent] = useState(null);
  const [reqForm,       setReqForm]       = useState(EMPTY_REQ);
  const [reqSaving,     setReqSaving]     = useState(false);
  const [reqSuccess,    setReqSuccess]    = useState(false);
  const [scale,         setScale]         = useState(DEFAULT_SCALE);
  const [horizMode,     setHorizMode]     = useState(false);

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
  const getTouchDist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

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
      setScale(s => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * (newDist / lastDist.current))));
      lastDist.current = newDist;
    }
  };
  const onTouchEnd = (e) => {
    if (e.touches.length === 0) { lastTouches.current = null; lastDist.current = null; }
  };

  // ── Popravljeno centriranje ───────────────────────────────────────────────
  const scrollToMember = useCallback((memberId) => {
    if (!canvasRef.current || !innerRef.current) return;
    const el = innerRef.current.querySelector(`[data-member-id="${memberId}"]`);
    if (!el) return;
    const canvas = canvasRef.current;
    const canvasRect = canvas.getBoundingClientRect();
    const elRect     = el.getBoundingClientRect();
    const dx = (elRect.left + elRect.width  / 2) - (canvasRect.left + canvasRect.width  / 2);
    const dy = (elRect.top  + elRect.height / 2) - (canvasRect.top  + canvasRect.height / 2);
    canvas.scrollTo({ left: canvas.scrollLeft + dx, top: canvas.scrollTop + dy, behavior: "smooth" });
    el.classList.add("node-flash");
    setTimeout(() => el.classList.remove("node-flash"), 1200);
  }, []);

  const drawMiniMap = useCallback(() => {
    const canvas = mmCanvasRef.current;
    const main   = canvasRef.current;
    const inner  = innerRef.current;
    if (!canvas || !main || !inner) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Scrollabilna povrsina = sve sto main moze da scrolluje
    const totalW = main.scrollWidth;
    const totalH = main.scrollHeight;
    if (!totalW || !totalH) return;

    const rx = W / totalW;
    const ry = H / totalH;

    // Cvorovi: pozicija u scroll koordinatama
    members.forEach(m => {
      const el = inner.querySelector(`[data-member-id="${m.id}"]`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();
      // Pozicija u scroll prostoru
      const nodeScrollX = r.left - mainRect.left + main.scrollLeft;
      const nodeScrollY = r.top  - mainRect.top  + main.scrollTop;
      ctx.fillStyle = m.gender === "male" ? "#4a7fa8" : "#b06080";
      ctx.fillRect(
        nodeScrollX * rx,
        nodeScrollY * ry,
        Math.max(4, r.width  * rx),
        Math.max(3, r.height * ry)
      );
    });

    // Viewport pravougaonik
    const vx = main.scrollLeft * rx;
    const vy = main.scrollTop  * ry;
    const vw = main.clientWidth  * rx;
    const vh = main.clientHeight * ry;
    ctx.strokeStyle = "rgba(200,150,62,0.9)"; ctx.lineWidth = 1.5;
    ctx.strokeRect(vx, vy, vw, vh);
    ctx.fillStyle = "rgba(200,150,62,0.1)"; ctx.fillRect(vx, vy, vw, vh);
  }, [members, scale]);

  // Scroll to root node on mount and mode change
  const scrollToRoot = useCallback(() => {
    const main = canvasRef.current;
    const inner = innerRef.current;
    if (!main || !inner) return;

    // Nadji root clanove direktno iz podataka (bez roditelja u stablu)
    const roots = members.filter(
      m => !(m.parent_ids || []).some(pid => members.find(x => x.id === pid))
    );
    // Uzmi primarni root (muski, ili prvi ako nema)
    const primaryRoots = roots.filter(m => {
      if (!m.spouse_id) return true;
      const sp = members.find(x => x.id === m.spouse_id);
      return !sp || m.id < sp.id;
    });
    const targetId = primaryRoots.length ? primaryRoots[0].id : (roots[0]?.id ?? null);
    if (!targetId) return;

    const el = inner.querySelector(`[data-member-id="${targetId}"]`);
    if (!el) return;

    const mainRect = main.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    // Scrolluj tako da root bude u gornjem-lijevom uglu sa paddingom
    const targetScrollLeft = (r.left - mainRect.left + main.scrollLeft) - 60;
    const targetScrollTop  = (r.top  - mainRect.top  + main.scrollTop)  - 60;
    main.scrollTo({ left: Math.max(0, targetScrollLeft), top: Math.max(0, targetScrollTop), behavior: "smooth" });
  }, [members]);

  useEffect(() => {
    // Cekamo da se DOM potpuno renderuje prije scrollanja
    // requestAnimationFrame x2 garantuje da su layout i paint završeni
    let raf1, raf2;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        scrollToRoot();
      });
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [horizMode, members.length, scrollToRoot]);

  useEffect(() => {
    const main = canvasRef.current;
    if (!main) return;
    const h = () => drawMiniMap();
    main.addEventListener("scroll", h, { passive: true });
    return () => main.removeEventListener("scroll", h);
  }, [drawMiniMap]);

  useEffect(() => { const t = setTimeout(drawMiniMap, 150); return () => clearTimeout(t); }, [drawMiniMap, scale, members]);

  const onMiniMapClick = (e) => {
    const canvas = mmCanvasRef.current, main = canvasRef.current, inner = innerRef.current;
    if (!canvas || !main || !inner) return;
    const rect = canvas.getBoundingClientRect();
    main.scrollLeft = ((e.clientX - rect.left) / canvas.width)  * inner.scrollWidth  - main.clientWidth  / 2;
    main.scrollTop  = ((e.clientY - rect.top)  / canvas.height) * inner.scrollHeight - main.clientHeight / 2;
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
    await onSaveMember({ ...form, parent_ids: [addChildOf.id, ...(addChildOf.spouse_id ? [addChildOf.spouse_id] : [])] });
    setAddChildOf(null);
  };

  const handleRequestChild = (parent) => {
    setReqForm({ ...EMPTY_REQ, last_name: parent.last_name, parent_ids: [parent.id, ...(parent.spouse_id ? [parent.spouse_id] : [])] });
    setRequestParent(parent);
    setReqSuccess(false);
  };

  const handleSubmitRequest = async () => {
    if (!reqForm.first_name) return;
    setReqSaving(true);
    try {
      const { error } = await supabase.from("data_requests").insert({
        user_id: user?.id, user_email: user?.email,
        first_name: reqForm.first_name, last_name: reqForm.last_name,
        gender: reqForm.gender,
        birth_year: reqForm.birth_year ? parseInt(reqForm.birth_year) : null,
        death_year: reqForm.death_year ? parseInt(reqForm.death_year) : null,
        notes: reqForm.notes || null, parent_ids: reqForm.parent_ids,
        spouse_name: reqForm.spouse_name || null,
        status: "pending",
      });
      if (error) { alert("Грешка при слању: " + error.message); return; }
      setReqSuccess(true);
      setTimeout(() => { setRequestParent(null); setReqSuccess(false); }, 2500);
    } catch { alert("Неочекивана грешка."); }
    finally { setReqSaving(false); }
  };

  const setReq = (k, v) => setReqForm(p => ({ ...p, [k]: v }));

  return (
    <div className="tree-wrap">
      {/* ── Toggle dugme ─────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute", top: "0.6rem", left: "1rem", zIndex: 20,
        display: "flex", gap: "0.4rem"
      }}>
        <button
          className={`btn btn-sm ${!horizMode ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setHorizMode(false)}
          title="Вертикални приказ"
        >
          <Icon name="tree" size={13} /> Вертикално
        </button>
        <button
          className={`btn btn-sm ${horizMode ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setHorizMode(true)}
          title="Хоризонтални приказ"
        >
          <Icon name="list" size={13} /> Хоризонтално
        </button>
      </div>

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
          {horizMode ? (
            /* ── HORIZONTALNI PRIKAZ ── */
            <HorizTree members={members} selected={selected} onSelect={onSelect} />
          ) : (
            /* ── VERTIKALNI PRIKAZ ── */
            <>
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
                      onRequestChild={handleRequestChild}
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
            </>
          )}
        </div>
      </div>

      {/* Kontrole zoom */}
      <div className="tree-controls">
        <button className="tree-ctrl-btn" onClick={() => setScale(s => Math.min(MAX_SCALE, +(s + 0.1).toFixed(2)))} title="Увећај"><Icon name="zoomin" size={16} /></button>
        <div className="zoom-slider-wrap">
          <input
            type="range"
            className="zoom-slider"
            min={MIN_SCALE}
            max={MAX_SCALE}
            step={0.05}
            value={scale}
            onChange={e => setScale(parseFloat(e.target.value))}
            title="Зум"
          />
          <span className="zoom-label">{Math.round(scale * 100)}%</span>
        </div>
        <button className="tree-ctrl-btn" onClick={() => setScale(s => Math.max(MIN_SCALE, +(s - 0.1).toFixed(2)))} title="Умањи"><Icon name="zoomout" size={16} /></button>
        <button className="tree-ctrl-btn" onClick={() => setScale(DEFAULT_SCALE)} title="Ресетуј"><Icon name="reset" size={16} /></button>
      </div>

      <div className="minimap-wrap">
        <div className="minimap-label">Мапа стабла</div>
        <canvas ref={mmCanvasRef} className="minimap-canvas" width={180} height={110} onClick={onMiniMapClick} title="Кликните за навигацију" />
      </div>

      <DetailPanel
        member={selected}
        members={members}
        isAdmin={isAdmin}
        onEdit={() => onEdit(selected)}
        onDelete={id => { onDelete(id); onSelect(null); }}
        onNavigateTo={scrollToMember}
        onSelect={onSelect}
        onRequestChild={!isAdmin ? handleRequestChild : undefined}
      />

      {addChildOf && (
        <MemberModal
          member={{ first_name: "", last_name: addChildOf.last_name, birth_year: "", death_year: null, gender: "male", parent_ids: [addChildOf.id], spouse_id: null, notes: "" }}
          members={members}
          onSave={handleSaveChild}
          onClose={() => setAddChildOf(null)}
        />
      )}

      {requestParent && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setRequestParent(null); }}>
          <div className="modal" style={{ width: 480 }}>
            <div className="modal-head">
              <span className="modal-title">Предложи дијете за: {requestParent.first_name} {requestParent.last_name}</span>
              <button className="modal-close" onClick={() => setRequestParent(null)}><Icon name="x" size={16} /></button>
            </div>
            <div className="modal-body">
              {reqSuccess ? (
                <div className="req-success" style={{ textAlign: "center", padding: "1.5rem" }}>✓ Захтјев је успјешно послат!</div>
              ) : (
                <>
                  <p style={{ fontSize: ".75rem", color: "#777", marginBottom: "1rem", lineHeight: 1.6 }}>
                    Попуните податке о новом члану. Администратор ће прегледати ваш захтјев.
                  </p>
                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label">Ime *</label>
                      <input className="form-input" value={reqForm.first_name} onChange={e => setReq("first_name", e.target.value)} placeholder="нпр. Марко" autoFocus />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Презиме</label>
                      <input className="form-input" value={reqForm.last_name} onChange={e => setReq("last_name", e.target.value)} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Пол</label>
                      <select className="form-select" value={reqForm.gender} onChange={e => setReq("gender", e.target.value)}>
                        <option value="male">Мушки</option>
                        <option value="female">Женски</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Год. рођења</label>
                      <input className="form-input" type="number" value={reqForm.birth_year} onChange={e => setReq("birth_year", e.target.value)} placeholder="нпр. 1990" />
                    </div>
                    <div className="form-field full">
                      <label className="form-label">Напомена</label>
                      <textarea className="form-textarea" value={reqForm.notes} onChange={e => setReq("notes", e.target.value)} placeholder="Додатне информације..." />
                    </div>
                  </div>
                </>
              )}
            </div>
            {!reqSuccess && (
              <div className="modal-foot">
                <button className="btn btn-ghost btn-sm" onClick={() => setRequestParent(null)}>Откажи</button>
                <button className="btn btn-primary" onClick={handleSubmitRequest} disabled={reqSaving || !reqForm.first_name}>
                  {reqSaving ? <><Icon name="spinner" size={14} />Слање...</> : <><Icon name="send" size={14} />Пошаљи захтјев</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
