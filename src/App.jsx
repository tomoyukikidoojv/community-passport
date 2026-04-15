import { useState } from "react";
import { BrowserRouter, Routes, Route, NavLink, useNavigate, Navigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import CommunityPassport from "./pages/CommunityPassport";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import CalendarPage from "./pages/CalendarPage";
import ApplyPage from "./pages/ApplyPage";
import AdminDashboard from "./pages/AdminDashboard";
import { C, initialAttendance, initialAnnouncements } from "./constants";

const ADMIN_PASSWORD = "Kidodomo1551";
const STORAGE_KEY = "cp_user";

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
  const NAV = [
    { path: "/announcements", label: "📢 お知らせ",       labelEn: "Announcements" },
    { path: "/calendar",      label: "📅 カレンダー",     labelEn: "Calendar"      },
    { path: "/passport",      label: "🎫 マイパスポート", labelEn: "My Passport"   },
  ];

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: `linear-gradient(90deg, ${C.navy} 0%, ${C.teal} 100%)`,
      boxShadow: "0 2px 16px rgba(0,0,0,0.35)",
      display: "flex", alignItems: "stretch",
    }}>
      {/* Logo */}
      <div style={{
        padding: "0 20px",
        display: "flex", alignItems: "center", gap: 10,
        borderRight: "1px solid rgba(255,255,255,0.12)",
        flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: C.gold,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
        }}>🌏</div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ color: C.white, fontWeight: 800, fontSize: 13, letterSpacing: 0.5 }}>
            Community
          </div>
          <div style={{ color: C.gold, fontWeight: 800, fontSize: 13, letterSpacing: 0.5 }}>
            Passport
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", flex: 1 }}>
        {NAV.map((item) => {
          const isNotices = item.path === "/announcements";
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                background: isActive ? "rgba(255,255,255,0.10)" : "transparent",
                border: "none", cursor: "pointer",
                padding: "0 28px",
                borderBottom: isActive ? `3px solid ${C.gold}` : "3px solid transparent",
                borderTop: "3px solid transparent",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 1,
                transition: "all 0.18s",
                position: "relative",
                textDecoration: "none",
              })}
            >
              {({ isActive }) => (
                <>
                  {isNotices && unreadCount > 0 && (
                    <div style={{
                      position: "absolute", top: 6, right: 12,
                      minWidth: 16, height: 16, borderRadius: 8,
                      background: "#E74C3C", color: C.white,
                      fontSize: 9, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 4px",
                      boxShadow: "0 1px 4px rgba(231,76,60,0.6)",
                    }}>{unreadCount}</div>
                  )}
                  <span style={{
                    fontSize: 13,
                    color: isActive ? C.white : "rgba(255,255,255,0.55)",
                    fontWeight: isActive ? 700 : 400,
                  }}>{item.label}</span>
                  <span style={{
                    fontSize: 9,
                    color: isActive ? C.gold : "rgba(255,255,255,0.3)",
                    letterSpacing: 0.5,
                  }}>{item.labelEn}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User chip + logout */}
      {registeredUser && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "0 16px", borderLeft: "1px solid rgba(255,255,255,0.12)",
          flexShrink: 0,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: C.goldLight, border: `2px solid ${C.gold}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15,
          }}>{registeredUser.flag}</div>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ color: C.white, fontSize: 12, fontWeight: 600 }}>
              {registeredUser.name}
            </div>
            <div style={{ color: C.gold, fontSize: 10 }}>
              ⭐ {myStamps.size}/6 スタンプ
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, marginLeft: 4 }}>
            <button
              onClick={onLogout}
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 6, padding: "3px 8px",
                color: "rgba(255,255,255,0.7)", fontSize: 10,
                cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
            >
              ログアウト
            </button>
            <NavLink
              to="/kanri-ashiya2026"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 6, padding: "3px 8px",
                color: "rgba(255,255,255,0.45)", fontSize: 10,
                cursor: "pointer", fontFamily: "inherit",
                textDecoration: "none", textAlign: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
            >
              管理者
            </NavLink>
          </div>
        </div>
      )}
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

  const [attendance, setAttendance] = useState(
    () => Object.fromEntries(
      Object.entries(initialAttendance).map(([k, v]) => [k, new Set(v)])
    )
  );

  const [announcements, setAnnouncements] = useState([...initialAnnouncements]);
  const [readIds, setReadIds] = useState(new Set());

  const toggleStamp = (userId, eventId) => {
    setAttendance(prev => {
      const userSet = new Set(prev[userId] || []);
      if (userSet.has(eventId)) userSet.delete(eventId);
      else userSet.add(eventId);
      return { ...prev, [userId]: userSet };
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
  // Not registered yet → registration (except admin)
  if (!registeredUser) {
    return (
      <Routes>
        <Route path="/kanri-ashiya2026" element={adminElement} />
        <Route path="*" element={<RegisterPage onRegistered={handleRegistered} />} />
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
            <Route path="/apply/:eventId" element={
              <ApplyPage user={registeredUser} />
            } />
            <Route path="/passport" element={
              <CommunityPassport stamps={myStamps} onManualStamp={toggleStamp} user={registeredUser} />
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
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
