import { useState } from "react";
import { C, NOTICE_CATS } from "../constants";
import { useLang } from "../i18n/LangContext";

function categoryMeta(id, t) {
  const cat = NOTICE_CATS.find(c => c.id === id) || { id, color: C.gray };
  return { ...cat, label: t ? t(`ann.cat.${cat.id}`) || cat.label || id : cat.label || id };
}

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function AnnouncementCard({ item, isRead, onRead }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLang();
  const cat = categoryMeta(item.category, t);

  const toggle = () => {
    setExpanded(e => !e);
    if (!isRead) onRead(item.id);
  };

  return (
    <div
      onClick={toggle}
      style={{
        borderRadius: 12,
        border: `1.5px solid ${isRead ? C.lightGray : cat.color + "60"}`,
        background: isRead ? C.white : `${cat.color}07`,
        boxShadow: isRead
          ? "0 1px 4px rgba(0,0,0,0.05)"
          : `0 3px 12px ${cat.color}20`,
        marginBottom: 12,
        cursor: "pointer",
        transition: "all 0.2s",
        overflow: "hidden",
      }}
    >
      <div style={{
        padding: "14px 16px",
        display: "flex", alignItems: "flex-start", gap: 12,
      }}>
        {/* Unread dot */}
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: isRead ? "transparent" : cat.color,
          flexShrink: 0, marginTop: 6,
          boxShadow: isRead ? "none" : `0 0 0 3px ${cat.color}25`,
          transition: "all 0.2s",
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 5,
            flexWrap: "wrap",
          }}>
            <span style={{
              background: `${cat.color}18`,
              color: cat.color,
              border: `1px solid ${cat.color}40`,
              borderRadius: 20, padding: "2px 10px",
              fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
            }}>{cat.label}</span>
            <span style={{ fontSize: 11, color: C.gray }}>{formatDate(item.date)}</span>
            {!isRead && (
              <span style={{
                background: cat.color, color: C.white,
                borderRadius: 20, padding: "1px 8px",
                fontSize: 9, fontWeight: 700,
              }}>NEW</span>
            )}
          </div>

          <div style={{
            fontSize: 14, fontWeight: isRead ? 600 : 700,
            color: isRead ? C.charcoal : C.navy,
            lineHeight: 1.4,
          }}>
            {item.title}
          </div>

          {!expanded && (
            <div style={{
              fontSize: 12, color: C.gray, marginTop: 4,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {item.body}
            </div>
          )}
        </div>

        <div style={{
          fontSize: 12, color: C.gray, flexShrink: 0, marginTop: 2,
          transform: expanded ? "rotate(180deg)" : "none",
          transition: "transform 0.2s",
        }}>▼</div>
      </div>

      {expanded && (
        <div style={{
          padding: "0 16px 16px 36px",
          fontSize: 13, color: C.charcoal,
          lineHeight: 1.75,
          borderTop: `1px dashed ${C.lightGray}`,
          paddingTop: 12,
          marginTop: -2,
        }}>
          {item.body}
        </div>
      )}
    </div>
  );
}

export default function AnnouncementsPage({ announcements, readIds, onRead, onReadAll }) {
  const { t } = useLang();
  const [filter, setFilter] = useState("all");

  const unreadCount = announcements.filter(a => !readIds.has(a.id)).length;

  const filtered = filter === "all"
    ? announcements
    : announcements.filter(a => a.category === filter);

  const sortedCats = [...new Set(announcements.map(a => a.category))];

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${C.teal} 0%, ${C.navy} 100%)`,
      padding: "28px 16px 48px",
      fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
    }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>

        <div style={{ textAlign: "center", color: C.white, marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 5, opacity: 0.6, marginBottom: 4 }}>
            FROM THE SECRETARIAT
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {t("ann.title")}
            {unreadCount > 0 && (
              <span style={{
                background: "#E74C3C", color: C.white,
                borderRadius: 20, padding: "2px 10px",
                fontSize: 14, fontWeight: 700,
                boxShadow: "0 2px 8px rgba(231,76,60,0.5)",
              }}>{unreadCount}</span>
            )}
          </div>
          <div style={{ fontSize: 12, opacity: 0.5, marginTop: 3 }}>{t("ann.subtitle")}</div>
        </div>

        {/* Filter + actions bar */}
        <div style={{
          background: C.white, borderRadius: 14,
          marginBottom: 16,
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}>
          {/* Scrollable filter row */}
          <div style={{
            display: "flex", gap: 6,
            padding: "12px 16px",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
          }}>
            {[{ id: "all", label: t("ann.all"), color: C.teal }, ...NOTICE_CATS.filter(c => sortedCats.includes(c.id)).map(c => ({ ...c, label: t(`ann.cat.${c.id}`) || c.label }))].map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                style={{
                  padding: "6px 16px", borderRadius: 20, border: "none",
                  cursor: "pointer", fontSize: 13, fontWeight: filter === cat.id ? 700 : 400,
                  background: filter === cat.id ? cat.color : C.offWhite,
                  color: filter === cat.id ? C.white : C.gray,
                  transition: "all 0.15s", fontFamily: "inherit",
                  whiteSpace: "nowrap", flexShrink: 0,
                }}
              >{cat.label}</button>
            ))}
          </div>

          {/* Read-all button row */}
          {unreadCount > 0 && (
            <div style={{
              borderTop: `1px solid ${C.lightGray}`,
              padding: "8px 16px",
              display: "flex", justifyContent: "flex-end",
            }}>
              <button
                onClick={onReadAll}
                style={{
                  padding: "5px 16px", borderRadius: 20,
                  border: `1px solid ${C.lightGray}`,
                  background: C.white, color: C.gray,
                  cursor: "pointer", fontSize: 12, fontFamily: "inherit",
                }}
              >
                {t("ann.mark_read")}
              </button>
            </div>
          )}
        </div>

        {/* Announcement list */}
        <div>
          {filtered.length === 0 ? (
            <div style={{
              background: C.white, borderRadius: 12, padding: "40px",
              textAlign: "center", color: C.gray, fontSize: 14,
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            }}>
              {t("ann.empty")}
            </div>
          ) : (
            filtered.map(item => (
              <AnnouncementCard
                key={item.id}
                item={item}
                isRead={readIds.has(item.id)}
                onRead={onRead}
              />
            ))
          )}
        </div>

        <div style={{
          textAlign: "center", marginTop: 8,
          fontSize: 11, color: "rgba(255,255,255,0.4)",
        }}>
          お問い合わせ：芦屋市多文化共生アドバイザー事務局
        </div>
      </div>
    </div>
  );
}
