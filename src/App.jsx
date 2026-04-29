import { FAMILY_FULL_NAME, FAMILY_SURNAME, FAMILY_LOCATION, APP_TITLE, PDF_FILENAME } from "./config";
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { supabase } from "./lib/supabase";
import Icon from "./components/Icon";
import LoginPage from "./components/LoginPage";
import TreeView from "./components/TreeView";
import ListView from "./components/ListView";
import AnnouncementBanner from "./components/AnnouncementBanner";
import MemberModal from "./components/MemberModal";

const AdminPanel      = lazy(() => import("./components/AdminPanel"));
const SeoeView        = lazy(() => import("./components/SeoeView"));
const RequestFormView = lazy(() => import("./components/RequestFormView"));
const HistoryView     = lazy(() => import("./components/HistoryView"));
const GalleryView     = lazy(() => import("./components/GalleryView"));

const TOPBAR_TITLES = {
  tree:      `Породично стабло — ${FAMILY_FULL_NAME}`,
  istorijat: `Историјат породице ${FAMILY_FULL_NAME}`,
  galerija:  "Галерија",
  list:      "Листа чланова",
  admin:     "Админ панел",
  seobe:     "Сеобе",
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
  const [user, setUser]                 = useState(undefined); // undefined = još se učitava
  const [members, setMembers]           = useState([]);
  const [view, setView]                 = useState("tree");
  const [selected, setSelected]         = useState(null);
  const [editMember, setEditMember]     = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [treeKey, setTreeKey]           = useState(0);
  const [showAnnForm, setShowAnnForm]   = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  const isAdmin = user?.profile?.role === "admin";

  // Briši keš koji nije Supabase auth
  useEffect(() => {
    Object.keys(localStorage).forEach(k => { if (!k.startsWith('sb-')) localStorage.removeItem(k); });
  }, []);

  // ── Auth ──────────────────────────────────────────────────────────────────
  // Koristimo SAMO onAuthStateChange — on se okine odmah pri mount-u
  // sa trenutnom sesijom (ili bez nje), bez race conditiona sa getSession.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          setUser(null);
          setMembers([]);
          return;
        }
        // SIGNED_IN, TOKEN_REFRESHED, INITIAL_SESSION...
        const profile = await fetchProfile(session.user.id);
        setUser({ ...session.user, profile });
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
    // onAuthStateChange će postaviti user = null automatski
    setView("tree");
    setSelected(null);
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
      doc.save(PDF_FILENAME);
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

  // Prikazujemo loading dok onAuthStateChange ne okine prvi put
  if (user === undefined) return (
    <div className="loading-screen">
      <Icon name="spinner" size={28} />
    </div>
  );

  // Nije ulogovan — prikaži login stranicu
  // LoginPage više ne treba onLogin prop — onAuthStateChange sve rješava
  if (!user) return <LoginPage />;

  const nav = [
    { id: "tree",      icon: "tree",    label: "Породично стабло" },
    { id: "list",      icon: "users",   label: "Листа чланова" },
    { id: "istorijat", icon: "history", label: "Историја" },
    { id: "galerija",  icon: "image",   label: "Галерија" },
    ...(isAdmin
      ? [{ id: "seobe", icon: "history", label: "Сеобе" }, { id: "admin", icon: "shield", label: "Админ панел", badge: pendingCount > 0 ? pendingCount : null }]
      : [{ id: "zahtjev", icon: "inbox", label: "Захтјев за унос члана породице" }]
    ),
  ];

  const displayName = user?.profile?.full_name || user?.email || "Korisnik";
  const openModal   = (member = null) => { setEditMember(member); setShowModal(true); };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/image/grb.png" alt="Грб" className="sidebar-grb" />
            <div className="sidebar-logo-text">{FAMILY_FULL_NAME}</div>
            <div className="sidebar-sub">Породична архива</div>
          </div>
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
            <button key={n.id} className={`nav-item${view === n.id ? " active" : ""}`} onClick={() => { setView(n.id); if (n.id === "tree") setTreeKey(k => k + 1); }}>
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
        <AnnouncementBanner />
        <div className="topbar">
          <div className="topbar-title">{TOPBAR_TITLES[view] || ""}</div>
          <div className="topbar-actions">
            <span style={{ fontSize: ".7rem", color: "#aaa" }}>{members.length} чланова</span>
            <button className="btn btn-ghost" onClick={handleExportPDF}>
              <Icon name="image" size={13} />PDF
            </button>
            <button className="btn btn-ghost" onClick={() => setShowAnnForm(true)} title="Pošalji obaveštenje">
              <Icon name="bell" size={13} />Обавјештење
            </button>
            {isAdmin && !["admin", "istorijat", "galerija"].includes(view) && (
              <button className="btn btn-primary" onClick={() => openModal(null)}>
                <Icon name="plus" size={13} />Нови члан
              </button>
            )}
            {!isAdmin && (
              <button className="btn btn-primary" onClick={() => setShowRequestForm(true)}>
                <Icon name="plus" size={13} />Предложи члана
              </button>
            )}
          </div>
        </div>

        <Suspense fallback={<div className="loading-screen"><Icon name="spinner" size={28} /></div>}>
          {view === "tree" && (() => {
            const males    = members.filter(x => x.gender === "male").length;
            const females  = members.filter(x => x.gender === "female").length;
            const deceased = members.filter(x => x.death_year).length;
            const gens     = [...new Set(members.map(x => x.generational_line).filter(Boolean))].length;
            return (
              <>
                <div style={{
                  display: "flex", alignItems: "center", gap: "1.5rem",
                  padding: ".45rem 1.5rem", background: "white",
                  borderBottom: "1px solid rgba(200,150,62,.12)",
                  flexShrink: 0, flexWrap: "wrap",
                }}>
                  {[
                    ["🌳", members.length, "чланова"],
                    ["👨", males,          "мушких"],
                    ["👩", females,        "женских"],
                    ["✝",  deceased,       "преминулих"],
                    ["🔢", gens,           "кољена"],
                  ].map(([emoji, val, lbl]) => (
                    <div key={lbl} style={{ display: "flex", alignItems: "center", gap: ".35rem" }}>
                      <span style={{ fontSize: "1rem" }}>{emoji}</span>
                      <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.1rem", fontWeight: 600, color: "var(--ink)" }}>{val}</span>
                      <span style={{ fontSize: ".62rem", letterSpacing: ".08em", textTransform: "uppercase", color: "#aaa" }}>{lbl}</span>
                    </div>
                  ))}
                </div>
                <TreeView key={treeKey} members={members} isAdmin={isAdmin} user={user} onEdit={openModal} onSaveMember={handleSaveMember} onDelete={handleDelete} selected={selected} onSelect={setSelected} />
              </>
            );
          })()}
          {view === "list"      && <ListView members={members} isAdmin={isAdmin} user={user} onEdit={openModal} onDelete={handleDelete} onAddMember={(parent) => { setEditMember({ parent_ids: [parent.id], generational_line: parent.generational_line ? parent.generational_line + 1 : null }); setShowModal(true); }} />}
          {view === "admin"     && isAdmin  && <AdminPanel members={members} currentUser={user} onMemberAdded={() => { loadMembers(); loadPendingCount(); }} />}
          {view === "zahtjev"   && !isAdmin && <RequestFormView user={user} members={members} />}
          {view === "istorijat" && <HistoryView user={user} isAdmin={isAdmin} />}
          {view === "galerija"  && <GalleryView user={user} isAdmin={isAdmin} />}
          {view === "seobe"     && isAdmin && <SeoeView isAdmin={isAdmin} />}
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

      {showRequestForm && (
        <div className="overlay" style={{ zIndex: 1200 }} onClick={e => e.target === e.currentTarget && setShowRequestForm(false)}>
          <div className="modal" style={{ width: 580, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div className="modal-head">
              <span className="modal-title">👤 Предложи новог члана</span>
              <button className="modal-close" onClick={() => setShowRequestForm(false)}><Icon name="close" size={18} /></button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              <RequestFormView user={user} members={members} onSuccess={() => setTimeout(() => setShowRequestForm(false), 2500)} />
            </div>
          </div>
        </div>
      )}

      {showAnnForm && (
        <AnnouncementFormModal
          isAdmin={isAdmin}
          user={user}
          onClose={() => setShowAnnForm(false)}
        />
      )}
    </div>
  );
}

function AnnouncementFormModal({ isAdmin, user, onClose }) {
  const [content,   setContent]   = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving,    setSaving]    = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  const handleSave = async () => {
    setError("");
    if (!content.trim()) { setError("Текст не смије бити празан."); return; }
    if (isAdmin && !expiresAt) { setError("Унесите датум истека."); return; }
    setSaving(true);
    try {
      if (isAdmin) {
        const { error: err } = await supabase.from("announcements").insert({
          message:    content.trim(),
          expires_at: expiresAt,
          created_by: user?.id ?? null,
        });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from("data_requests").insert({
          request_type: "announcement",
          title:        "Предлог обавјештења",
          content:      content.trim(),
          expires_at:   expiresAt || null,
          status:       "pending",
          user_id:      user.id,
          user_email:   user.email,
        });
        if (err) throw err;
      }
      setSuccess(true);
      setContent("");
      setExpiresAt("");
      setTimeout(() => onClose(), 2200);
    } catch (e) {
      setError(e?.message || e?.details || e?.hint || JSON.stringify(e) || "Грешка при слању.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" style={{ zIndex: 1200 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 480 }}>
        <div className="modal-head">
          <span className="modal-title">
            {isAdmin ? "📢 Ново обавјештење" : "📢 Предложи обавјештење"}
          </span>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="modal-body">
          {!isAdmin && (
            <p style={{ fontSize: ".78rem", color: "#888", marginBottom: "1rem", lineHeight: 1.6 }}>
              Ваш предлог ће бити послат администратору на одобрење прије него што се прикаже свим корисницима.
            </p>
          )}
          {success ? (
            <div style={{ textAlign: "center", padding: "1.5rem 0", color: "#2e7d32", fontSize: "1rem" }}>
              ✓ {isAdmin ? "Обавјештење је објављено!" : "Предлог је успјешно послат!"}
            </div>
          ) : (
            <div className="form-grid">
              <div className="form-field full">
                <label className="form-label">Текст обавјештења *</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Унесите текст који ће се приказивати у траци..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="form-label">{isAdmin ? "Датум истека *" : "Предложени датум истека"}</label>
                <input
                  type="date"
                  className="form-input"
                  min={todayStr}
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                />
              </div>
              {error && <div className="form-field full" style={{ color: "var(--rust)", fontSize: ".75rem" }}>⚠ {error}</div>}
            </div>
          )}
        </div>
        {!success && (
          <div className="modal-foot">
            <button className="btn btn-ghost" onClick={onClose}>Откажи</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Слање..." : isAdmin ? "Објави" : "Пошаљи на одобрење"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
