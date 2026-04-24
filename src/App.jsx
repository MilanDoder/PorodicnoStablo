import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { supabase } from "./lib/supabase";
import Icon from "./components/Icon";
import LoginPage from "./components/LoginPage";
import TreeView from "./components/TreeView";
import ListView from "./components/ListView";
import MemberModal from "./components/MemberModal";

const AdminPanel      = lazy(() => import("./components/AdminPanel"));
const RequestFormView = lazy(() => import("./components/RequestFormView"));
const HistoryView     = lazy(() => import("./components/HistoryView"));
const GalleryView     = lazy(() => import("./components/GalleryView"));

const TOPBAR_TITLES = {
  tree:      "Породично стабло — Додеровићи",
  istorijat: "Историјат породице Додеровић",
  galerija:  "Галерија",
  list:      "Листа чланова",
  admin:     "Админ панел",
  zahtjev:   "Захтев за унос члана",
};

const fetchProfile = async (userId) => {
  try {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    return data || null;
  } catch {
    return null;
  }
};

export default function App() {
  const [user, setUser]                 = useState(undefined);
  const [members, setMembers]           = useState([]);
  const [view, setView]                 = useState("tree");
  const [selected, setSelected]         = useState(null);
  const [editMember, setEditMember]     = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const initialized                     = useRef(false);

  const isAdmin = user?.profile?.role === "admin";

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (initialized.current) return;
      initialized.current = true;
      if (session) {
        const profile = await fetchProfile(session.user.id);
        setUser({ ...session.user, profile });
      } else {
        setUser(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!initialized.current) initialized.current = true;
        if (session) {
          const profile = await fetchProfile(session.user.id);
          setUser({ ...session.user, profile });
        } else {
          setUser(null);
          setMembers([]);
        }
      }
    );

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

  const handleSaveMember = async (form, childIds = []) => {
    const { parent_ids, ...memberData } = form;
    if (memberData.birth_year === "") memberData.birth_year = null;
    if (memberData.death_year === "") memberData.death_year = null;
    try {
      let memberId = form.id;
      if (form.id) {
        const { error } = await supabase.from("members").update(memberData).eq("id", form.id);
        if (error) throw error;
        await supabase.from("member_parents").delete().eq("member_id", form.id);
      } else {
        const { data, error } = await supabase.from("members").insert(memberData).select().single();
        if (error) throw error;
        memberId = data.id;
      }
      if ((parent_ids || []).length > 0) {
        const { error } = await supabase.from("member_parents").insert(
          parent_ids.map(pid => ({ member_id: memberId, parent_id: pid }))
        );
        if (error) throw error;
      }
      for (const childId of childIds) {
        await supabase.from("member_parents").delete().eq("member_id", childId).eq("parent_id", memberId);
        await supabase.from("member_parents").insert({ member_id: childId, parent_id: memberId });
      }
      const removedChildren = members
        .filter(m => (m.parent_ids || []).includes(memberId) && !childIds.includes(m.id))
        .map(m => m.id);
      for (const childId of removedChildren) {
        await supabase.from("member_parents").delete().eq("member_id", childId).eq("parent_id", memberId);
      }
      await loadMembers();
      setShowModal(false);
      setEditMember(null);
    } catch (err) {
      console.error("Greška pri čuvanju:", err);
      alert("Greška: " + (err.message || JSON.stringify(err)));
    }
  };

  const handleDelete = async (id) => {
    await supabase.from("members").delete().eq("id", id);
    await loadMembers();
    setSelected(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleExportPDF = () => {
    const load = () => {
      const { jsPDF } = window.jspdf;
      const CYR = {
        'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Ђ':'Dj','Е':'E','Ж':'Z','З':'Z',
        'И':'I','Ј':'J','К':'K','Л':'L','Љ':'Lj','М':'M','Н':'N','Њ':'Nj','О':'O',
        'П':'P','Р':'R','С':'S','Т':'T','Ћ':'C','У':'U','Ф':'F','Х':'H','Ц':'C',
        'Ч':'Ch','Џ':'Dz','Ш':'S',
        'а':'a','б':'b','в':'v','г':'g','д':'d','ђ':'dj','е':'e','ж':'z','з':'z',
        'и':'i','ј':'j','к':'k','л':'l','љ':'lj','м':'m','н':'n','њ':'nj','о':'o',
        'п':'p','р':'r','с':'s','т':'t','ћ':'c','у':'u','ф':'f','х':'h','ц':'c',
        'ч':'ch','џ':'dz','ш':'s',
      };
      const t = (str) => String(str ?? "").replace(/./g, c => CYR[c] ?? c);
      const doc   = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const PAD   = 10;
      const LINEH = 6.5;
      const cols  = [
        { label: "Ime i prezime", x: PAD,               w: 90 },
        { label: "Godiste",       x: PAD + 90,           w: 30 },
        { label: "Roditelji",     x: PAD + 90 + 30,      w: 90 },
        { label: "Koleno",        x: PAD + 90 + 30 + 90, w: 25 },
      ];
      const GOLD  = [139, 90, 43];
      const INK   = [26, 16, 8];
      const GRAY  = [110, 100, 90];
      const CREAM = [248, 243, 232];
      doc.setFillColor(26, 16, 8);
      doc.rect(0, 0, pageW, 22, "F");
      doc.setTextColor(232, 184, 90);
      doc.setFontSize(16); doc.setFont(undefined, "bold");
      doc.text("Porodicno stablo - Doderovici", pageW / 2, 10, { align: "center" });
      doc.setFontSize(8); doc.setFont(undefined, "normal");
      doc.setTextColor(180, 150, 80);
      doc.text("Poljana · Porodicna arhiva", pageW / 2, 17, { align: "center" });
      let y = 28;
      const drawTableHeader = () => {
        doc.setFillColor(220, 200, 160);
        doc.rect(PAD, y, pageW - PAD * 2, 7, "F");
        doc.setTextColor(...INK); doc.setFontSize(7); doc.setFont(undefined, "bold");
        cols.forEach(col => doc.text(col.label, col.x + 1, y + 5));
        doc.setDrawColor(...GOLD); doc.setLineWidth(0.3);
        doc.line(PAD, y + 7, pageW - PAD, y + 7);
        y += 9;
      };
      const sorted = [...members].sort((a, b) => {
        const ga = a.generational_line ?? 999;
        const gb = b.generational_line ?? 999;
        if (ga !== gb) return ga - gb;
        return t(a.first_name).localeCompare(t(b.first_name));
      });
      drawTableHeader();
      sorted.forEach((m, i) => {
        if (y + LINEH > pageH - 12) { doc.addPage(); y = 15; drawTableHeader(); }
        if (i % 2 === 0) { doc.setFillColor(...CREAM); doc.rect(PAD, y - 4, pageW - PAD * 2, LINEH, "F"); }
        const roditelji = members.filter(p => (m.parent_ids || []).includes(p.id)).map(p => t(p.first_name)).join(", ") || "—";
        const godine    = m.birth_year ? `${m.birth_year}${m.death_year ? ` - ${m.death_year}` : ""}` : "—";
        const koleno    = m.generational_line ? `${m.generational_line}.` : "—";
        doc.setFontSize(7.5); doc.setFont(undefined, "bold"); doc.setTextColor(...INK);
        doc.text(t(`${m.first_name} ${m.last_name}`), cols[0].x + 1, y);
        doc.setFont(undefined, "normal"); doc.setTextColor(...GRAY);
        doc.text(godine, cols[1].x + 1, y);
        doc.text(roditelji, cols[2].x + 1, y);
        doc.text(koleno, cols[3].x + 1, y);
        y += LINEH;
      });
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setDrawColor(...GOLD); doc.setLineWidth(0.1);
        [cols[1].x, cols[2].x, cols[3].x].forEach(x => doc.line(x, 22, x, pageH - 8));
        doc.setFontSize(6); doc.setTextColor(...GRAY);
        doc.text(`Generisano: ${new Date().toLocaleDateString("sr-Latn")} · Ukupno clanova: ${members.length}`, PAD, pageH - 4);
        doc.text(`${p} / ${totalPages}`, pageW - PAD, pageH - 4, { align: "right" });
      }
      doc.save("Doderovici-porodicno-stablo.pdf");
    };
    if (window.jspdf) { load(); }
    else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload = load;
      document.head.appendChild(script);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (user === undefined) return null;
  if (!user) return <LoginPage onLogin={setUser} />;

  const nav = [
    { id: "tree",      icon: "tree",    label: "Породично стабло" },
    { id: "list",      icon: "users",   label: "Листа чланова" },
    { id: "istorijat", icon: "history", label: "Историја" },
    { id: "galerija",  icon: "image",   label: "Галерија" },
    ...(isAdmin
      ? [{ id: "admin",   icon: "shield", label: "Админ панел", badge: pendingCount > 0 ? pendingCount : null }]
      : [{ id: "zahtjev", icon: "inbox",  label: "Захтјев за унос члана породице" }]
    ),
  ];

  const displayName = user?.profile?.full_name || user?.email || "Korisnik";
  const openModal   = (member = null) => { setEditMember(member); setShowModal(true); };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">🌳 Додеровићи и Додери</div>
          <div className="sidebar-sub">Породична архива</div>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-avatar">{displayName[0]?.toUpperCase()}</div>
          <div>
            <div className="sidebar-username">{displayName}</div>
            <div className="sidebar-role">{isAdmin ? "Администратор" : "Корисник"}</div>
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
          <div className="sidebar-credits">
            <div className="credits-divider" />
            <div className="credits-text">
              <span className="credits-label">Дигитализација</span>
              <span className="credits-name">Светозар-Милан Миљанов Додеровић</span>
            </div>
            <div className="credits-text">
              <span className="credits-label">Садржај</span>
              <span className="credits-name">Мићо Обрадов Додеровић до Новембра 1990.</span>
              <span className="credits-name">Бранко Светозаров Додеровић до Октобра 2017.</span>
            </div>
            <div className="credits-divider" />
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <Icon name="logout" size={14} />Одјава
          </button>
        </div>
      </aside>

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-title">{TOPBAR_TITLES[view] || ""}</div>
          <div className="topbar-actions">
            <span style={{ fontSize: ".7rem", color: "#aaa" }}>{members.length} članova</span>
            <button className="btn btn-ghost" onClick={handleExportPDF}>
              <Icon name="image" size={13} />PDF
            </button>
            {isAdmin && !["admin", "istorijat", "galerija"].includes(view) && (
              <button className="btn btn-primary" onClick={() => openModal(null)}>
                <Icon name="plus" size={13} />Нови члан
              </button>
            )}
          </div>
        </div>

        <Suspense fallback={<div className="loading-screen"><Icon name="spinner" size={28} /></div>}>
          {view === "tree"      && <TreeView members={members} isAdmin={isAdmin} onEdit={openModal} onSaveMember={handleSaveMember} onDelete={handleDelete} selected={selected} onSelect={setSelected} />}
          {view === "list"      && <ListView members={members} isAdmin={isAdmin} onEdit={openModal} onDelete={handleDelete} />}
          {view === "admin"     && isAdmin  && <AdminPanel members={members} currentUser={user} onMemberAdded={() => { loadMembers(); loadPendingCount(); }} />}
          {view === "zahtjev"   && !isAdmin && <RequestFormView user={user} members={members} />}
          {view === "istorijat" && <HistoryView user={user} isAdmin={isAdmin} />}
          {view === "galerija"  && <GalleryView user={user} isAdmin={isAdmin} />}
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
