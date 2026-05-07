import { useState } from "react";
import { C, NOTICE_CATS } from "../constants";
import { useLang } from "../i18n/LangContext";

// 言語フラグマップ
const LANG_FLAGS = { ja: "🇯🇵", en: "🇺🇸", es: "🇪🇸", fr: "🇫🇷", pt: "🇵🇹", ko: "🇰🇷", zh: "🇨🇳" };

// URLを検出してクリッカブルリンクに変換
function renderBody(text) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) =>
    /^https?:\/\//.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ color: C.teal, wordBreak: "break-all", textDecoration: "underline" }}>
          {part}
        </a>
      : part
  );
}

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
  const { t, lang } = useLang();
  const cat = categoryMeta(item.category, t);

  // このカードで利用可能な言語一覧（翻訳が入力されているもの + 元言語 ja）
  const availLangs = ["ja", ...Object.keys(item.i18n || {}).filter(
    k => item.i18n[k]?.title || item.i18n[k]?.body
  )];

  // カード固有の表示言語（グローバル言語を初期値に、availLangs にあれば使う）
  const initLang = availLangs.includes(lang) ? lang : "ja";
  const [cardLang, setCardLang] = useState(initLang);

  // 表示テキスト（jaは元テキスト、他は i18n から）
  const localTitle = cardLang === "ja"
    ? item.title
    : (item.i18n?.[cardLang]?.title || item.title);
  const localBody = cardLang === "ja"
    ? item.body
    : (item.i18n?.[cardLang]?.body || item.body);

  const toggle = () => {
    setExpanded(e => !e);
    if (!isRead) onRead(item.id);
  };

  return (
    <div
      onClick={toggle}
      style={{
        borderRadius: 14,
        border: `1.5px solid ${isRead ? "rgba(255,255,255,0.25)" : cat.color + "80"}`,
        background: isRead ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.96)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: isRead
          ? "0 2px 12px rgba(0,0,0,0.12)"
          : `0 4px 20px ${cat.color}30`,
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
            {localTitle}
          </div>

          {!expanded && (
            <div style={{
              fontSize: 12, color: C.gray, marginTop: 4,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {localBody}
            </div>
          )}
        </div>

        {/* 右上：言語切り替え + 開閉矢印 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          {/* 言語ボタン（翻訳が2言語以上ある場合のみ表示） */}
          {availLangs.length > 1 && (
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "flex-end" }}
              onClick={e => e.stopPropagation()}>
              {availLangs.map(code => (
                <button
                  key={code}
                  onClick={e => { e.stopPropagation(); setCardLang(code); }}
                  style={{
                    padding: "2px 6px", borderRadius: 10, cursor: "pointer",
                    fontSize: 13, lineHeight: 1,
                    background: cardLang === code ? `${cat.color}22` : "transparent",
                    border: `1px solid ${cardLang === code ? cat.color : "rgba(0,0,0,0.12)"}`,
                    outline: "none", transition: "all 0.15s",
                    opacity: cardLang === code ? 1 : 0.5,
                  }}
                  title={code.toUpperCase()}
                >
                  {LANG_FLAGS[code] || code}
                </button>
              ))}
            </div>
          )}
          {/* 開閉矢印 */}
          <div style={{
            fontSize: 11, color: C.gray,
            transform: expanded ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}>▼</div>
        </div>
      </div>

      {expanded && (
        <div style={{
          padding: "0 16px 16px 36px",
          fontSize: 13, color: C.charcoal,
          lineHeight: 1.75,
          borderTop: `1px dashed ${C.lightGray}`,
          paddingTop: 12,
          marginTop: -2,
          whiteSpace: "pre-line",
        }}>
          {renderBody(localBody)}
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
      background: C.bgGradient,
      padding: "28px 16px 48px",
      fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
    }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>

        <div style={{ textAlign: "center", color: C.white, marginBottom: 24 }}>
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
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 14,
          marginBottom: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
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
              background: "rgba(255,255,255,0.90)",
              backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 14, padding: "40px",
              textAlign: "center", color: C.gray, fontSize: 14,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
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
