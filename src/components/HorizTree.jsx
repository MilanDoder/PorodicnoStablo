/**
 * Horizontalno stablo: korijen lijevo, generacije desno.
 * Svaki čvor prikazuje ime+prezime+koljeno.
 * Linije se crtaju SVG-om koji je apsolutno pozicioniran.
 */
import { useRef, useEffect, useState } from "react";

const NODE_W  = 124;
const NODE_H  = 50;   // visina jednog čvora
const PAIR_GAP = 4;   // razmak između člana i supružnika
const V_GAP   = 14;   // vertikalni razmak između braće/sestara
const H_STEP  = 180;  // horizontalni korak između generacija

function getChildren(member, members) {
  // Samo djeca čiji je ovaj član "primarni" roditelj (izbjegavamo duplikate)
  return members.filter(m => {
    if (!(m.parent_ids || []).includes(member.id)) return false;
    // Ako dijete ima dva roditelja u stablu, prikaži ga samo pod muškim
    const parents = (m.parent_ids || []).map(pid => members.find(x => x.id === pid)).filter(Boolean);
    if (parents.length > 1) {
      const male = parents.find(p => p.gender === "male");
      if (male && male.id !== member.id) return false;
    }
    return true;
  });
}

// Izračunaj ukupnu visinu podstabla jednog člana
function subtreeHeight(member, members) {
  const children = getChildren(member, members);
  const spouse   = members.find(m => m.id === member.spouse_id);
  const selfH    = spouse ? NODE_H * 2 + PAIR_GAP : NODE_H;
  if (children.length === 0) return selfH;
  const childrenH = children.reduce((sum, c, i) =>
    sum + subtreeHeight(c, members) + (i < children.length - 1 ? V_GAP : 0), 0);
  return Math.max(selfH, childrenH);
}

// Rekurzivno postavljanje pozicija čvorova
function layoutTree(member, members, x, y, positions) {
  const children = getChildren(member, members);
  const spouse   = members.find(m => m.id === member.spouse_id);
  const selfH    = spouse ? NODE_H * 2 + PAIR_GAP : NODE_H;

  if (children.length === 0) {
    positions[member.id] = { x, y, cx: x + NODE_W, cy: y + selfH / 2 };
    if (spouse) positions[spouse.id] = { x, y: y + NODE_H + PAIR_GAP };
    return selfH;
  }

  // Ukupna visina djece
  const childrenH = children.reduce((sum, c, i) =>
    sum + subtreeHeight(c, members) + (i < children.length - 1 ? V_GAP : 0), 0);

  const totalH = Math.max(selfH, childrenH);

  // Centriramo roditelja u odnosu na djecu
  const parentY = y + (totalH - selfH) / 2;
  positions[member.id] = {
    x,
    y: parentY,
    cx: x + NODE_W,         // desna ivica (polazište linije)
    cy: parentY + selfH / 2, // centar Y roditelja
  };
  if (spouse) positions[spouse.id] = { x, y: parentY + NODE_H + PAIR_GAP };

  // Pozicioniraj djecu
  let curY = y;
  children.forEach((child, i) => {
    const childH = subtreeHeight(child, members);
    layoutTree(child, members, x + H_STEP, curY, positions);
    curY += childH + (i < children.length - 1 ? V_GAP : 0);
  });

  return totalH;
}

function NodeBox({ member, pos, selected, onSelect }) {
  if (!pos) return null;
  return (
    <div
      data-member-id={member.id}
      className={`member-node ${member.gender}${selected?.id === member.id ? " sel" : ""}${member.featured ? " featured" : ""}`}
      style={{
        position: "absolute",
        left: pos.x,
        top:  pos.y,
        width: NODE_W,
        minHeight: NODE_H,
        boxSizing: "border-box",
        cursor: "pointer",
      }}
      onClick={() => onSelect(member)}
    >
      {member.featured && <span className="node-featured-badge">★</span>}
      <div className="node-name">{member.first_name} {member.last_name}</div>
      {member.generational_line && (
        <div className="node-note" style={{ color: "var(--gold-dark)", fontWeight: 600 }}>
          {member.generational_line}. кољено
        </div>
      )}
    </div>
  );
}

// Crta SVG linije između roditelja i djece
function Lines({ member, members, positions }) {
  const children = getChildren(member, members);
  if (children.length === 0) return null;

  const pPos = positions[member.id];
  if (!pPos) return null;

  const lines = [];
  const midX  = pPos.cx + (H_STEP - NODE_W) / 2; // sredina horizontalnog koraka

  children.forEach(child => {
    const cPos = positions[child.id];
    if (!cPos) return;
    const cCY = cPos.y + (members.find(m => m.id === child.spouse_id) ? NODE_H + PAIR_GAP / 2 : NODE_H / 2);

    // Linija: roditelj → sredina → dijete
    lines.push(
      <path
        key={child.id}
        d={`M ${pPos.cx} ${pPos.cy} H ${midX} V ${cCY} H ${cPos.x}`}
        fill="none"
        stroke="rgba(200,150,62,0.55)"
        strokeWidth="2"
      />
    );

    // Rekurzija za djecu djeteta
  });

  return <>{lines}</>;
}

export default function HorizTree({ members, selected, onSelect }) {
  const roots = members.filter(
    m => !(m.parent_ids || []).length || !(m.parent_ids || []).some(pid => members.find(x => x.id === pid))
  );
  const primaryRoots = roots.filter(m => {
    if (!m.spouse_id) return true;
    const sp = members.find(x => x.id === m.spouse_id);
    return !sp || m.id < sp.id;
  });

  // Izgradi pozicije
  const positions = {};
  let curY = 40;
  primaryRoots.forEach(root => {
    const h = layoutTree(root, members, 40, curY, positions);
    curY += h + 60;
  });

  // Dimenzije canvasa
  const maxX = Object.values(positions).reduce((m, p) => Math.max(m, p.x + NODE_W + 40), 400);
  const maxY = curY;

  // Skupi sve SVG linije rekurzivno
  const allLines = [];
  const collectLines = (member) => {
    const children = getChildren(member, members);
    if (children.length > 0) {
      allLines.push(
        <Lines key={member.id} member={member} members={members} positions={positions} />
      );
      children.forEach(collectLines);
    }
  };
  primaryRoots.forEach(collectLines);

  return (
    <div style={{ position: "relative", width: maxX, height: maxY, minWidth: maxX }}>
      {/* SVG linije ispod čvorova */}
      <svg
        style={{ position: "absolute", top: 0, left: 0, width: maxX, height: maxY, pointerEvents: "none" }}
        viewBox={`0 0 ${maxX} ${maxY}`}
      >
        {allLines}
      </svg>

      {/* Čvorovi */}
      {members.map(m => {
        const pos = positions[m.id];
        if (!pos) return null;
        return <NodeBox key={m.id} member={m} pos={pos} selected={selected} onSelect={onSelect} />;
      })}
    </div>
  );
}
