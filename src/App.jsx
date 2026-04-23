import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18 }) => {
  const icons = {
    user: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
    lock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    close: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    logout: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    tree: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20M6 6l12 12M18 6L6 18"/></svg>,
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    shield: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    zoomin: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
    zoomout: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
    reset: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.1"/></svg>,
    spinner: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:"spin 1s linear infinite"}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
    mail: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    inbox: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    clock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    history: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.1"/></svg>,
    image: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    send: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  };
  return icons[name] || null;
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Josefin+Sans:wght@300;400;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #1a1008; --parchment: #f5efe0; --cream: #fdf8ef;
    --gold: #c8963e; --gold-light: #e8b85a; --gold-dark: #8a6020;
    --rust: #8b3a1a; --sage: #4a6741;
    --male-bg: #ddeeff; --male-border: #4a7fa8;
    --female-bg: #fde8f0; --female-border: #b06080;
    --shadow: 0 4px 24px rgba(26,16,8,0.15);
    --green: #2d6a4f; --red: #8b3a1a;
  }
  body { font-family:'Josefin Sans',sans-serif; background:var(--cream); color:var(--ink); }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

  /* LOGIN */
  .login-page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:radial-gradient(ellipse at 30% 40%,#2a1800,#0d0800); position:relative; overflow:hidden; }
  .login-bg-text { position:absolute; font-family:'Cormorant Garamond',serif; font-size:16rem; color:rgba(200,150,62,.04); font-weight:300; top:50%; left:50%; transform:translate(-50%,-50%); user-select:none; white-space:nowrap; }
  .login-card { background:var(--parchment); border:1px solid rgba(200,150,62,.4); box-shadow:0 8px 40px rgba(26,16,8,.4); padding:3rem 3.5rem; width:430px; position:relative; animation:fadeUp .6s ease both; }
  .login-card::before,.login-card::after { content:''; position:absolute; width:20px; height:20px; border-color:var(--gold); border-style:solid; }
  .login-card::before { top:12px; left:12px; border-width:2px 0 0 2px; }
  .login-card::after  { bottom:12px; right:12px; border-width:0 2px 2px 0; }
  .login-logo { text-align:center; margin-bottom:2rem; }
  .login-title { font-family:'Cormorant Garamond',serif; font-size:2rem; font-weight:600; color:var(--ink); }
  .login-family { font-family:'Cormorant Garamond',serif; font-size:1.1rem; color:var(--gold-dark); font-style:italic; margin-top:.2rem; }
  .login-subtitle { font-size:.65rem; letter-spacing:.2em; color:var(--gold-dark); text-transform:uppercase; margin-top:.3rem; }
  .divider { height:1px; background:linear-gradient(to right,transparent,var(--gold),transparent); margin:1.5rem 0; }
  .field-group { margin-bottom:1.25rem; }
  .field-label { font-size:.65rem; letter-spacing:.15em; text-transform:uppercase; color:var(--gold-dark); margin-bottom:.4rem; display:block; }
  .field-wrapper { position:relative; }
  .field-icon { position:absolute; left:.8rem; top:50%; transform:translateY(-50%); color:var(--gold-dark); opacity:.7; pointer-events:none; }
  .field-input { width:100%; padding:.75rem .75rem .75rem 2.5rem; background:rgba(255,255,255,.6); border:1px solid rgba(200,150,62,.3); font-family:'Josefin Sans',sans-serif; font-size:.85rem; color:var(--ink); outline:none; transition:all .2s; }
  .field-input:focus { border-color:var(--gold); background:white; box-shadow:0 0 0 3px rgba(200,150,62,.1); }
  .login-btn { width:100%; padding:.9rem; background:linear-gradient(135deg,var(--gold-dark),var(--gold)); border:none; color:white; font-family:'Josefin Sans',sans-serif; font-size:.75rem; letter-spacing:.2em; text-transform:uppercase; cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:.5rem; }
  .login-btn:hover:not(:disabled) { filter:brightness(1.1); transform:translateY(-1px); }
  .login-btn:disabled { opacity:.7; cursor:not-allowed; }
  .login-error { background:rgba(139,58,26,.1); border:1px solid rgba(139,58,26,.3); color:var(--rust); padding:.6rem 1rem; font-size:.8rem; margin-bottom:1rem; text-align:center; }

  /* LAYOUT */
  .app-layout { display:flex; height:100vh; overflow:hidden; }
  .sidebar { width:220px; flex-shrink:0; background:#1a1008; display:flex; flex-direction:column; border-right:1px solid rgba(200,150,62,.2); }
  .sidebar-header { padding:1.25rem 1rem .8rem; border-bottom:1px solid rgba(200,150,62,.1); }
  .sidebar-logo { font-family:'Cormorant Garamond',serif; font-size:1.15rem; color:var(--gold-light); }
  .sidebar-sub { font-size:.58rem; letter-spacing:.12em; text-transform:uppercase; color:rgba(200,150,62,.45); margin-top:.15rem; }
  .sidebar-user { padding:.8rem 1rem; display:flex; align-items:center; gap:.6rem; border-bottom:1px solid rgba(200,150,62,.1); }
  .sidebar-avatar { width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,var(--gold-dark),var(--gold)); display:flex; align-items:center; justify-content:center; color:white; font-size:.75rem; flex-shrink:0; }
  .sidebar-username { font-size:.75rem; color:rgba(255,255,255,.8); }
  .sidebar-role { font-size:.58rem; letter-spacing:.08em; text-transform:uppercase; color:var(--gold); }
  .sidebar-nav { flex:1; padding:.75rem 0; overflow-y:auto; }
  .nav-item { display:flex; align-items:center; gap:.6rem; padding:.65rem 1rem; color:rgba(255,255,255,.45); font-size:.7rem; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; transition:all .2s; border-left:2px solid transparent; background:none; border-right:none; border-top:none; border-bottom:none; width:100%; text-align:left; }
  .nav-item:hover { color:var(--gold-light); background:rgba(200,150,62,.05); }
  .nav-item.active { color:var(--gold-light); border-left-color:var(--gold); background:rgba(200,150,62,.08); }
  .nav-badge { margin-left:auto; background:var(--rust); color:white; font-size:.55rem; padding:.1rem .35rem; border-radius:10px; }
  .sidebar-footer { padding:.8rem 1rem; border-top:1px solid rgba(200,150,62,.1); }
  .logout-btn { display:flex; align-items:center; gap:.5rem; color:rgba(255,255,255,.3); font-size:.65rem; letter-spacing:.1em; text-transform:uppercase; cursor:pointer; background:none; border:none; transition:color .2s; }
  .logout-btn:hover { color:var(--rust); }
  .main-content { flex:1; overflow:hidden; display:flex; flex-direction:column; }
  .topbar { padding:.8rem 1.5rem; background:white; border-bottom:1px solid rgba(200,150,62,.15); display:flex; align-items:center; justify-content:space-between; box-shadow:0 2px 8px rgba(26,16,8,.06); flex-shrink:0; }
  .topbar-title { font-family:'Cormorant Garamond',serif; font-size:1.4rem; color:var(--ink); }
  .topbar-actions { display:flex; gap:.5rem; align-items:center; }
  .btn { display:inline-flex; align-items:center; gap:.4rem; padding:.45rem .9rem; font-family:'Josefin Sans',sans-serif; font-size:.68rem; letter-spacing:.1em; text-transform:uppercase; cursor:pointer; border:none; transition:all .2s; }
  .btn-primary { background:linear-gradient(135deg,var(--gold-dark),var(--gold)); color:white; }
  .btn-primary:hover { filter:brightness(1.1); transform:translateY(-1px); }
  .btn-ghost { background:transparent; color:var(--gold-dark); border:1px solid rgba(200,150,62,.4); }
  .btn-ghost:hover { background:rgba(200,150,62,.05); border-color:var(--gold); }
  .btn-danger { background:rgba(139,58,26,.1); color:var(--rust); border:1px solid rgba(139,58,26,.2); }
  .btn-success { background:rgba(45,106,79,.1); color:var(--green); border:1px solid rgba(45,106,79,.3); }
  .btn-sm { padding:.3rem .6rem; font-size:.62rem; }

  /* LOADING */
  .loading-screen { display:flex; align-items:center; justify-content:center; height:100vh; background:var(--cream); flex-direction:column; gap:1rem; }
  .loading-text { font-family:'Cormorant Garamond',serif; font-size:1.2rem; color:var(--gold-dark); }

  /* TREE */
  .tree-wrap { flex:1; overflow:hidden; position:relative; background:var(--cream); display:flex; }
  .tree-canvas { flex:1; overflow:auto; position:relative; }
  .tree-inner { padding:40px; min-width:max-content; }
  .tree-controls { position:absolute; bottom:1rem; right:280px; display:flex; flex-direction:column; gap:.4rem; z-index:10; }
  .tree-ctrl-btn { width:34px; height:34px; background:white; border:1px solid rgba(200,150,62,.3); color:var(--gold-dark); cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(26,16,8,.1); transition:all .2s; }
  .tree-ctrl-btn:hover { background:var(--gold); color:white; }
  .tree-legend { position:absolute; top:1rem; left:1rem; background:white; border:1px solid rgba(200,150,62,.2); padding:.6rem .9rem; font-size:.65rem; box-shadow:0 2px 8px rgba(26,16,8,.08); z-index:5; }
  .tree-legend-title { font-family:'Cormorant Garamond',serif; font-size:.85rem; margin-bottom:.4rem; color:var(--ink); }
  .legend-row { display:flex; align-items:center; gap:.4rem; margin-bottom:.25rem; color:#555; }
  .legend-dot { width:10px; height:10px; flex-shrink:0; }
  .node-col { display:flex; flex-direction:column; align-items:center; }
  .couple-box { display:flex; align-items:center; }
  .member-node { width:110px; padding:.55rem .45rem .45rem; border:1.5px solid; text-align:center; cursor:pointer; transition:all .2s; position:relative; background:white; box-shadow:0 2px 6px rgba(26,16,8,.07); }
  .member-node.male { border-color:var(--male-border); background:var(--male-bg); }
  .member-node.female { border-color:var(--female-border); background:var(--female-bg); }
  .member-node:hover { transform:translateY(-2px); box-shadow:0 4px 16px rgba(26,16,8,.15); z-index:2; }
  .member-node.sel { outline:2.5px solid var(--gold); outline-offset:2px; z-index:3; }
  .node-emoji { font-size:1.2rem; margin-bottom:.15rem; line-height:1; }
  .node-name { font-family:'Cormorant Garamond',serif; font-size:.8rem; font-weight:600; color:var(--ink); line-height:1.2; }
  .node-note { font-size:.55rem; color:#888; margin-top:.1rem; }
  .node-actions { position:absolute; top:2px; right:2px; display:flex; gap:1px; opacity:0; transition:opacity .15s; }
  .member-node:hover .node-actions { opacity:1; }
  .node-act { width:18px; height:18px; border:none; background:rgba(255,255,255,.9); cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--gold-dark); }
  .node-act:hover { background:var(--gold); color:white; }
  .heart-sep { font-size:.65rem; color:var(--gold); padding:0 3px; flex-shrink:0; }
  .vert-line { width:2px; background:rgba(200,150,62,.45); flex-shrink:0; }
  .horiz-line { height:2px; background:rgba(200,150,62,.45); flex-shrink:0; }
  .child-stem { display:flex; flex-direction:column; align-items:center; }

  /* DETAIL PANEL */
  .detail-panel { width:260px; flex-shrink:0; background:white; border-left:1px solid rgba(200,150,62,.2); display:flex; flex-direction:column; overflow-y:auto; }
  .dp-head { padding:1rem; background:#1a1008; color:var(--gold-light); }
  .dp-emoji { font-size:2rem; margin-bottom:.2rem; }
  .dp-name { font-family:'Cormorant Garamond',serif; font-size:1.2rem; line-height:1.2; }
  .dp-tag { font-size:.6rem; letter-spacing:.1em; text-transform:uppercase; color:var(--gold); margin-top:.15rem; }
  .dp-body { padding:1rem; flex:1; }
  .dp-sec { margin-bottom:1rem; }
  .dp-sec-title { font-size:.58rem; letter-spacing:.13em; text-transform:uppercase; color:var(--gold-dark); border-bottom:1px solid rgba(200,150,62,.2); padding-bottom:.25rem; margin-bottom:.4rem; }
  .dp-row { display:flex; justify-content:space-between; margin-bottom:.3rem; font-size:.75rem; }
  .dp-key { color:#999; }
  .dp-val { color:var(--ink); }
  .dp-notes { font-size:.75rem; color:#666; font-style:italic; line-height:1.5; }
  .dp-foot { padding:.75rem 1rem; border-top:1px solid rgba(200,150,62,.12); display:flex; flex-direction:column; gap:.4rem; }
  .dp-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; flex:1; color:#ccc; font-size:.8rem; font-style:italic; gap:.5rem; padding:2rem; text-align:center; }

  /* LIST */
  .list-wrap { flex:1; overflow-y:auto; padding:1.5rem; }
  .search-wrap { position:relative; margin-bottom:1.25rem; display:flex; gap:.75rem; align-items:center; }
  .search-icon-abs { position:absolute; left:.7rem; top:50%; transform:translateY(-50%); color:var(--gold-dark); pointer-events:none; }
  .search-input { padding:.55rem .75rem .55rem 2.2rem; border:1px solid rgba(200,150,62,.3); background:white; font-family:'Josefin Sans',sans-serif; font-size:.8rem; color:var(--ink); outline:none; width:320px; }
  .search-input:focus { border-color:var(--gold); }
  .mtable { width:100%; border-collapse:collapse; background:white; box-shadow:var(--shadow); }
  .mtable th { background:#1a1008; color:var(--gold-light); font-size:.62rem; letter-spacing:.13em; text-transform:uppercase; padding:.7rem 1rem; text-align:left; font-weight:400; }
  .mtable td { padding:.65rem 1rem; border-bottom:1px solid rgba(200,150,62,.08); font-size:.78rem; color:var(--ink); vertical-align:middle; }
  .mtable tr:hover td { background:rgba(200,150,62,.04); }
  .gbadge { display:inline-flex; align-items:center; gap:.25rem; font-size:.65rem; padding:.12rem .45rem; border:1px solid; }
  .gbadge.male { color:var(--male-border); border-color:var(--male-border); background:var(--male-bg); }
  .gbadge.female { color:var(--female-border); border-color:var(--female-border); background:var(--female-bg); }

  /* MODAL */
  .overlay { position:fixed; inset:0; background:rgba(10,5,0,.7); display:flex; align-items:center; justify-content:center; z-index:1000; backdrop-filter:blur(2px); animation:fadeIn .2s ease; }
  .modal { background:var(--parchment); border:1px solid rgba(200,150,62,.3); width:500px; max-height:88vh; overflow-y:auto; box-shadow:0 8px 40px rgba(26,16,8,.3); animation:slideUp .25s ease; }
  .modal-head { padding:1rem 1.25rem; border-bottom:1px solid rgba(200,150,62,.2); display:flex; justify-content:space-between; align-items:center; background:#1a1008; color:var(--gold-light); }
  .modal-title { font-family:'Cormorant Garamond',serif; font-size:1.2rem; }
  .modal-close { background:none; border:none; color:rgba(200,150,62,.5); cursor:pointer; }
  .modal-close:hover { color:var(--gold-light); }
  .modal-body { padding:1.25rem; }
  .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:.85rem; }
  .form-field { display:flex; flex-direction:column; gap:.3rem; }
  .form-field.full { grid-column:1/-1; }
  .form-label { font-size:.62rem; letter-spacing:.1em; text-transform:uppercase; color:var(--gold-dark); }
  .form-input,.form-select,.form-textarea { padding:.55rem .7rem; border:1px solid rgba(200,150,62,.3); background:white; font-family:'Josefin Sans',sans-serif; font-size:.8rem; color:var(--ink); outline:none; transition:border-color .2s; }
  .form-input:focus,.form-select:focus,.form-textarea:focus { border-color:var(--gold); }
  .form-textarea { resize:vertical; min-height:55px; }
  .modal-foot { padding:.85rem 1.25rem; border-top:1px solid rgba(200,150,62,.12); display:flex; justify-content:flex-end; gap:.6rem; }

  /* ADMIN */
  .admin-wrap { flex:1; overflow-y:auto; padding:1.5rem; }
  .stat-row { display:flex; gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap; }
  .stat-box { background:white; border:1px solid rgba(200,150,62,.2); padding:1rem 1.25rem; min-width:130px; box-shadow:0 2px 8px rgba(26,16,8,.06); }
  .stat-val { font-family:'Cormorant Garamond',serif; font-size:2rem; color:var(--ink); line-height:1; }
  .stat-lbl { font-size:.62rem; letter-spacing:.1em; text-transform:uppercase; color:#888; margin-top:.15rem; }
  .section-title { font-family:'Cormorant Garamond',serif; font-size:1.1rem; margin-bottom:.75rem; color:var(--ink); }
  .info-box { background:white; border:1px solid rgba(200,150,62,.2); padding:1rem; font-size:.8rem; line-height:1.8; color:#555; }

  /* REQUESTS */
  .req-wrap { flex:1; overflow-y:auto; padding:1.5rem; }
  .req-card { background:white; border:1px solid rgba(200,150,62,.2); margin-bottom:1rem; box-shadow:0 2px 8px rgba(26,16,8,.05); animation:fadeUp .3s ease; }
  .req-card-head { padding:.75rem 1rem; border-bottom:1px solid rgba(200,150,62,.1); display:flex; justify-content:space-between; align-items:center; }
  .req-card-name { font-family:'Cormorant Garamond',serif; font-size:1.05rem; }
  .req-card-meta { font-size:.65rem; color:#999; }
  .req-card-body { padding:.75rem 1rem; display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:.5rem; }
  .req-field { font-size:.72rem; }
  .req-field-key { color:#999; font-size:.6rem; letter-spacing:.08em; text-transform:uppercase; }
  .req-card-foot { padding:.6rem 1rem; border-top:1px solid rgba(200,150,62,.08); display:flex; gap:.5rem; justify-content:flex-end; background:rgba(245,239,224,.4); }
  .status-badge { display:inline-flex; align-items:center; gap:.3rem; font-size:.62rem; padding:.15rem .5rem; border:1px solid; letter-spacing:.05em; text-transform:uppercase; }
  .status-pending { color:#7a5c00; border-color:#c8963e; background:rgba(200,150,62,.1); }
  .status-approved { color:var(--green); border-color:rgba(45,106,79,.4); background:rgba(45,106,79,.08); }
  .status-rejected { color:var(--rust); border-color:rgba(139,58,26,.3); background:rgba(139,58,26,.06); }
  .empty-state { text-align:center; padding:4rem 2rem; color:#bbb; }
  .empty-state-icon { font-size:3rem; margin-bottom:1rem; }
  .empty-state-text { font-family:'Cormorant Garamond',serif; font-size:1.2rem; color:#aaa; }

  /* HISTORY */
  .history-wrap { flex:1; overflow-y:auto; padding:1.5rem; }
  .timeline { position:relative; padding-left:2rem; }
  .timeline::before { content:''; position:absolute; left:.5rem; top:0; bottom:0; width:2px; background:linear-gradient(to bottom,var(--gold),transparent); }
  .tl-item { position:relative; margin-bottom:1.5rem; }
  .tl-dot { position:absolute; left:-1.65rem; top:.2rem; width:12px; height:12px; border-radius:50%; border:2px solid var(--gold); background:var(--cream); }
  .tl-date { font-size:.62rem; letter-spacing:.1em; text-transform:uppercase; color:var(--gold-dark); margin-bottom:.25rem; }
  .tl-card { background:white; border:1px solid rgba(200,150,62,.18); padding:.75rem 1rem; font-size:.78rem; line-height:1.6; color:#444; box-shadow:0 1px 4px rgba(26,16,8,.05); }
  .tl-card strong { color:var(--ink); }
  .tl-tag { display:inline-block; font-size:.58rem; padding:.1rem .4rem; border:1px solid rgba(200,150,62,.3); color:var(--gold-dark); margin-left:.4rem; text-transform:uppercase; letter-spacing:.06em; }

  /* GALLERY */
  .gallery-wrap { flex:1; overflow-y:auto; padding:1.5rem; }
  .gallery-intro { font-family:'Cormorant Garamond',serif; font-size:1rem; font-style:italic; color:#888; margin-bottom:1.25rem; line-height:1.6; }
  .gallery-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:1rem; }
  .gallery-item { background:white; border:1px solid rgba(200,150,62,.2); overflow:hidden; box-shadow:0 2px 8px rgba(26,16,8,.07); transition:transform .2s,box-shadow .2s; }
  .gallery-item:hover { transform:translateY(-3px); box-shadow:0 6px 20px rgba(26,16,8,.12); }
  .gallery-img { width:100%; height:200px; object-fit:cover; display:block; }
  .gallery-img-placeholder { width:100%; height:200px; background:linear-gradient(135deg,#e8d8b0,#d4c090); display:flex; align-items:center; justify-content:center; font-size:3rem; }
  .gallery-caption { padding:.65rem .85rem; border-top:1px solid rgba(200,150,62,.1); }
  .gallery-caption-title { font-family:'Cormorant Garamond',serif; font-size:.95rem; font-weight:600; color:var(--ink); }
  .gallery-caption-sub { font-size:.65rem; color:#999; margin-top:.15rem; }

  /* REQUEST FORM (user) */
  .req-form-wrap { flex:1; overflow-y:auto; padding:1.5rem; }
  .req-form-card { background:white; border:1px solid rgba(200,150,62,.2); padding:1.5rem; max-width:600px; box-shadow:var(--shadow); }
  .req-form-title { font-family:'Cormorant Garamond',serif; font-size:1.3rem; margin-bottom:.4rem; }
  .req-form-desc { font-size:.75rem; color:#777; line-height:1.6; margin-bottom:1.25rem; }
  .req-success { background:rgba(45,106,79,.08); border:1px solid rgba(45,106,79,.3); color:var(--green); padding:.8rem 1rem; font-size:.8rem; margin-bottom:1rem; }
`;

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setError("Pogrešan email ili lozinka."); return; }
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
      onLogin({ ...data.user, profile });
    } catch (e) {
      setError("Greška pri povezivanju.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-text">Додеровићи</div>
      <div className="login-card">
        <div className="login-logo">
          <div style={{fontSize:"2.5rem"}}>🌳</div>
          <div className="login-title">Додеровићи</div>
          <div className="login-family">Пољана</div>
          <div className="login-subtitle">Систем за управљање родословом</div>
        </div>
        <div className="divider"/>
        {error && <div className="login-error">{error}</div>}
        <div className="field-group">
          <label className="field-label">Email</label>
          <div className="field-wrapper">
            <span className="field-icon"><Icon name="mail" size={14}/></span>
            <input className="field-input" type="email" value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="vas@email.com" />
          </div>
        </div>
        <div className="field-group">
          <label className="field-label">Lozinka</label>
          <div className="field-wrapper">
            <span className="field-icon"><Icon name="lock" size={14}/></span>
            <input className="field-input" type="password" value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="lozinka" />
          </div>
        </div>
        <button className="login-btn" onClick={handleLogin} disabled={loading}>
          {loading ? <><Icon name="spinner" size={16}/>Prijava...</> : "Prijavite se →"}
        </button>
      </div>
    </div>
  );
}

// ─── MEMBER MODAL ─────────────────────────────────────────────────────────────
function MemberModal({ member, members, onSave, onClose }) {
  const [f, setF] = useState(member || {
    first_name:"", last_name:"Додеровић", birth_year:"", death_year:"",
    gender:"male", spouse_id:null, notes:"", parent_ids:[]
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF(p => ({...p, [k]: v}));
  const others = members.filter(m => m.id !== f.id);

  const handleSave = async () => {
    if (!f.first_name) return;
    setSaving(true);
    await onSave(f);
    setSaving(false);
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <span className="modal-title">{member ? "Uredi člana" : "Dodaj novog člana"}</span>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={18}/></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Ime</label>
              <input className="form-input" value={f.first_name} onChange={e => set("first_name", e.target.value)} placeholder="npr. Марко"/>
            </div>
            <div className="form-field">
              <label className="form-label">Prezime</label>
              <input className="form-input" value={f.last_name} onChange={e => set("last_name", e.target.value)}/>
            </div>
            <div className="form-field">
              <label className="form-label">Pol</label>
              <select className="form-select" value={f.gender} onChange={e => set("gender", e.target.value)}>
                <option value="male">Muški</option>
                <option value="female">Ženski</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Supružnik</label>
              <select className="form-select" value={f.spouse_id || ""} onChange={e => set("spouse_id", e.target.value ? parseInt(e.target.value) : null)}>
                <option value="">— bez supružnika —</option>
                {others.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">God. rođenja</label>
              <input className="form-input" type="number" value={f.birth_year || ""} onChange={e => set("birth_year", e.target.value || null)} placeholder="npr. 1920"/>
            </div>
            <div className="form-field">
              <label className="form-label">God. smrti</label>
              <input className="form-input" type="number" value={f.death_year || ""} onChange={e => set("death_year", e.target.value || null)} placeholder="prazno ako je živ/a"/>
            </div>
            <div className="form-field full">
              <label className="form-label">Roditelji</label>
              <select className="form-select" multiple style={{height:80}}
                value={(f.parent_ids || []).map(String)}
                onChange={e => set("parent_ids", Array.from(e.target.selectedOptions, o => parseInt(o.value)))}>
                {others.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
              </select>
              <span style={{fontSize:".62rem",color:"#999",marginTop:3}}>Ctrl+klik za više roditelja</span>
            </div>
            <div className="form-field full">
              <label className="form-label">Beleške</label>
              <textarea className="form-textarea" value={f.notes || ""} onChange={e => set("notes", e.target.value)}/>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Otkaži</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><Icon name="spinner" size={14}/>Čuvanje...</> : (member ? "Sačuvaj" : "Dodaj člana")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DETAIL PANEL ─────────────────────────────────────────────────────────────
function DetailPanel({ member, members, isAdmin, onEdit, onDelete }) {
  if (!member) return (
    <div className="detail-panel">
      <div className="dp-empty">
        <span style={{fontSize:"2rem"}}>👈</span>
        Kliknite na člana za detalje
      </div>
    </div>
  );
  const parents = members.filter(m => (member.parent_ids || []).includes(m.id));
  const children = members.filter(m => (m.parent_ids || []).includes(member.id));
  const spouse = members.find(m => m.id === member.spouse_id);
  const age = member.birth_year ? (member.death_year || new Date().getFullYear()) - member.birth_year : null;

  return (
    <div className="detail-panel">
      <div className="dp-head">
        <div className="dp-emoji">{member.gender === "male" ? "👨" : "👩"}</div>
        <div className="dp-name">{member.first_name} {member.last_name}</div>
        <div className="dp-tag">{member.gender === "male" ? "Muški" : "Ženski"}{member.death_year ? " · Preminuo/la" : ""}</div>
      </div>
      <div className="dp-body">
        <div className="dp-sec">
          <div className="dp-sec-title">Lični podaci</div>
          {member.birth_year && <div className="dp-row"><span className="dp-key">Rođen/a</span><span className="dp-val">{member.birth_year}.</span></div>}
          {member.death_year && <div className="dp-row"><span className="dp-key">Preminuo/la</span><span className="dp-val">{member.death_year}.</span></div>}
          {age && <div className="dp-row"><span className="dp-key">Starost</span><span className="dp-val">{age} god.</span></div>}
        </div>
        <div className="dp-sec">
          <div className="dp-sec-title">Porodica</div>
          {spouse && <div className="dp-row"><span className="dp-key">Supružnik</span><span className="dp-val">{spouse.first_name} {spouse.last_name}</span></div>}
          {parents.length > 0 && <div className="dp-row"><span className="dp-key">Roditelji</span><span className="dp-val">{parents.map(p => p.first_name).join(", ")}</span></div>}
          <div className="dp-row"><span className="dp-key">Djeca</span><span className="dp-val">{children.length > 0 ? children.map(c => c.first_name).join(", ") : "—"}</span></div>
        </div>
        {member.notes && <div className="dp-sec"><div className="dp-sec-title">Beleške</div><p className="dp-notes">{member.notes}</p></div>}
      </div>
      {isAdmin && (
        <div className="dp-foot">
          <button className="btn btn-ghost btn-sm" style={{justifyContent:"center"}} onClick={onEdit}><Icon name="edit" size={13}/>Uredi</button>
          <button className="btn btn-danger btn-sm" style={{justifyContent:"center"}} onClick={() => { if (window.confirm(`Obrisati ${member.first_name}?`)) onDelete(member.id); }}><Icon name="trash" size={13}/>Obriši</button>
        </div>
      )}
    </div>
  );
}

// ─── TREE NODE ────────────────────────────────────────────────────────────────
function TreeNode({ member, members, selected, onSelect, isAdmin, onEdit, onAddChild }) {
  const children = members.filter(m => {
    if (!(m.parent_ids || []).includes(member.id)) return false;
    const otherParent = (m.parent_ids || []).find(pid => pid !== member.id && members.find(x => x.id === pid));
    if (otherParent && otherParent < member.id) return false;
    return true;
  });
  const spouse = members.find(m => m.id === member.spouse_id);

  return (
    <div className="node-col">
      <div className="couple-box">
        <div className={`member-node ${member.gender}${selected?.id === member.id ? " sel" : ""}`} onClick={() => onSelect(member)}>
          <div className="node-emoji">{member.gender === "male" ? "👨" : "👩"}</div>
          <div className="node-name">{member.first_name}<br/>{member.last_name}</div>
          {member.birth_year && <div className="node-note">{member.birth_year}{member.death_year ? `–${member.death_year}` : ""}</div>}
          {isAdmin && <div className="node-actions">
            <button className="node-act" onClick={e => { e.stopPropagation(); onEdit(member); }}><Icon name="edit" size={9}/></button>
            <button className="node-act" onClick={e => { e.stopPropagation(); onAddChild(member); }}>+</button>
          </div>}
        </div>
        {spouse && <>
          <span className="heart-sep">❤</span>
          <div className={`member-node ${spouse.gender}${selected?.id === spouse.id ? " sel" : ""}`} onClick={() => onSelect(spouse)}>
            <div className="node-emoji">{spouse.gender === "male" ? "👨" : "👩"}</div>
            <div className="node-name">{spouse.first_name}<br/>{spouse.last_name}</div>
            {spouse.birth_year && <div className="node-note">{spouse.birth_year}{spouse.death_year ? `–${spouse.death_year}` : ""}</div>}
            {isAdmin && <div className="node-actions">
              <button className="node-act" onClick={e => { e.stopPropagation(); onEdit(spouse); }}><Icon name="edit" size={9}/></button>
            </div>}
          </div>
        </>}
      </div>
      {children.length > 0 && <>
        <div className="vert-line" style={{height:18}}/>
        <div style={{position:"relative", display:"flex", alignItems:"flex-start"}}>
          {children.length > 1 && <div className="horiz-line" style={{
            position:"absolute", top:0,
            left:`calc(50% - ${(children.length - 1) * 63}px)`,
            width:`${(children.length - 1) * 126}px`
          }}/>}
          {children.map(child => (
            <div key={child.id} className="child-stem">
              <div className="vert-line" style={{height:18}}/>
              <TreeNode member={child} members={members} selected={selected} onSelect={onSelect} isAdmin={isAdmin} onEdit={onEdit} onAddChild={onAddChild}/>
            </div>
          ))}
        </div>
      </>}
    </div>
  );
}

// ─── TREE VIEW ────────────────────────────────────────────────────────────────
function TreeView({ members, isAdmin, onEdit, onSaveMember, onDelete, selected, onSelect }) {
  const [addChildOf, setAddChildOf] = useState(null);
  const [scale, setScale] = useState(0.85);

  const roots = members.filter(m => !(m.parent_ids || []).length || !(m.parent_ids || []).some(pid => members.find(x => x.id === pid)));
  const primaryRoots = roots.filter(m => {
    if (!m.spouse_id) return true;
    const sp = members.find(x => x.id === m.spouse_id);
    return !sp || m.id < sp.id;
  });

  const handleAddChild = (parent) => setAddChildOf(parent);
  const handleSaveChild = async (form) => {
    await onSaveMember({ ...form, parent_ids: [addChildOf.id, ...(addChildOf.spouse_id ? [addChildOf.spouse_id] : [])] });
    setAddChildOf(null);
  };

  return (
    <div className="tree-wrap">
      <div className="tree-canvas">
        <div className="tree-inner" style={{transform:`scale(${scale})`, transformOrigin:"top left"}}>
          <div style={{display:"flex", gap:"60px", alignItems:"flex-start", flexWrap:"wrap"}}>
            {primaryRoots.map(root => (
              <div key={root.id} style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"8px"}}>
                <div style={{fontSize:".6rem",letterSpacing:".1em",textTransform:"uppercase",color:"var(--gold-dark)",marginBottom:"6px"}}>
                  Grana: {root.first_name} {root.last_name}
                </div>
                <TreeNode member={root} members={members} selected={selected} onSelect={onSelect} isAdmin={isAdmin} onEdit={onEdit} onAddChild={handleAddChild}/>
              </div>
            ))}
          </div>
          {isAdmin && (
            <div style={{textAlign:"center",marginTop:"2rem"}}>
              <button className="btn btn-ghost" onClick={() => onEdit(null)}><Icon name="plus" size={14}/>Dodaj novog člana</button>
            </div>
          )}
        </div>
      </div>
      <div className="tree-controls">
        <button className="tree-ctrl-btn" onClick={() => setScale(s => Math.min(s + .1, 2))}><Icon name="zoomin" size={16}/></button>
        <button className="tree-ctrl-btn" onClick={() => setScale(s => Math.max(s - .1, .3))}><Icon name="zoomout" size={16}/></button>
        <button className="tree-ctrl-btn" onClick={() => setScale(.85)}><Icon name="reset" size={16}/></button>
      </div>
      <div className="tree-legend">
        <div className="tree-legend-title">🌳 Додеровићи — Пољана</div>
        <div className="legend-row"><div className="legend-dot" style={{background:"var(--male-bg)",border:"1.5px solid var(--male-border)"}}/>Muški član</div>
        <div className="legend-row"><div className="legend-dot" style={{background:"var(--female-bg)",border:"1.5px solid var(--female-border)"}}/>Ženski član</div>
        <div className="legend-row"><span style={{color:"var(--gold)",fontSize:".7rem"}}>❤</span>&nbsp;Bračni par</div>
        <div style={{fontSize:".58rem",color:"#aaa",marginTop:".3rem"}}>{members.length} evidentiranih članova</div>
      </div>
      <DetailPanel member={selected} members={members} isAdmin={isAdmin} onEdit={() => onEdit(selected)} onDelete={(id) => { onDelete(id); onSelect(null); }}/>
      {addChildOf && <MemberModal member={{first_name:"",last_name:addChildOf.last_name,birth_year:"",death_year:null,gender:"male",parent_ids:[addChildOf.id],spouse_id:null,notes:""}} members={members} onSave={handleSaveChild} onClose={() => setAddChildOf(null)}/>}
    </div>
  );
}

// ─── LIST VIEW ────────────────────────────────────────────────────────────────
function ListView({ members, isAdmin, onEdit, onDelete }) {
  const [q, setQ] = useState("");
  const filtered = members.filter(m => `${m.first_name} ${m.last_name}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="list-wrap">
      <div className="search-wrap">
        <span className="search-icon-abs"><Icon name="search" size={14}/></span>
        <input className="search-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Pretraži po imenu..."/>
        <span style={{fontSize:".7rem",color:"#999"}}>{filtered.length} / {members.length}</span>
      </div>
      <table className="mtable">
        <thead><tr><th>Ime i prezime</th><th>Pol</th><th>Godišta</th><th>Roditelji</th><th>Djeca</th>{isAdmin && <th>Akcije</th>}</tr></thead>
        <tbody>{filtered.map(m => {
          const parents = members.filter(p => (m.parent_ids || []).includes(p.id));
          const children = members.filter(c => (c.parent_ids || []).includes(m.id));
          return <tr key={m.id}>
            <td><strong>{m.first_name} {m.last_name}</strong></td>
            <td><span className={`gbadge ${m.gender}`}>{m.gender === "male" ? "👨 Muški" : "👩 Ženski"}</span></td>
            <td style={{color:"#666"}}>{m.birth_year || "?"}{m.death_year ? `–${m.death_year}` : ""}</td>
            <td style={{fontSize:".73rem"}}>{parents.length > 0 ? parents.map(p => p.first_name).join(", ") : <span style={{color:"#ccc"}}>—</span>}</td>
            <td style={{fontSize:".73rem"}}>{children.length > 0 ? children.length : <span style={{color:"#ccc"}}>0</span>}</td>
            {isAdmin && <td><div style={{display:"flex",gap:".35rem"}}>
              <button className="btn btn-ghost btn-sm" onClick={() => onEdit(m)}><Icon name="edit" size={11}/>Uredi</button>
              <button className="btn btn-danger btn-sm" onClick={() => { if (window.confirm(`Obrisati ${m.first_name}?`)) onDelete(m.id); }}><Icon name="trash" size={11}/></button>
            </div></td>}
          </tr>;
        })}</tbody>
      </table>
    </div>
  );
}

// ─── GALLERY VIEW ─────────────────────────────────────────────────────────────
function GalleryView() {
  // Primjer slika — zamijeniti pravim URL-ovima iz Supabase Storage
  const photos = [
    {
      id: 1,
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
      title: "Пољана, 1952. година",
      sub: "Pogled na selo u jesen",
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1472791108553-c9405341e398?w=600&q=80",
      title: "Породични збор, 1971.",
      sub: "Прослава крсне славе — Додеровићи",
    },
    {
      id: 3,
      url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&q=80",
      title: "Стара кућа, 1938.",
      sub: "Прадједова кућа у Пољани",
    },
  ];

  return (
    <div className="gallery-wrap">
      <p className="gallery-intro">
        Fotografije i dokumenti iz arhive породице Додеровић. Снимци покривају период
        од почетка 20. вијека до данас — кућа, земља, збори и свечаности.
      </p>
      <div className="gallery-grid">
        {photos.map(p => (
          <div className="gallery-item" key={p.id}>
            <img
              className="gallery-img"
              src={p.url}
              alt={p.title}
              onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
            />
            <div className="gallery-img-placeholder" style={{display:"none"}}>📷</div>
            <div className="gallery-caption">
              <div className="gallery-caption-title">{p.title}</div>
              <div className="gallery-caption-sub">{p.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HISTORY VIEW ─────────────────────────────────────────────────────────────
function HistoryView() {
  const events = [
    { date: "Oktobar 2017.", tag: "Dopuna", text: <><strong>Бранко Светозаров Додеровић</strong> dopunio porodično stablo novim granama i dodao podatke o potomcima koji žive van Srbije.</> },
    { date: "Novembar 1990.", tag: "Osnivanje", text: <><strong>Мићо Обрадов Додеровић</strong> završio izradu originalnog rukopisa rodoslova. Rukopis sadrži više od četiri generacije evidentiranih članova из Пољане и околних sela.</> },
    { date: "1971.", tag: "Događaj", text: <>Porodični zbor u Пољани — proslava krсне slavе. Prisustvovalo je više od 60 članova porodice iz Srbije i dijaspore. Fotografije sa zbora čuvaju se u porodičnoj arhivi.</> },
    { date: "1952.", tag: "Istorija", text: <>Seoba dijela porodice Додеровић iz planinske Пољане prema Užicu u potrazi za boljim uslovima života. Ova grana zadržava prezime i vezu sa rodnim krajem.</> },
    { date: "1938.", tag: "Istorija", text: <>Izgradnja stare porodične kuće koja i danas stoji u Пољани. Kućа je bila centar porodičnog života za tri generacije — djeda, oca i sinova.</> },
    { date: "Kraj 19. vijeka", tag: "Poreklo", text: <>Najstariji evidentirani preci Додеровић dolaze iz šumadijskog kraja. Prezime je patronimskog porekla — nastalo od ličnog imena претка.</> },
  ];

  return (
    <div className="history-wrap">
      <div className="section-title" style={{marginBottom:"1.25rem"}}>Историјат породице Додеровић</div>
      <div className="timeline">
        {events.map((ev, i) => (
          <div className="tl-item" key={i}>
            <div className="tl-dot"/>
            <div className="tl-date">{ev.date} <span className="tl-tag">{ev.tag}</span></div>
            <div className="tl-card">{ev.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── REQUEST FORM (za korisnike) ──────────────────────────────────────────────
function RequestFormView({ user, members }) {
  const [f, setF] = useState({
    first_name:"", last_name:"Додеровић", gender:"male",
    birth_year:"", death_year:"", notes:"", parent_ids:[], spouse_id:""
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const set = (k, v) => setF(p => ({...p, [k]: v}));

  useEffect(() => { loadMyRequests(); }, []);

  const loadMyRequests = async () => {
    setLoadingReqs(true);
    const { data } = await supabase
      .from("data_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setMyRequests(data || []);
    setLoadingReqs(false);
  };

  const handleSubmit = async () => {
    if (!f.first_name) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      user_email: user.email,
      first_name: f.first_name,
      last_name: f.last_name,
      gender: f.gender,
      birth_year: f.birth_year ? parseInt(f.birth_year) : null,
      death_year: f.death_year ? parseInt(f.death_year) : null,
      notes: f.notes || null,
      parent_ids: f.parent_ids,
      spouse_id: f.spouse_id ? parseInt(f.spouse_id) : null,
      status: "pending",
    };
    const { error } = await supabase.from("data_requests").insert(payload);
    setSaving(false);
    if (!error) {
      setSuccess(true);
      setF({ first_name:"", last_name:"Додеровић", gender:"male", birth_year:"", death_year:"", notes:"", parent_ids:[], spouse_id:"" });
      setTimeout(() => setSuccess(false), 5000);
      loadMyRequests();
    }
  };

  const statusLabel = { pending:"Na čekanju", approved:"Prihvaćen", rejected:"Odbijen" };
  const statusClass = { pending:"status-pending", approved:"status-approved", rejected:"status-rejected" };
  const statusIcon = { pending:"clock", approved:"check", rejected:"x" };

  return (
    <div className="req-form-wrap">
      {/* FORMA */}
      <div className="req-form-card" style={{marginBottom:"2rem"}}>
        <div className="req-form-title">Pošaljite zahtjev za unos člana</div>
        <p className="req-form-desc">
          Ukoliko znate podatke o članu porodice koji nije evidentiran, popunite formu ispod.
          Administrator će pregledati vaš zahtjev i odlučiti da li se unese u stablo.
        </p>
        {success && <div className="req-success">✓ Zahtjev je uspješno poslat! Administrator će ga pregledati.</div>}
        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">Ime *</label>
            <input className="form-input" value={f.first_name} onChange={e => set("first_name", e.target.value)} placeholder="npr. Марко"/>
          </div>
          <div className="form-field">
            <label className="form-label">Prezime</label>
            <input className="form-input" value={f.last_name} onChange={e => set("last_name", e.target.value)}/>
          </div>
          <div className="form-field">
            <label className="form-label">Pol</label>
            <select className="form-select" value={f.gender} onChange={e => set("gender", e.target.value)}>
              <option value="male">Muški</option>
              <option value="female">Ženski</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">God. rođenja</label>
            <input className="form-input" type="number" value={f.birth_year} onChange={e => set("birth_year", e.target.value)} placeholder="npr. 1955"/>
          </div>
          <div className="form-field">
            <label className="form-label">God. smrti</label>
            <input className="form-input" type="number" value={f.death_year} onChange={e => set("death_year", e.target.value)} placeholder="prazno ako je živ/a"/>
          </div>
          <div className="form-field">
            <label className="form-label">Supružnik (iz stabla)</label>
            <select className="form-select" value={f.spouse_id} onChange={e => set("spouse_id", e.target.value)}>
              <option value="">— bez supružnika —</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
            </select>
          </div>
          <div className="form-field full">
            <label className="form-label">Roditelji (iz stabla)</label>
            <select className="form-select" multiple style={{height:80}}
              value={(f.parent_ids || []).map(String)}
              onChange={e => set("parent_ids", Array.from(e.target.selectedOptions, o => parseInt(o.value)))}>
              {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
            </select>
            <span style={{fontSize:".62rem",color:"#999",marginTop:3}}>Ctrl+klik za više roditelja</span>
          </div>
          <div className="form-field full">
            <label className="form-label">Napomena / Izvor podataka</label>
            <textarea className="form-textarea" value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="Opisite vezu ili izvor ovih podataka..."/>
          </div>
        </div>
        <div style={{marginTop:"1rem",display:"flex",justifyContent:"flex-end"}}>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || !f.first_name}>
            {saving ? <><Icon name="spinner" size={14}/>Slanje...</> : <><Icon name="send" size={14}/>Pošalji zahtjev</>}
          </button>
        </div>
      </div>

      {/* MOJI ZAHTJEVI */}
      <div className="section-title">Moji zahtjevi</div>
      {loadingReqs ? (
        <div style={{textAlign:"center",padding:"2rem",color:"#aaa"}}><Icon name="spinner" size={20}/></div>
      ) : myRequests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-text">Još niste poslali nijedan zahtjev.</div>
        </div>
      ) : (
        myRequests.map(req => (
          <div className="req-card" key={req.id}>
            <div className="req-card-head">
              <span className="req-card-name">{req.first_name} {req.last_name}</span>
              <span className={`status-badge ${statusClass[req.status]}`}>
                <Icon name={statusIcon[req.status]} size={10}/>
                {statusLabel[req.status]}
              </span>
            </div>
            <div className="req-card-body">
              <div className="req-field"><div className="req-field-key">Pol</div>{req.gender === "male" ? "Muški" : "Ženski"}</div>
              {req.birth_year && <div className="req-field"><div className="req-field-key">God. rođenja</div>{req.birth_year}.</div>}
              <div className="req-field"><div className="req-field-key">Poslato</div>{new Date(req.created_at).toLocaleDateString("sr-Latn")}</div>
            </div>
            {req.admin_note && (
              <div style={{padding:".5rem 1rem",fontSize:".72rem",color:"#666",borderTop:"1px solid rgba(200,150,62,.08)"}}>
                <span style={{color:"var(--gold-dark)",fontWeight:600}}>Admin komentar:</span> {req.admin_note}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ─── ADMIN REQUESTS VIEW ──────────────────────────────────────────────────────
function AdminRequestsView({ members, onMemberAdded }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [noteMap, setNoteMap] = useState({});

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("data_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setRequests(data || []);
    setLoading(false);
  };

  const handleDecision = async (req, decision) => {
    setProcessing(req.id);
    const adminNote = noteMap[req.id] || null;

    if (decision === "approved") {
      // Unesi člana u bazu
      const { data: newMember } = await supabase.from("members").insert({
        first_name: req.first_name,
        last_name: req.last_name,
        gender: req.gender,
        birth_year: req.birth_year,
        death_year: req.death_year,
        notes: req.notes,
        spouse_id: req.spouse_id || null,
      }).select().single();

      // Upiši roditelje
      const parentIds = Array.isArray(req.parent_ids) ? req.parent_ids : (req.parent_ids || []);
      if (newMember && parentIds.length > 0) {
        await supabase.from("member_parents").insert(
          parentIds.map(pid => ({ member_id: newMember.id, parent_id: pid }))
        );
      }
      onMemberAdded && onMemberAdded();
    }

    await supabase.from("data_requests").update({
      status: decision,
      admin_note: adminNote,
      reviewed_at: new Date().toISOString(),
    }).eq("id", req.id);

    setProcessing(null);
    loadRequests();
  };

  const parentNames = (parentIds) => {
    const ids = Array.isArray(parentIds) ? parentIds : [];
    return ids.map(pid => {
      const m = members.find(x => x.id === pid);
      return m ? `${m.first_name} ${m.last_name}` : `#${pid}`;
    }).join(", ") || "—";
  };

  return (
    <div className="req-wrap">
      {loading ? (
        <div style={{textAlign:"center",padding:"3rem",color:"#aaa"}}><Icon name="spinner" size={24}/></div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <div className="empty-state-text">Nema aktivnih zahtjeva.</div>
          <p style={{fontSize:".75rem",color:"#bbb",marginTop:".5rem"}}>Svi zahtjevi su obrađeni.</p>
        </div>
      ) : (
        <>
          <div style={{marginBottom:"1rem",fontSize:".75rem",color:"#888"}}>
            {requests.length} aktivnih zahtjeva na čekanju
          </div>
          {requests.map(req => (
            <div className="req-card" key={req.id}>
              <div className="req-card-head">
                <div>
                  <span className="req-card-name">{req.first_name} {req.last_name}</span>
                  <span style={{marginLeft:".5rem",fontSize:".65rem",color:"#aaa"}}>od: {req.user_email}</span>
                </div>
                <span className="req-card-meta">{new Date(req.created_at).toLocaleDateString("sr-Latn")} · {new Date(req.created_at).toLocaleTimeString("sr-Latn",{hour:"2-digit",minute:"2-digit"})}</span>
              </div>
              <div className="req-card-body">
                <div className="req-field"><div className="req-field-key">Pol</div>{req.gender === "male" ? "👨 Muški" : "👩 Ženski"}</div>
                {req.birth_year && <div className="req-field"><div className="req-field-key">God. rođenja</div>{req.birth_year}.</div>}
                {req.death_year && <div className="req-field"><div className="req-field-key">God. smrti</div>{req.death_year}.</div>}
                <div className="req-field"><div className="req-field-key">Roditelji</div>{parentNames(req.parent_ids)}</div>
                {req.spouse_id && <div className="req-field"><div className="req-field-key">Supružnik</div>{(() => { const m = members.find(x => x.id === req.spouse_id); return m ? `${m.first_name} ${m.last_name}` : `#${req.spouse_id}`; })()}</div>}
              </div>
              {req.notes && (
                <div style={{padding:".4rem 1rem .6rem",fontSize:".72rem",color:"#666",borderTop:"1px solid rgba(200,150,62,.08)"}}>
                  <span style={{color:"var(--gold-dark)",fontWeight:600}}>Napomena: </span>{req.notes}
                </div>
              )}
              <div style={{padding:".5rem 1rem",borderTop:"1px solid rgba(200,150,62,.08)"}}>
                <label style={{fontSize:".6rem",letterSpacing:".08em",textTransform:"uppercase",color:"var(--gold-dark)",display:"block",marginBottom:".3rem"}}>Komentar (opcionalno)</label>
                <input
                  className="form-input"
                  style={{width:"100%",marginBottom:".5rem"}}
                  placeholder="Komentar pri prihvatanju ili odbijanju..."
                  value={noteMap[req.id] || ""}
                  onChange={e => setNoteMap(m => ({...m, [req.id]: e.target.value}))}
                />
              </div>
              <div className="req-card-foot">
                <button className="btn btn-danger btn-sm" onClick={() => handleDecision(req, "rejected")} disabled={processing === req.id}>
                  {processing === req.id ? <Icon name="spinner" size={12}/> : <Icon name="x" size={12}/>}
                  Odbij
                </button>
                <button className="btn btn-success btn-sm" onClick={() => handleDecision(req, "approved")} disabled={processing === req.id}>
                  {processing === req.id ? <Icon name="spinner" size={12}/> : <Icon name="check" size={12}/>}
                  Prihvati i dodaj u stablo
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ members, currentUser, onMemberAdded }) {
  const [subTab, setSubTab] = useState("stats");
  const males = members.filter(x => x.gender === "male").length;
  const females = members.filter(x => x.gender === "female").length;
  const deceased = members.filter(x => x.death_year).length;
  const withChildren = members.filter(x => members.some(c => (c.parent_ids || []).includes(x.id))).length;

  const tabs = [
    { id:"stats",    label:"Statistika" },
    { id:"requests", label:"Lista zahtjeva" },
  ];

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",borderBottom:"1px solid rgba(200,150,62,.15)",background:"white",padding:"0 1.5rem",gap:".1rem",flexShrink:0}}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            style={{
              padding:".6rem 1rem",fontSize:".68rem",letterSpacing:".08em",textTransform:"uppercase",
              border:"none",borderBottom:`2px solid ${subTab===t.id?"var(--gold)":"transparent"}`,
              background:"none",color:subTab===t.id?"var(--gold-dark)":"#aaa",cursor:"pointer",
              transition:"all .15s",fontFamily:"'Josefin Sans',sans-serif"
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "stats" && (
        <div className="admin-wrap">
          <div className="stat-row">
            {[["🌳",members.length,"Članova ukupno"],["👨",males,"Muških"],["👩",females,"Ženskih"],["✝",deceased,"Preminulih"],["👪",withChildren,"Sa djecom"]].map(([e,v,l]) => (
              <div className="stat-box" key={l}><div style={{fontSize:"1.5rem"}}>{e}</div><div className="stat-val">{v}</div><div className="stat-lbl">{l}</div></div>
            ))}
          </div>
          <div className="section-title">Informacije o dokumentu</div>
          <div className="info-box">
            <div><strong>Izvor:</strong> Porodično stablo Додеровићи — Пољана</div>
            <div><strong>Autor:</strong> Мићо Обрадов Додеровић (do Novembra 1990. godine)</div>
            <div><strong>Dopunio:</strong> Бранко Светозаров Додеровић (do Oktobra 2017. godine)</div>
            <div><strong>Napomena:</strong> *1 Тешо — брат по оцу &nbsp;|&nbsp; *2 Драган — брат по оцу</div>
            <div style={{marginTop:".5rem",color:"#888",fontSize:".75rem"}}>Ulogovani kao: <strong>{currentUser?.email}</strong> · Rola: <strong>{currentUser?.profile?.role}</strong></div>
          </div>
        </div>
      )}
      {subTab === "requests" && <AdminRequestsView members={members} onMemberAdded={onMemberAdded}/>}
    </div>
  );
}


// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [view, setView] = useState("tree");
  const [selected, setSelected] = useState(null);
  const [editMember, setEditMember] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const isAdmin = user?.profile?.role === "admin";

  useEffect(() => {
    let initialDone = false;

    const fetchProfile = async (userId) => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
        return profile || null;
      } catch {
        return null;
      }
    };

    // Provjeri postojeću sesiju pri startu
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const profile = await fetchProfile(session.user.id);
        setUser({ ...session.user, profile });
      }
      initialDone = true;
      setLoading(false);
    }).catch(() => {
      initialDone = true;
      setLoading(false);
    });

    // Slušaj promjene (login/logout) — ignoriši INITIAL_SESSION jer ga getSession već obrađuje
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "INITIAL_SESSION") return;
      if (session) {
        const profile = await fetchProfile(session.user.id);
        setUser({ ...session.user, profile });
        if (!initialDone) { initialDone = true; setLoading(false); }
      } else {
        setUser(null);
        setMembers([]);
        if (!initialDone) { initialDone = true; setLoading(false); }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadMembers();
      if (isAdmin) loadPendingCount();
    }
  }, [user]);

  const loadMembers = async () => {
    const { data, error } = await supabase.from("members_with_parents").select("*").order("id");
    if (!error) setMembers(data || []);
  };

  const loadPendingCount = async () => {
    const { count } = await supabase.from("data_requests").select("*", { count:"exact", head:true }).eq("status","pending");
    setPendingCount(count || 0);
  };

  const handleSaveMember = async (form) => {
    const { parent_ids, ...memberData } = form;
    if (memberData.birth_year === "") memberData.birth_year = null;
    if (memberData.death_year === "") memberData.death_year = null;

    if (form.id) {
      await supabase.from("members").update(memberData).eq("id", form.id);
      await supabase.from("member_parents").delete().eq("member_id", form.id);
    } else {
      const { data } = await supabase.from("members").insert(memberData).select().single();
      form.id = data.id;
    }
    if ((parent_ids || []).length > 0) {
      await supabase.from("member_parents").insert(
        parent_ids.map(pid => ({ member_id: form.id, parent_id: pid }))
      );
    }
    await loadMembers();
    setShowModal(false);
    setEditMember(null);
  };

  const handleDelete = async (id) => {
    await supabase.from("members").delete().eq("id", id);
    await loadMembers();
    setSelected(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMembers([]);
  };

  if (loading) return (
    <>
      <style>{styles}</style>
      <div className="loading-screen">
        <Icon name="spinner" size={32}/>
        <div className="loading-text">Učitavanje...</div>
      </div>
    </>
  );

  if (!user) return <><style>{styles}</style><LoginPage onLogin={setUser}/></>;

  const nav = [
    { id:"tree",     icon:"tree",    label:"Porodično stablo" },
    { id:"list",     icon:"users",   label:"Lista članova" },
    ...(isAdmin
      ? [{ id:"admin",   icon:"shield",  label:"Admin panel", badge: pendingCount > 0 ? pendingCount : null }]
      : [{ id:"zahtjev", icon:"inbox",   label:"Zahtjev za unos" }]
    ),
    { id:"istorijat", icon:"history", label:"Istorijat" },
    { id:"galerija",  icon:"image",   label:"Galerija" },
  ];

  const displayName = user?.profile?.full_name || user?.email || "Korisnik";

  const topbarTitles = {
    tree:      "Porodično Stablo — Додеровићи",
    list:      "Lista članova",
    admin:     "Admin Panel",
    zahtjev:   "Zahtjev za unos",
    istorijat: "Istorijat porodice Додеровић",
    galerija:  "Galerija",
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">🌳 Додеровићи</div>
            <div className="sidebar-sub">Пољана · Породична архива</div>
          </div>
          <div className="sidebar-user">
            <div className="sidebar-avatar">{displayName[0]?.toUpperCase()}</div>
            <div>
              <div className="sidebar-username">{displayName}</div>
              <div className="sidebar-role">{isAdmin ? "Administrator" : "Korisnik"}</div>
            </div>
          </div>
          <nav className="sidebar-nav">
            {nav.map(n => (
              <button key={n.id} className={`nav-item${view === n.id ? " active" : ""}`} onClick={() => setView(n.id)}>
                <Icon name={n.icon} size={15}/>{n.label}
                {n.badge && <span className="nav-badge">{n.badge}</span>}
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            <button className="logout-btn" onClick={handleLogout}><Icon name="logout" size={14}/>Odjava</button>
          </div>
        </aside>

        <div className="main-content">
          <div className="topbar">
            <div className="topbar-title">{topbarTitles[view] || ""}</div>
            <div className="topbar-actions">
              <span style={{fontSize:".7rem",color:"#aaa"}}>{members.length} članova</span>
              {isAdmin && view !== "admin" && view !== "istorijat" && view !== "galerija" && (
                <button className="btn btn-primary" onClick={() => { setEditMember(null); setShowModal(true); }}>
                  <Icon name="plus" size={13}/>Novi član
                </button>
              )}
            </div>
          </div>

          {view === "tree"      && <TreeView members={members} isAdmin={isAdmin} onEdit={m => { setEditMember(m); setShowModal(true); }} onSaveMember={handleSaveMember} onDelete={handleDelete} selected={selected} onSelect={setSelected}/>}
          {view === "list"      && <ListView members={members} isAdmin={isAdmin} onEdit={m => { setEditMember(m); setShowModal(true); }} onDelete={handleDelete}/>}
          {view === "admin"     && isAdmin  && <AdminPanel members={members} currentUser={user} onMemberAdded={() => { loadMembers(); loadPendingCount(); }}/>}
          {view === "zahtjev"   && !isAdmin && <RequestFormView user={user} members={members}/>}
          {view === "istorijat" && <HistoryView/>}
          {view === "galerija"  && <GalleryView/>}
        </div>
      </div>

      {showModal && (
        <MemberModal
          member={editMember}
          members={members}
          onSave={handleSaveMember}
          onClose={() => { setShowModal(false); setEditMember(null); }}
        />
      )}
    </>
  );
}
