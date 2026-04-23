import { useState, useEffect, lazy, Suspense } from "react";
import { supabase } from "./lib/supabase";
import Icon from "./components/Icon";
import LoginPage from "./components/LoginPage";
import TreeView from "./components/TreeView";
import ListView from "./components/ListView";
import MemberModal from "./components/MemberModal";


// Lazy-load tabove koji se ne otvaraju odmah
const AdminPanel       = lazy(() => import("./components/AdminPanel"));
const RequestFormView  = lazy(() => import("./components/RequestFormView"));
const HistoryView      = lazy(() => import("./components/HistoryView"));
const GalleryView      = lazy(() => import("./components/GalleryView"));

const TOPBAR_TITLES = {
  tree:      "Porodično Stablo — Додеровићи",
  list:      "Lista članova",
  admin:     "Admin Panel",
  zahtjev:   "Zahtjev za unos",
  istorijat: "Istorijat porodice Додеровић",
  galerija:  "Galerija",
};

export default function App() {
  const [user, setUser]             = useState(null);
  const [members, setMembers]       = useState([]);
  const [view, setView]             = useState("tree");
  const [selected, setSelected]     = useState(null);
  const [editMember, setEditMember] = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [loading, setLoading]       = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const isAdmin = user?.profile?.role === "admin";

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let initialDone = false;

    const fetchProfile = async (userId) => {
      try {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
        return profile || null;
      } catch { return null; }
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const profile = await fetchProfile(session.user.id);
        setUser({ ...session.user, profile });
      }
      initialDone = true;
      setLoading(false);
    }).catch(() => { initialDone = true; setLoading(false); });

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

  // ── Data ──────────────────────────────────────────────────────────────────
  const loadMembers = async () => {
    const { data, error } = await supabase.from("members_with_parents").select("*").order("id");
    if (!error) setMembers(data || []);
  };

  const loadPendingCount = async () => {
    const { count } = await supabase.from("data_requests").select("*", { count: "exact", head: true }).eq("status", "pending");
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

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-screen">
        <Icon name="spinner" size={32} />
        <div className="loading-text">Učitavanje...</div>
      </div>
    );
  }

  if (!user) return <LoginPage onLogin={setUser} />;

  const nav = [
    { id: "tree",      icon: "tree",    label: "Porodično stablo" },
    { id: "list",      icon: "users",   label: "Lista članova" },
    ...(isAdmin
      ? [{ id: "admin",    icon: "shield",  label: "Admin panel", badge: pendingCount > 0 ? pendingCount : null }]
      : [{ id: "zahtjev",  icon: "inbox",   label: "Zahtjev za unos" }]
    ),
    { id: "istorijat", icon: "history", label: "Istorijat" },
    { id: "galerija",  icon: "image",   label: "Galerija" },
  ];

  const displayName = user?.profile?.full_name || user?.email || "Korisnik";

  const openModal = (member = null) => { setEditMember(member); setShowModal(true); };

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
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
              <Icon name={n.icon} size={15} />{n.label}
              {n.badge && <span className="nav-badge">{n.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <Icon name="logout" size={14} />Odjava
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-title">{TOPBAR_TITLES[view] || ""}</div>
          <div className="topbar-actions">
            <span style={{ fontSize: ".7rem", color: "#aaa" }}>{members.length} članova</span>
            {isAdmin && !["admin", "istorijat", "galerija"].includes(view) && (
              <button className="btn btn-primary" onClick={() => openModal(null)}>
                <Icon name="plus" size={13} />Novi član
              </button>
            )}
          </div>
        </div>

        <Suspense fallback={<div className="loading-screen"><Icon name="spinner" size={28} /></div>}>
          {view === "tree"      && <TreeView members={members} isAdmin={isAdmin} onEdit={openModal} onSaveMember={handleSaveMember} onDelete={handleDelete} selected={selected} onSelect={setSelected} />}
          {view === "list"      && <ListView members={members} isAdmin={isAdmin} onEdit={openModal} onDelete={handleDelete} />}
          {view === "admin"     && isAdmin  && <AdminPanel members={members} currentUser={user} onMemberAdded={() => { loadMembers(); loadPendingCount(); }} />}
          {view === "zahtjev"   && !isAdmin && <RequestFormView user={user} members={members} />}
          {view === "istorijat" && <HistoryView />}
          {view === "galerija"  && <GalleryView />}
        </Suspense>
      </div>

      {showModal && (
        <MemberModal
          member={editMember}
          members={members}
          onSave={handleSaveMember}
          onClose={() => { setShowModal(false); setEditMember(null); }}
        />
      )}
    </div>
  );
}
