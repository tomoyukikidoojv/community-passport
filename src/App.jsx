import { useState } from "react";
import { BrowserRouter, Routes, Route, NavLink, useNavigate, Navigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import CommunityPassport from "./pages/CommunityPassport";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import CalendarPage from "./pages/CalendarPage";
import ContactPage from "./pages/ContactPage";
import AdminDashboard from "./pages/AdminDashboard";
import { C, initialAttendance, initialAnnouncements } from "./constants";
import { LangProvider, useLang } from "./i18n/LangContext";
import { LANGS } from "./i18n/translations";

const ADMIN_PASSWORD = "Kidodomo1551";
const STORAGE_KEY = "cp_user";
const ATTENDANCE_KEY = "cp_attendance";

// ── Admin login gate ───────────────────────────────────
function AdminGate({ children }) {
  const [input, setInput] = useState("");
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("cp_admin") === "1");
  const [error, setError] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (input === ADMIN_PASSWORD) {
      sessionStorage.setItem("cp_admin", "1");
      setAuthed(true);
    } else {
      setError(true);
      setInput("");
    }
  };

  if (authed) return children;

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${C.teal} 0%, ${C.navy} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
    }}>
      <div style={{
        background: C.white, borderRadius: 20, maxWidth: 380, width: "100%",
        margin: "0 16px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)", overflow: "hidden",
      }}>
        <div style={{
          background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
          padding: "24px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>👑</div>
          <div style={{ color: C.white, fontSize: 18, fontWeight: 800 }}>管理者ページ</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 4 }}>
            Admin Dashboard
          </div>
        </div>
        <form onSubmit={submit} style={{ padding: "28px 28px 24px" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>
              パスワード
            </label>
            <input
              type="password"
              value={input}
              onChange={e => { setInput(e.target.value); setError(false); }}
              placeholder="パスワードを入力"
              autoFocus
              style={{
                width: "100%", padding: "10px 14px", boxSizing: "border-box",
                border: `1.5px solid ${error ? "#E74C3C" : C.lightGray}`,
                borderRadius: 8, fontSize: 14, fontFamily: "inherit",
                outline: "none", color: C.charcoal,
              }}
            />
            {error && (
              <div style={{ color: "#E74C3C", fontSize: 12, marginTop: 6 }}>
                パスワードが違います
              </div>
            )}
          </div>
          <button
            type="submit"
            style={{
              width: "100%", padding: "12px",
              background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
              color: C.white, border: "none", borderRadius: 8,
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            ログイン
          </button>
        </form>
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
      background: `linear-gradient(90deg, ${C.navy} 0%, ${C.teal} 100%)`,
      boxShadow: "0 2px 16px rgba(0,0,0,0.35)",
    }}>
      {/* Row 1: Logo + User info */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "0 12px", height: 48,
        borderBottom: "1px solid rgba(255,255,255,0.10)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: C.gold,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, flexShrink: 0,
          }}>🌏</div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ color: C.white, fontWeight: 800, fontSize: 12, letterSpacing: 0.5 }}>
              Community
            </div>
            <div style={{ color: C.gold, fontWeight: 800, fontSize: 12, letterSpacing: 0.5 }}>
              Passport
            </div>
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
            <div style={{ display: "flex", gap: 4 }}>
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
              <NavLink
                to="/kanri-ashiya2026"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 4, padding: "2px 6px",
                  color: "rgba(255,255,255,0.35)", fontSize: 9,
                  textDecoration: "none", whiteSpace: "nowrap",
                }}
              >{t("nav.admin")}</NavLink>
            </div>
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
                  {isNotices && unreadCount > 0 && (
                    <div style={{
                      position: "absolute", top: 4, right: "calc(50% - 18px)",
                      minWidth: 16, height: 16, borderRadius: 8,
                      background: "#E74C3C", color: C.white,
                      fontSize: 9, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 4px",
                    }}>{unreadCount}</div>
                  )}
                  <span style={{
                    fontSize: 12,
                    color: isActive ? C.white : "rgba(255,255,255,0.55)",
                    fontWeight: isActive ? 700 : 400,
                  }}>{t(item.labelKey)}</span>
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

  const toggleStamp = (userId, eventId) => {
    setAttendance(prev => {
      const userSet = new Set(prev[userId] || []);
      if (userSet.has(eventId)) userSet.delete(eventId);
      else userSet.add(eventId);
      const next = { ...prev, [userId]: userSet };
      localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(
        Object.fromEntries(Object.entries(next).map(([k, v]) => [k, [...v]]))
      ));
      return next;
    });
  };

  const handleRegistered = (newUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    sessionStorage.setItem("cp_loggedin", "1");
    setRegisteredUser(newUser);
    setLoggedIn(true);
    setAttendance(prev => ({ ...prev, [newUser.id]: new Set() }));
    navigate("/passport");
  };

  const postAnnouncement = (item) => setAnnouncements(prev => [item, ...prev]);

  const deleteAnnouncement = (id) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    setReadIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const markRead = (id) => setReadIds(prev => new Set([...prev, id]));
  const markAllRead = () => setReadIds(new Set(announcements.map(a => a.id)));

  const myStamps = attendance[registeredUser?.id] || new Set();
  const unreadCount = announcements.filter(a => !readIds.has(a.id)).length;

  const adminElement = (
    <AdminGate>
      <AdminDashboard
        attendance={attendance}
        onStamp={toggleStamp}
        announcements={announcements}
        onPostAnnouncement={postAnnouncement}
        onDeleteAnnouncement={deleteAnnouncement}
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
              <CommunityPassport stamps={myStamps} onManualStamp={toggleStamp} user={registeredUser} />
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
