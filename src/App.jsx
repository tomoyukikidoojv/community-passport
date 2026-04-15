import { useState } from "react";
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage";
import CommunityPassport from "./pages/CommunityPassport";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import AdminDashboard from "./pages/AdminDashboard";
import { C, USERS, initialAttendance, initialAnnouncements } from "./constants";

const NAV_ITEMS = [
  { path: "/register",      label: "📝 登録",         labelEn: "Register"      },
  { path: "/passport",      label: "🎫 マイパスポート", labelEn: "My Passport"   },
  { path: "/announcements", label: "📢 お知らせ",       labelEn: "Announcements" },
  { path: "/admin",         label: "👑 管理者",         labelEn: "Admin"         },
];

function AppLayout({ children, registeredUser, myStamps, unreadCount }) {
  return (
    <div style={{ fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif" }}>
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
            fontSize: 18, flexShrink: 0,
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

        {/* Nav links */}
        <div style={{ display: "flex", flex: 1 }}>
          {NAV_ITEMS.map((item, i) => {
            const isNotices = item.path === "/announcements";
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  background: isActive ? "rgba(255,255,255,0.10)" : "transparent",
                  border: "none", cursor: "pointer",
                  padding: "0 22px",
                  borderBottom: isActive ? `3px solid ${C.gold}` : "3px solid transparent",
                  borderTop: "3px solid transparent",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 1,
                  transition: "all 0.18s",
                  fontFamily: "inherit",
                  position: "relative",
                  textDecoration: "none",
                })}
              >
                {({ isActive }) => (
                  <>
                    <div style={{
                      position: "absolute", top: 8, left: 14,
                      width: 16, height: 16, borderRadius: "50%",
                      background: isActive ? C.gold : "rgba(255,255,255,0.2)",
                      color: isActive ? C.teal : "rgba(255,255,255,0.5)",
                      fontSize: 9, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.18s",
                    }}>{i + 1}</div>

                    {isNotices && unreadCount > 0 && (
                      <div style={{
                        position: "absolute", top: 6, right: 8,
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
                      transition: "all 0.18s",
                    }}>{item.label}</span>
                    <span style={{
                      fontSize: 9,
                      color: isActive ? C.gold : "rgba(255,255,255,0.3)",
                      letterSpacing: 0.5,
                      transition: "all 0.18s",
                    }}>{item.labelEn}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User chip */}
        {registeredUser && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "0 20px", borderLeft: "1px solid rgba(255,255,255,0.12)",
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
          </div>
        )}
      </nav>

      {children}
    </div>
  );
}

function AppRoutes() {
  const navigate = useNavigate();

  const [registeredUser, setRegisteredUser] = useState(USERS[0]);

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
    setRegisteredUser(newUser);
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

  return (
    <AppLayout
      registeredUser={registeredUser}
      myStamps={myStamps}
      unreadCount={unreadCount}
    >
      <Routes>
        <Route path="/" element={<RegisterPage onRegistered={handleRegistered} />} />
        <Route path="/register" element={<RegisterPage onRegistered={handleRegistered} />} />
        <Route path="/passport" element={
          <CommunityPassport stamps={myStamps} onManualStamp={toggleStamp} user={registeredUser} />
        } />
        <Route path="/announcements" element={
          <AnnouncementsPage
            announcements={announcements}
            readIds={readIds}
            onRead={markRead}
            onReadAll={markAllRead}
          />
        } />
        <Route path="/admin" element={
          <AdminDashboard
            attendance={attendance}
            onStamp={toggleStamp}
            announcements={announcements}
            onPostAnnouncement={postAnnouncement}
            onDeleteAnnouncement={deleteAnnouncement}
          />
        } />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
