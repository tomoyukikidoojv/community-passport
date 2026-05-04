import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, NavLink, useNavigate, Navigate } from "react-router-dom";
import { signInWithEmailAndPassword, onAuthStateChanged, setPersistence, browserSessionPersistence, signOut } from "firebase/auth";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import CommunityPassport from "./pages/CommunityPassport";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import CalendarPage from "./pages/CalendarPage";
import ContactPage from "./pages/ContactPage";
import AdminDashboard from "./pages/AdminDashboard";
import { C, MTN_SVG_NAV, initialAttendance, initialAnnouncements } from "./constants";
import { LangProvider, useLang } from "./i18n/LangContext";
import { LANGS } from "./i18n/translations";
import { saveUserToCloud, saveAttendanceToCloud, fetchUserAttendance, fetchAnnouncements, saveAnnouncementToCloud, deleteAnnouncementFromCloud, fetchFormsFromCloud } from "./lib/userService";
import { auth } from "./lib/firebase";

const STORAGE_KEY = "cp_user";
const ATTENDANCE_KEY = "cp_attendance";

// ── Admin rate-limit constants ─────────────────────────
const ADMIN_LOCK_KEY  = "cp_admin_lock";
const ADMIN_MAX_FAILS = 5;
const ADMIN_LOCK_MINS = 15;

// ── Admin login gate (Firebase Auth) ──────────────────
function AdminGate({ children }) {
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [authed,     setAuthed]     = useState(false);
  const [loading,    setLoading]    = useState(true);   // waiting for onAuthStateChanged
  const [error,      setError]      = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Restore rate-limit state from localStorage
  const [fails, setFails] = useState(() => {
    try { return Number(JSON.parse(localStorage.getItem(ADMIN_LOCK_KEY))?.fails || 0); } catch { return 0; }
  });
  const [lockedUntil, setLockedUntil] = useState(() => {
    try { return Number(JSON.parse(localStorage.getItem(ADMIN_LOCK_KEY))?.until || 0); } catch { return 0; }
  });
  const [now, setNow] = useState(Date.now());

  // Tick every second for countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setAuthed(!!user);
      setLoading(false);
    });
    return unsub;
  }, []);

  const isLocked  = lockedUntil > now;
  const remaining = Math.max(0, lockedUntil - now);
  const remMin    = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const remSec    = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");

  const submit = async (e) => {
    e.preventDefault();
    if (isLocked || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // onAuthStateChanged will flip authed → true; reset fail counter
      localStorage.removeItem(ADMIN_LOCK_KEY);
      setFails(0);
      setLockedUntil(0);
    } catch {
      const newFails = fails + 1;
      if (newFails >= ADMIN_MAX_FAILS) {
        const until = Date.now() + ADMIN_LOCK_MINS * 60 * 1000;
        localStorage.setItem(ADMIN_LOCK_KEY, JSON.stringify({ fails: newFails, until }));
        setFails(newFails);
        setLockedUntil(until);
        setError(`${ADMIN_MAX_FAILS}回失敗しました。${ADMIN_LOCK_MINS}分間ロックされます。`);
      } else {
        localStorage.setItem(ADMIN_LOCK_KEY, JSON.stringify({ fails: newFails, until: 0 }));
        setFails(newFails);
        const left = ADMIN_MAX_FAILS - newFails;
        setError(`メールアドレスまたはパスワードが違います。（残り${left}回）`);
      }
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading splash ──
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: C.bgGradient,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ color: C.white, fontSize: 14, opacity: 0.7 }}>読み込み中…</div>
      </div>
    );
  }

  if (authed) return children;

  // ── Login form ──
  return (
    <div style={{
      minHeight: "100vh",
      background: C.bgGradient,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      {/* 背景の光の玉 */}
      <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"rgba(124,58,237,0.18)", filter:"blur(100px)", top:-150, right:-100, pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"rgba(11,122,107,0.18)", filter:"blur(90px)", bottom:-100, left:-80, pointerEvents:"none" }} />
      <div style={{
        background: C.glassWhite,
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderRadius: 20, maxWidth: 380, width: "100%",
        margin: "0 16px",
        border: "1px solid rgba(255,255,255,0.35)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)", overflow: "hidden",
      }}>
        {/* Header band */}
        <div style={{
          background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
          padding: "24px", textAlign: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>👑</div>
          <div style={{ color: C.white, fontSize: 18, fontWeight: 800 }}>管理者ページ</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 4 }}>
            Admin Dashboard
          </div>
        </div>

        {/* Lockout screen */}
        {isLocked ? (
          <div style={{ padding: "32px 28px", textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>
              アカウントがロックされています
            </div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>
              {ADMIN_MAX_FAILS}回の失敗によりロックされました
            </div>
            <div style={{
              fontSize: 36, fontWeight: 800, letterSpacing: 3,
              fontVariantNumeric: "tabular-nums", color: "#E74C3C",
            }}>
              {remMin}:{remSec}
            </div>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>後に再試行できます</div>
          </div>
        ) : (
          /* Login form */
          <form onSubmit={submit} style={{ padding: "28px 28px 24px" }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                placeholder="admin@example.com"
                autoComplete="email"
                autoFocus
                style={{
                  width: "100%", padding: "10px 14px", boxSizing: "border-box",
                  border: `1.5px solid ${error ? "#E74C3C" : C.lightGray}`,
                  borderRadius: 8, fontSize: 14, fontFamily: "inherit",
                  outline: "none", color: C.charcoal,
                }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="パスワードを入力"
                autoComplete="current-password"
                style={{
                  width: "100%", padding: "10px 14px", boxSizing: "border-box",
                  border: `1.5px solid ${error ? "#E74C3C" : C.lightGray}`,
                  borderRadius: 8, fontSize: 14, fontFamily: "inherit",
                  outline: "none", color: C.charcoal,
                }}
              />
              {error && (
                <div style={{ color: "#E74C3C", fontSize: 12, marginTop: 6 }}>{error}</div>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%", padding: "12px",
                background: submitting ? "#bbb" : `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
                color: C.white, border: "none", borderRadius: 8,
                fontSize: 14, fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {submitting ? "ログイン中…" : "ログイン"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── User nav ──────────────────────────────────────────
function UserNav({ registeredUser, myStamps, unreadCount, onLogout }) {
  const { t, lang, setLang } = useLang();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const NAV = [
    { path: "/announcements", emoji: "📢", labelKey: "nav.announcements", labelEn: "Announcements" },
    { path: "/calendar",      emoji: "📅", labelKey: "nav.calendar",      labelEn: "Calendar"      },
    { path: "/passport",      emoji: "🎫", labelKey: "nav.passport",      labelEn: "Passport"      },
    { path: "/contact",       emoji: "💬", labelKey: "nav.contact",       labelEn: "Contact"       },
  ];

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      backgroundColor: "rgba(8,16,50,0.95)",
      backgroundImage: `url("data:image/svg+xml,${MTN_SVG_NAV}")`,
      backgroundSize: "100% 100%",
      backgroundPosition: "bottom center",
      backgroundRepeat: "no-repeat",
      borderBottom: "1px solid rgba(255,255,255,0.12)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
    }}>
      {/* Row 1: Logo + User info */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "0 12px", height: 48,
        borderBottom: "1px solid rgba(255,255,255,0.10)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, flex: 1 }}>
          {/* グローブアイコン（背景なし） */}
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, filter: "drop-shadow(0 0 6px rgba(124,58,237,0.5))" }}>
            <defs>
              <linearGradient id="globeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa"/>
                <stop offset="100%" stopColor="#2dd4bf"/>
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="9" stroke="url(#globeGrad)" strokeWidth="1.6"/>
            {/* 経度線（縦の楕円＝子午線） */}
            <ellipse cx="12" cy="12" rx="4" ry="9" stroke="url(#globeGrad)" strokeWidth="1.2" fill="none" opacity="0.7"/>
            {/* 緯度線（横の楕円＝緯線） */}
            <ellipse cx="12" cy="12" rx="9" ry="2.2" stroke="url(#globeGrad)" strokeWidth="1.2" fill="none" opacity="0.7"/>
            <ellipse cx="12" cy="7.5" rx="7.8" ry="1.6" stroke="url(#globeGrad)" strokeWidth="1" fill="none" opacity="0.5"/>
            <ellipse cx="12" cy="16.5" rx="7.8" ry="1.6" stroke="url(#globeGrad)" strokeWidth="1" fill="none" opacity="0.5"/>
          </svg>
          {/* テキスト */}
          <div style={{ lineHeight: 1.15 }}>
            <div style={{
              color: "rgba(255,255,255,0.60)",
              fontWeight: 600, fontSize: 9,
              letterSpacing: 1.5, textTransform: "uppercase",
            }}>Community</div>
            <div style={{
              background: "linear-gradient(90deg, #e8b84b 0%, #f7e07a 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: 800, fontSize: 15, letterSpacing: 0.3,
            }}>Passport</div>
            <div style={{
              color: "rgba(255,255,255,0.28)",
              fontWeight: 400, fontSize: 7,
              letterSpacing: 3.5, textTransform: "uppercase",
              marginTop: 1,
            }}>ASHIYA</div>
          </div>
        </div>

        {/* Language selector */}
        <div style={{ position: "relative", marginRight: 6 }}>
          <button
            onClick={() => setShowLangMenu(m => !m)}
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6, padding: "3px 8px",
              color: C.white, fontSize: 11, cursor: "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4,
            }}
          >
            {LANGS.find(l => l.code === lang)?.flag} {lang.toUpperCase()}
          </button>
          {showLangMenu && (
            <div
              style={{
                position: "absolute", top: "calc(100% + 4px)", right: 0,
                background: C.white, borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                overflow: "hidden", zIndex: 200, minWidth: 150,
              }}
              onMouseLeave={() => setShowLangMenu(false)}
            >
              {LANGS.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "9px 14px", border: "none", cursor: "pointer",
                    fontFamily: "inherit", fontSize: 13,
                    background: lang === l.code ? C.tealPale : C.white,
                    color: lang === l.code ? C.teal : C.charcoal,
                    fontWeight: lang === l.code ? 700 : 400,
                  }}
                >
                  {l.flag} {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User chip + logout */}
        {registeredUser && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: C.goldLight, border: `2px solid ${C.gold}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, flexShrink: 0,
            }}>{registeredUser.flag}</div>
            <div style={{ lineHeight: 1.25 }}>
              <div style={{ color: C.white, fontSize: 11, fontWeight: 600 }}>
                {registeredUser.name}
              </div>
              <div style={{ color: C.gold, fontSize: 10 }}>
                ⭐ {t("nav.stamps", { n: myStamps.size })}
              </div>
            </div>
            <button
              onClick={onLogout}
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 4, padding: "2px 6px",
                color: "rgba(255,255,255,0.7)", fontSize: 9,
                cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
              }}
            >{t("nav.logout")}</button>
          </div>
        )}
      </div>

      {/* Row 2: Tabs */}
      <div style={{ display: "flex" }}>
        {NAV.map((item) => {
          const isNotices = item.path === "/announcements";
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                flex: 1,
                background: isActive ? "rgba(255,255,255,0.10)" : "transparent",
                borderBottom: isActive ? `3px solid ${C.gold}` : "3px solid transparent",
                borderTop: "none",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 1,
                padding: "8px 4px",
                position: "relative",
                textDecoration: "none",
                transition: "all 0.18s",
              })}
            >
              {({ isActive }) => (
                <>
                  {/* Badge はテキストの右上に superscript として配置 */}
                  <span style={{ position: "relative", display: "inline-block" }}>
                    <span style={{
                      fontSize: 12,
                      color: isActive ? C.white : "rgba(255,255,255,0.55)",
                      fontWeight: isActive ? 700 : 400,
                    }}>{t(item.labelKey)}</span>
                    {isNotices && unreadCount > 0 && (
                      <span style={{
                        position: "absolute", top: -7, right: -16,
                        minWidth: 15, height: 15, borderRadius: 8,
                        background: "#E74C3C", color: C.white,
                        fontSize: 9, fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "0 3px",
                        lineHeight: 1,
                      }}>{unreadCount}</span>
                    )}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

// ── Main app routes ───────────────────────────────────
function AppRoutes() {
  const navigate = useNavigate();

  // Load user from localStorage
  const [registeredUser, setRegisteredUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Sync to Firestore after mount
  useEffect(() => {
    if (registeredUser?.email) {
      saveUserToCloud(registeredUser)
        .then(ok => console.log("[Firebase] user sync:", ok ? "OK" : "FAIL"))
        .catch(err => console.error("[Firebase] sync error:", err));
    }
  }, []);

  // 利用者ログイン時: Firebaseからスタンプを取得してlocalStorageと同期
  useEffect(() => {
    if (!registeredUser?.id) return;
    fetchUserAttendance(registeredUser.id).then(cloudStamps => {
      if (!cloudStamps || cloudStamps.size === 0) return;
      setAttendance(prev => {
        const local = prev[registeredUser.id] || new Set();
        const merged = new Set([...local, ...cloudStamps]);
        // ローカルと差分がなければ更新不要
        if (merged.size === local.size) return prev;
        const next = { ...prev, [registeredUser.id]: merged };
        localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(
          Object.fromEntries(Object.entries(next).map(([k, v]) => [k, [...v]]))
        ));
        return next;
      });
    });
  }, [registeredUser?.id]);

  // Login state: stored in sessionStorage (resets when browser closes)
  const [loggedIn, setLoggedIn] = useState(
    () => sessionStorage.getItem("cp_loggedin") === "1"
  );

  const handleLogin = () => {
    sessionStorage.setItem("cp_loggedin", "1");
    setLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("cp_loggedin");
    setLoggedIn(false);
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("cp_loggedin");
    setRegisteredUser(null);
    setLoggedIn(false);
  };

  const [attendance, setAttendance] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ATTENDANCE_KEY));
      if (saved) return Object.fromEntries(Object.entries(saved).map(([k, v]) => [k, new Set(v)]));
    } catch {}
    return Object.fromEntries(Object.entries(initialAttendance).map(([k, v]) => [k, new Set(v)]));
  });

  const [announcements, setAnnouncements] = useState([...initialAnnouncements]);
  const [readIds, setReadIds] = useState(new Set());

  // 起動時にアンケートフォーム設定をFirestoreから同期（利用者が最新フォームを見られるよう）
  useEffect(() => {
    fetchFormsFromCloud().then(cloudForms => {
      if (cloudForms) {
        localStorage.setItem("cp_event_forms", JSON.stringify(cloudForms));
      }
    });
  }, []);

  // Firestoreからお知らせを読み込む（初回のみ）
  useEffect(() => {
    fetchAnnouncements().then(items => {
      if (items === null) {
        // Firestoreが空 → initialAnnouncementsをシード
        initialAnnouncements.forEach(a => saveAnnouncementToCloud(a));
      } else {
        setAnnouncements(items);
      }
    });
  }, []);

  // 利用者自身がスタンプを押す（localStorageとFirebaseを両方更新）
  const toggleStamp = (userId, eventId) => {
    setAttendance(prev => {
      const userSet = new Set(prev[userId] || []);
      if (userSet.has(eventId)) userSet.delete(eventId);
      else userSet.add(eventId);
      const next = { ...prev, [userId]: userSet };
      localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(
        Object.fromEntries(Object.entries(next).map(([k, v]) => [k, [...v]]))
      ));
      saveAttendanceToCloud(userId, userSet);
      return next;
    });
  };

  // 管理者がスタンプを操作（Firebaseのみ更新・利用者のlocalStorageを汚さない）
  const adminToggleStamp = async (userId, eventId) => {
    // Firebaseの最新データを取得してから toggle
    const current = await fetchUserAttendance(userId) || new Set();
    const updated = new Set(current);
    if (updated.has(eventId)) updated.delete(eventId);
    else updated.add(eventId);
    await saveAttendanceToCloud(userId, updated);
    // 管理者画面の表示を即時更新するためにローカルstateも更新
    setAttendance(prev => ({ ...prev, [userId]: updated }));
  };

  const handlePhotoUpdate = (dataUrl) => {
    const updated = { ...registeredUser, photo: dataUrl };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRegisteredUser(updated);
    saveUserToCloud(updated);
  };

  const handleRegistered = (newUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    sessionStorage.setItem("cp_loggedin", "1");
    setRegisteredUser(newUser);
    setLoggedIn(true);
    setAttendance(prev => ({ ...prev, [newUser.id]: new Set() }));
    navigate("/passport");
  };

  const postAnnouncement = (item) => {
    setAnnouncements(prev => [item, ...prev]);
    saveAnnouncementToCloud(item);
  };

  const deleteAnnouncement = (id) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    setReadIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    deleteAnnouncementFromCloud(id);
  };

  const editAnnouncement = (updated) => {
    setAnnouncements(prev => prev.map(a => a.id === updated.id ? updated : a));
    saveAnnouncementToCloud(updated);
  };

  const markRead = (id) => setReadIds(prev => new Set([...prev, id]));
  const markAllRead = () => setReadIds(new Set(announcements.map(a => a.id)));

  const myStamps = attendance[registeredUser?.id] || new Set();
  const unreadCount = announcements.filter(a => !readIds.has(a.id)).length;

  const adminElement = (
    <AdminGate>
      <AdminDashboard
        attendance={attendance}
        onStamp={adminToggleStamp}
        announcements={announcements}
        onPostAnnouncement={postAnnouncement}
        onDeleteAnnouncement={deleteAnnouncement}
        onEditAnnouncement={editAnnouncement}
        onSignOut={() => signOut(auth)}
      />
    </AdminGate>
  );

  // Admin route is always accessible regardless of user login state
  const [showLoginForNewDevice, setShowLoginForNewDevice] = useState(false);

  const handleCloudLogin = (user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    sessionStorage.setItem("cp_loggedin", "1");
    setRegisteredUser(user);
    setLoggedIn(true);
    setAttendance(prev => ({ ...prev, [user.id]: prev[user.id] || new Set() }));
    navigate("/passport");
  };

  // Not registered yet → registration or login screen (except admin)
  if (!registeredUser) {
    return (
      <Routes>
        <Route path="/kanri-ashiya2026" element={adminElement} />
        <Route path="*" element={
          showLoginForNewDevice
            ? <LoginPage
                savedUser={null}
                onLogin={handleLogin}
                onReset={handleReset}
                onShowRegister={() => setShowLoginForNewDevice(false)}
                onCloudLogin={handleCloudLogin}
              />
            : <RegisterPage
                onRegistered={handleRegistered}
                onShowLogin={() => setShowLoginForNewDevice(true)}
              />
        } />
      </Routes>
    );
  }

  // Registered but not logged in → login screen (except admin)
  if (!loggedIn) {
    return (
      <Routes>
        <Route path="/kanri-ashiya2026" element={adminElement} />
        <Route path="*" element={
          <LoginPage
            savedUser={registeredUser}
            onLogin={handleLogin}
            onReset={handleReset}
            onShowRegister={handleReset}
            onCloudLogin={handleCloudLogin}
          />
        } />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Admin: separate password-protected area */}
      <Route path="/kanri-ashiya2026" element={adminElement} />

      {/* User area: 2-tab nav */}
      <Route path="*" element={
        <div style={{ fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif" }}>
          <UserNav
            registeredUser={registeredUser}
            myStamps={myStamps}
            unreadCount={unreadCount}
            onLogout={handleLogout}
          />
          <Routes>
            <Route path="/" element={<Navigate to="/announcements" replace />} />
            <Route path="/announcements" element={
              <AnnouncementsPage
                announcements={announcements}
                readIds={readIds}
                onRead={markRead}
                onReadAll={markAllRead}
              />
            } />
            <Route path="/calendar" element={
              <CalendarPage stamps={myStamps} user={registeredUser} />
            } />
            <Route path="/passport" element={
              <CommunityPassport stamps={myStamps} onManualStamp={toggleStamp} user={registeredUser} onPhotoUpdate={handlePhotoUpdate} />
            } />
            <Route path="/contact" element={
              <ContactPage user={registeredUser} />
            } />
            <Route path="*" element={<Navigate to="/announcements" replace />} />
          </Routes>
        </div>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </LangProvider>
  );
}
