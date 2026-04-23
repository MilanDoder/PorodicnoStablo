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
        await supabase.from("member_parents").delete()
          .eq("member_id", childId).eq("parent_id", memberId);
        await supabase.from("member_parents").insert({
          member_id: childId, parent_id: memberId,
        });
      }

      const removedChildren = members
        .filter(m => (m.parent_ids || []).includes(memberId) && !childIds.includes(m.id))
        .map(m => m.id);
      for (const childId of removedChildren) {
        await supabase.from("member_parents").delete()
          .eq("member_id", childId).eq("parent_id", memberId);
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
    setUser(null);
    setMembers([]);
  };

  const handleExportPDF = () => {
    // Dinamički učitaj jsPDF iz CDN-a
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      const pageW = doc.internal.pageSize.getWidth();
      const gold  = [139, 90, 43];
      const ink   = [26, 16, 8];
      const gray  = [120, 110, 100];

      // ── Naslov ──
      doc.setFillColor(26, 16, 8);
      doc.rect(0, 0, pageW, 22, "F");
      doc.setTextColor(232, 184, 90);
      doc.setFontSize(18);
      doc.text("Породично стablo — Додеровићи", pageW / 2, 10, { align: "center" });
      doc.setFontSize(8);
      doc.setTextColor(180, 150, 80);
      doc.text("Пољана · Породична архива", pageW / 2, 17, { align: "center" });

      // ── Grupiši po kolenima ──
      const byGen = {};
      members.forEach(m => {
        const k = m.generational_line || "—";
        if (!byGen[k]) byGen[k] = [];
        byGen[k].push(m);
      });

      const sortedGens = Object.keys(byGen).sort((a, b) => {
        if (a === "—") return 1;
        if (b === "—") return -1;
        return parseInt(a) - parseInt(b);
      });

      let y = 30;
      const lineH   = 6;
      const colW    = pageW / 3;
      const padLeft = 10;

      sortedGens.forEach(gen => {
        const genMembers = byGen[gen];

        // Provjeri da li ima mjesta na stranici
        if (y + 10 + genMembers.length * lineH > doc.internal.pageSize.getHeight() - 10) {
          doc.addPage();
          y = 15;
        }

        // Naslov kolena
        doc.setFillColor(...gold);
        doc.rect(padLeft, y, pageW - padLeft * 2, 7, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont(undefined, "bold");
        const genLabel = gen === "—" ? "Без колена" : `${gen}. колено`;
        doc.text(`${genLabel}  (${genMembers.length} чланова)`, padLeft + 3, y + 5);
        y += 9;

        // Kolone: Ime | Godišta | Roditelji
        doc.setTextColor(...gray);
        doc.setFontSize(6.5);
        doc.setFont(undefined, "normal");
        doc.text("Ime i prezime", padLeft + 2, y);
        doc.text("Godišta", padLeft + colW, y);
        doc.text("Roditelji", padLeft + colW * 2, y);
        y += 1;
        doc.setDrawColor(...gold);
        doc.setLineWidth(0.2);
        doc.line(padLeft, y, pageW - padLeft, y);
        y += 3;

        genMembers.forEach((m, i) => {
          if (y > doc.internal.pageSize.getHeight() - 12) {
            doc.addPage();
            y = 15;
          }

          // Izmjenični red
          if (i % 2 === 0) {
            doc.setFillColor(248, 243, 232);
            doc.rect(padLeft, y - 3.5, pageW - padLeft * 2, lineH, "F");
          }

          doc.setTextColor(...ink);
          doc.setFontSize(7.5);
          doc.setFont(undefined, "bold");
          doc.text(`${m.first_name} ${m.last_name}`, padLeft + 2, y);

          doc.setFont(undefined, "normal");
          doc.setTextColor(...gray);
          const godine = m.birth_year
            ? `${m.birth_year}${m.death_year ? ` – ${m.death_year}` : ""}`
            : "—";
          doc.text(godine, padLeft + colW, y);

          const roditelji = members
            .filter(p => (m.parent_ids || []).includes(p.id))
            .map(p => p.first_name)
            .join(", ") || "—";
          doc.text(roditelji, padLeft + colW * 2, y);

          y += lineH;
        });

        y += 4;
      });

      // ── Footer ──
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(6);
        doc.setTextColor(...gray);
        doc.text(
          `Генерисано: ${new Date().toLocaleDateString("sr-Latn")} · Укупно чланова: ${members.length}`,
          padLeft, doc.internal.pageSize.getHeight() - 4
        );
        doc.text(`${i} / ${totalPages}`, pageW - padLeft, doc.internal.pageSize.getHeight() - 4, { align: "right" });
      }

      doc.save("Doderovici-porodicno-stablo.pdf");
    };
    document.head.appendChild(script);
  };
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
            <button className="btn btn-ghost" onClick={handleExportPDF}>
              <Icon name="image" size={13} />PDF
            </button>
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
