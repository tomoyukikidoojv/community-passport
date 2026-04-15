import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { C, EVENTS, USERS, getLevel, NOTICE_CATS } from "../constants";
import { getApplicationsByEvent } from "./ApplyPage";
import { getRsvpCounts } from "./CalendarPage";
import EventFormBuilder from "./admin/EventFormBuilder";
import { getForm } from "../lib/formStorage";

const inputStyle = {
  width: "100%", padding: "9px 12px",
  border: `1.5px solid ${C.lightGray}`, borderRadius: 8,
  fontSize: 13, color: C.charcoal, fontFamily: "inherit",
  outline: "none", background: C.white, boxSizing: "border-box",
};

const EMPTY_FORM = { category: "event", title: "", body: "" };

function NoticeForm({ onPost }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setError("タイトルと本文を入力してください");
      return;
    }
    onPost({ ...form, id: Date.now(), date: new Date().toISOString().slice(0, 10) });
    setForm(EMPTY_FORM);
    setError("");
  };

  const cat = NOTICE_CATS.find(c => c.id === form.category);

  return (
    <form onSubmit={submit} style={{ padding: "20px 22px 22px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.charcoal, marginBottom: 5 }}>
            カテゴリ
          </div>
          <select
            value={form.category} onChange={set("category")}
            style={{
              ...inputStyle,
              appearance: "none", cursor: "pointer",
              background: `${cat.color}12`,
              color: cat.color, fontWeight: 700,
              border: `1.5px solid ${cat.color}50`,
            }}
          >
            {NOTICE_CATS.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.charcoal, marginBottom: 5 }}>
            タイトル <span style={{ color: "#E74C3C" }}>*</span>
          </div>
          <input
            type="text" value={form.title} onChange={set("title")}
            placeholder="お知らせのタイトルを入力"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.charcoal, marginBottom: 5 }}>
          本文 <span style={{ color: "#E74C3C" }}>*</span>
        </div>
        <textarea
          value={form.body} onChange={set("body")}
          placeholder="お知らせの内容を入力してください"
          rows={3}
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
        />
      </div>

      {error && (
        <div style={{ color: "#E74C3C", fontSize: 12, marginBottom: 8 }}>{error}</div>
      )}

      <button
        type="submit"
        style={{
          padding: "9px 24px", borderRadius: 8, border: "none",
          background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
          color: C.white, fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
        }}
      >
        📢 投稿する
      </button>
    </form>
  );
}

const ADMIN_TABS = [
  { id: "attendance",    label: "出席状況", emoji: "📊" },
  { id: "announcements", label: "お知らせ", emoji: "📢" },
  { id: "applications",  label: "申込管理", emoji: "📋" },
  { id: "formbuilder",   label: "フォーム", emoji: "🛠" },
];

export default function AdminDashboard({ attendance, onStamp, announcements, onPostAnnouncement, onDeleteAnnouncement }) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [flash, setFlash] = useState(null);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("attendance");
  const navigate = useNavigate();

  const toggleAttendance = (userId, eventId) => {
    onStamp(userId, eventId);
    setFlash({ userId, eventId });
    setTimeout(() => setFlash(null), 1500);
  };

  const totalPerEvent = EVENTS.map(ev =>
    USERS.filter(u => attendance[u.id]?.has(ev.id)).length
  );
  const totalPerUser = USERS.map(u => attendance[u.id]?.size || 0);
  const grandTotal = totalPerUser.reduce((a, b) => a + b, 0);

  return (
    <>
    {showQrScanner && (
      <QrScanModal
        onStamp={onStamp}
        onClose={() => setShowQrScanner(false)}
      />
    )}
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${C.teal} 0%, ${C.navy} 100%)`,
      padding: "28px 16px 40px",
      fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
    }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", color: C.white, marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: 5, opacity: 0.6, marginBottom: 4 }}>ADMIN</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>👑 管理者ダッシュボード</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
            <button
              onClick={() => navigate("/passport")}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 20, padding: "6px 18px",
                color: C.white, fontSize: 12, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >👤 利用者画面を見る</button>
            <button
              onClick={() => setShowQrScanner(true)}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 20, padding: "6px 18px",
                color: C.white, fontSize: 12, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >📷 QRスキャン</button>
          </div>
        </div>

        {/* Tab navigation */}
        <div style={{
          display: "flex", background: "rgba(255,255,255,0.10)",
          borderRadius: 14, padding: 4, marginBottom: 20, gap: 2,
        }}>
          {ADMIN_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, border: "none", borderRadius: 10, cursor: "pointer",
                padding: "10px 4px", fontFamily: "inherit",
                background: activeTab === tab.id ? C.white : "transparent",
                color: activeTab === tab.id ? C.navy : "rgba(255,255,255,0.65)",
                fontWeight: activeTab === tab.id ? 700 : 400,
                fontSize: 12,
                boxShadow: activeTab === tab.id ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 18, lineHeight: 1.2 }}>{tab.emoji}</div>
              <div style={{ marginTop: 2 }}>{tab.label}</div>
            </button>
          ))}
        </div>

        {/* ── Tab: 出席状況 ── */}
        {activeTab === "attendance" && <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "参加者数",     value: USERS.length,  unit: "人", color: C.teal    },
              { label: "イベント数",   value: EVENTS.length, unit: "回", color: C.tealMid },
              { label: "総スタンプ数", value: grandTotal,    unit: "個", color: C.green   },
              { label: "平均参加率",
                value: Math.round((grandTotal / (USERS.length * EVENTS.length)) * 100),
                unit: "%", color: C.gold },
            ].map(stat => (
              <div key={stat.label} style={{
                background: C.white, borderRadius: 12, padding: "14px 16px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                borderTop: `4px solid ${stat.color}`,
              }}>
                <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>{stat.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</span>
                  <span style={{ fontSize: 13, color: C.gray }}>{stat.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            background: C.white, borderRadius: 16,
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
            overflow: "hidden",
          }}>
          <div style={{
            padding: "16px 20px 14px",
            borderBottom: `1px solid ${C.lightGray}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: C.charcoal,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{
                display: "inline-block", width: 4, height: 16,
                background: C.teal, borderRadius: 2,
              }} />
              参加状況一覧
            </div>
            <button
              onClick={() => setEditMode(e => !e)}
              style={{
                padding: "5px 14px", borderRadius: 20, border: "none",
                cursor: "pointer", fontSize: 12, fontWeight: 700,
                background: editMode ? C.teal : C.offWhite,
                color: editMode ? C.white : C.gray,
                transition: "all 0.15s", fontFamily: "inherit",
              }}
            >
              {editMode ? "✏️ 編集中" : "編集"}
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "inherit" }}>
              <thead>
                <tr>
                  <th style={{
                    padding: "12px 16px", textAlign: "left",
                    background: C.offWhite, borderBottom: `2px solid ${C.lightGray}`,
                    color: C.charcoal, fontWeight: 700, whiteSpace: "nowrap", minWidth: 160,
                  }}>参加者</th>
                  {EVENTS.map(ev => (
                    <th key={ev.id} style={{
                      padding: "8px 6px", textAlign: "center",
                      background: C.offWhite, borderBottom: `2px solid ${C.lightGray}`,
                      borderLeft: `1px solid ${C.lightGray}`,
                      color: ev.color, fontWeight: 700, minWidth: 80,
                    }}>
                      <div style={{ fontSize: 18, lineHeight: 1 }}>{ev.emoji}</div>
                      <div style={{ fontSize: 10, lineHeight: 1.25, marginTop: 4, color: C.charcoal, fontWeight: 600, whiteSpace: "pre-line" }}>
                        {ev.nameShort}
                      </div>
                      <div style={{ fontSize: 9, color: C.gray, marginTop: 2, fontWeight: 400 }}>
                        {ev.date}
                      </div>
                    </th>
                  ))}
                  <th style={{
                    padding: "12px 10px", textAlign: "center",
                    background: C.tealPale, borderBottom: `2px solid ${C.lightGray}`,
                    borderLeft: `2px solid ${C.tealLight}`,
                    color: C.teal, fontWeight: 700, minWidth: 80,
                  }}>
                    合計<br />
                    <span style={{ fontSize: 10, fontWeight: 400, color: C.gray }}>/{EVENTS.length}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {USERS.map((user, ui) => {
                  const userStamps = attendance[user.id] || new Set();
                  const count = userStamps.size;
                  const level = getLevel(count);
                  const rowBg = ui % 2 === 0 ? C.white : C.offWhite;

                  return (
                    <tr key={user.id}>
                      <td style={{ padding: "10px 16px", background: rowBg, borderBottom: `1px solid ${C.lightGray}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: "50%",
                            background: `${level.color}20`, border: `2px solid ${level.color}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 16, flexShrink: 0,
                          }}>{user.flag}</div>
                          <div>
                            <div style={{ fontWeight: 700, color: C.charcoal, fontSize: 13 }}>
                              {user.name}
                            </div>
                            <div style={{ color: C.gray, fontSize: 10 }}>{user.nameEn}</div>
                            <div style={{
                              display: "inline-block",
                              background: `${level.color}18`, color: level.color,
                              border: `1px solid ${level.color}40`,
                              borderRadius: 20, padding: "1px 7px",
                              fontSize: 9, fontWeight: 700, marginTop: 2,
                            }}>{level.label}</div>
                          </div>
                        </div>
                      </td>

                      {EVENTS.map(ev => {
                        const attended = userStamps.has(ev.id);
                        const isHovered = hoveredCell?.userId === user.id && hoveredCell?.eventId === ev.id;
                        const isFlash = flash?.userId === user.id && flash?.eventId === ev.id;

                        return (
                          <td
                            key={ev.id}
                            onClick={() => editMode && toggleAttendance(user.id, ev.id)}
                            onMouseEnter={() => editMode && setHoveredCell({ userId: user.id, eventId: ev.id })}
                            onMouseLeave={() => editMode && setHoveredCell(null)}
                            style={{
                              textAlign: "center", cursor: editMode ? "pointer" : "default",
                              background: isFlash ? `${ev.color}25`
                                : attended ? `${ev.color}12`
                                : (editMode && isHovered) ? C.tealPale : rowBg,
                              borderBottom: `1px solid ${C.lightGray}`,
                              borderLeft: `1px solid ${C.lightGray}`,
                              transition: "background 0.15s",
                              padding: "8px 4px",
                            }}
                          >
                            {attended ? (
                              <div style={{
                                width: 28, height: 28, borderRadius: "50%",
                                background: ev.color, color: C.white,
                                fontSize: 14, display: "flex",
                                alignItems: "center", justifyContent: "center",
                                fontWeight: 900, margin: "0 auto",
                                boxShadow: `0 2px 6px ${ev.color}50`,
                              }}>✓</div>
                            ) : (
                              <div style={{
                                width: 28, height: 28, borderRadius: "50%",
                                border: `2px dashed ${(editMode && isHovered) ? ev.color : C.lightGray}`,
                                display: "flex", alignItems: "center",
                                justifyContent: "center", margin: "0 auto",
                                color: (editMode && isHovered) ? ev.color : C.lightGray,
                                fontSize: 14, transition: "all 0.15s",
                                opacity: editMode ? 1 : 0.5,
                              }}>{editMode ? "+" : "−"}</div>
                            )}
                          </td>
                        );
                      })}

                      <td style={{
                        textAlign: "center",
                        background: count >= EVENTS.length ? `${C.gold}20` : count > 0 ? C.tealPale : rowBg,
                        borderBottom: `1px solid ${C.lightGray}`,
                        borderLeft: `2px solid ${C.tealLight}`,
                        fontWeight: 800, color: level.color,
                        fontSize: 16, padding: "8px",
                      }}>
                        {count}
                        {count >= EVENTS.length && <div style={{ fontSize: 12 }}>🏆</div>}
                      </td>
                    </tr>
                  );
                })}

                <tr>
                  <td style={{
                    padding: "10px 16px",
                    background: C.tealPale,
                    borderTop: `2px solid ${C.tealLight}`,
                    fontWeight: 700, color: C.teal, fontSize: 12,
                  }}>参加者合計</td>
                  {EVENTS.map((ev, i) => (
                    <td key={ev.id} style={{
                      textAlign: "center",
                      background: C.tealPale,
                      borderTop: `2px solid ${C.tealLight}`,
                      borderLeft: `1px solid ${C.tealLight}`,
                      fontWeight: 800, color: ev.color, fontSize: 16, padding: "8px",
                    }}>
                      {totalPerEvent[i]}
                      <div style={{ fontSize: 9, color: C.gray, fontWeight: 400 }}>
                        {Math.round((totalPerEvent[i] / USERS.length) * 100)}%
                      </div>
                    </td>
                  ))}
                  <td style={{
                    textAlign: "center",
                    background: C.teal, color: C.white,
                    borderTop: `2px solid ${C.tealLight}`,
                    borderLeft: `2px solid ${C.tealLight}`,
                    fontWeight: 800, fontSize: 16, padding: "8px",
                  }}>{grandTotal}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{
            padding: "12px 20px",
            background: C.offWhite,
            borderTop: `1px solid ${C.lightGray}`,
            display: "flex", alignItems: "center", gap: 20,
            fontSize: 11, color: C.gray,
          }}>
            <span>凡例：</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{
                display: "inline-block", width: 18, height: 18, borderRadius: "50%",
                background: C.teal, color: C.white, fontSize: 11,
                textAlign: "center", lineHeight: "18px", fontWeight: 900,
              }}>✓</span>
              出席済み
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{
                display: "inline-block", width: 18, height: 18, borderRadius: "50%",
                border: `2px dashed ${C.lightGray}`, textAlign: "center",
                lineHeight: "14px", color: C.lightGray, fontSize: 12,
              }}>+</span>
              未出席（クリックで記録）
            </span>
          </div>
        </div>
        </>}

        {/* ── Tab: お知らせ ── */}
        {activeTab === "announcements" && <div style={{
          background: C.white, borderRadius: 16,
          boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "16px 20px 14px",
            borderBottom: `1px solid ${C.lightGray}`,
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 13, fontWeight: 700, color: C.charcoal,
          }}>
            <span style={{ display: "inline-block", width: 4, height: 16, background: C.gold, borderRadius: 2 }} />
            お知らせ管理
            <span style={{
              background: C.tealPale, color: C.teal, borderRadius: 20,
              padding: "1px 10px", fontSize: 11, fontWeight: 700,
            }}>{announcements.length}件</span>
          </div>

          <div style={{ borderBottom: `1px solid ${C.lightGray}` }}>
            <div style={{ padding: "12px 22px 8px", fontSize: 12, fontWeight: 700, color: C.gray }}>
              ＋ 新しいお知らせを投稿
            </div>
            <NoticeForm onPost={onPostAnnouncement} />
          </div>

          <div style={{ padding: "16px 20px" }}>
            {announcements.length === 0 ? (
              <div style={{ color: C.gray, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                投稿されたお知らせはありません
              </div>
            ) : (
              announcements.map(item => {
                const cat = NOTICE_CATS.find(c => c.id === item.category) || { label: item.category, color: C.gray };
                return (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "10px 12px", borderRadius: 8,
                    border: `1px solid ${C.lightGray}`, marginBottom: 8, background: C.offWhite,
                  }}>
                    <span style={{
                      background: `${cat.color}18`, color: cat.color,
                      border: `1px solid ${cat.color}40`,
                      borderRadius: 20, padding: "2px 9px",
                      fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
                    }}>{cat.label}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: C.charcoal }}>{item.title}</div>
                      <div style={{
                        fontSize: 11, color: C.gray, marginTop: 2,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{item.body}</div>
                    </div>
                    <div style={{ fontSize: 11, color: C.gray, whiteSpace: "nowrap", flexShrink: 0 }}>
                      {item.date}
                    </div>
                    <button
                      onClick={() => onDeleteAnnouncement(item.id)}
                      style={{
                        background: "none", border: `1px solid ${C.lightGray}`,
                        borderRadius: 6, padding: "3px 8px",
                        color: C.gray, cursor: "pointer", fontSize: 11,
                        fontFamily: "inherit", flexShrink: 0, transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = C.redPale; e.currentTarget.style.color = C.red; e.currentTarget.style.borderColor = C.red; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.gray; e.currentTarget.style.borderColor = C.lightGray; }}
                    >削除</button>
                  </div>
                );
              })
            )}
          </div>
        </div>}

        {/* ── Tab: 申込管理 ── */}
        {activeTab === "applications" && <>
          <RsvpSummaryPanel />
          <ApplicationsPanel />
        </>}

        {/* ── Tab: フォーム ── */}
        {activeTab === "formbuilder" && <EventFormBuilder />}

      </div>
    </div>
    </>
  );
}

function QrScanModal({ onStamp, onClose }) {
  const [scanned, setScanned] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(EVENTS[0].id);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const scannedRef = useRef(false);

  useEffect(() => {
    const qr = new Html5Qrcode("qr-reader-admin");
    scannerRef.current = qr;
    qr.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (text) => {
        if (scannedRef.current) return;
        try {
          const data = JSON.parse(decodeURIComponent(escape(atob(text))));
          if (!data.id || !data.name) return;
          scannedRef.current = true;
          setScanned(data);
          qr.stop().catch(() => {});
        } catch {
          // not our QR, ignore
        }
      },
      () => {}
    ).catch(err => setError("カメラへのアクセスが許可されていません"));

    return () => {
      qr.stop().catch(() => {});
    };
  }, []);

  const handleRecord = () => {
    if (!scanned || !selectedEventId) return;
    onStamp(scanned.id, selectedEventId);
    setDone(true);
  };

  const handleReset = () => {
    setScanned(null);
    setDone(false);
    scannedRef.current = false;
    const qr = scannerRef.current;
    if (qr) {
      qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (text) => {
          if (scannedRef.current) return;
          try {
            const data = JSON.parse(decodeURIComponent(escape(atob(text))));
            if (!data.id || !data.name) return;
            scannedRef.current = true;
            setScanned(data);
            qr.stop().catch(() => {});
          } catch {}
        },
        () => {}
      ).catch(() => {});
    }
  };

  const ev = EVENTS.find(e => e.id === selectedEventId);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
      fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
    }}>
      <div style={{
        background: C.white, borderRadius: 20,
        width: "100%", maxWidth: 420, overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
          padding: "14px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ color: C.white, fontWeight: 800, fontSize: 14 }}>📷 QRコードスキャン</div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 2 }}>
              利用者のパスポートQRを読み取ってください
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.15)", border: "none",
            color: C.white, borderRadius: 8, padding: "6px 12px",
            cursor: "pointer", fontSize: 13, fontFamily: "inherit",
          }}>✕ 閉じる</button>
        </div>

        <div style={{ padding: "20px" }}>
          {error ? (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: 10, padding: "16px", textAlign: "center",
              color: "#B91C1C", fontSize: 13,
            }}>
              📵 {error}
            </div>
          ) : !scanned ? (
            <>
              {/* Camera view */}
              <div style={{
                borderRadius: 12, overflow: "hidden",
                border: `2px solid ${C.teal}`,
                marginBottom: 12,
                background: "#000",
              }}>
                <div id="qr-reader-admin" style={{ width: "100%" }} />
              </div>
              <div style={{
                textAlign: "center", fontSize: 12, color: C.gray,
                padding: "6px 0",
              }}>
                カメラをQRコードに向けてください
              </div>
            </>
          ) : done ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.charcoal, marginBottom: 6 }}>
                出席を記録しました
              </div>
              <div style={{
                background: C.offWhite, borderRadius: 10,
                padding: "12px 16px", marginBottom: 16, textAlign: "left",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 4 }}>
                  {scanned.flag} {scanned.name}
                </div>
                <div style={{ fontSize: 12, color: C.gray }}>{scanned.nameEn}</div>
                <div style={{
                  marginTop: 8, fontSize: 12, color: ev?.color, fontWeight: 700,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span>{ev?.emoji}</span>
                  <span>{ev?.nameShort}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleReset}
                  style={{
                    flex: 1, padding: "11px", borderRadius: 8,
                    border: `1.5px solid ${C.teal}`, background: C.white,
                    color: C.teal, fontSize: 13, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >次の人をスキャン</button>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1, padding: "11px", borderRadius: 8, border: "none",
                    background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
                    color: C.white, fontSize: 13, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >閉じる</button>
              </div>
            </div>
          ) : (
            <>
              {/* Scanned user info */}
              <div style={{
                background: `${C.teal}10`, border: `1.5px solid ${C.tealLight}`,
                borderRadius: 12, padding: "14px 16px", marginBottom: 16,
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: C.tealPale, border: `2px solid ${C.teal}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, flexShrink: 0,
                }}>
                  {scanned.flag}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.charcoal }}>
                    {scanned.name}
                  </div>
                  <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>
                    {scanned.nameEn}
                  </div>
                  <div style={{
                    marginTop: 5, display: "inline-block",
                    background: C.teal, color: C.white,
                    borderRadius: 20, padding: "2px 10px",
                    fontSize: 11, fontWeight: 700,
                  }}>✓ QR認証済み</div>
                </div>
              </div>

              {/* Event selector */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.charcoal, marginBottom: 8 }}>
                  記録するイベントを選択
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {EVENTS.map(ev => (
                    <label key={ev.id} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                      border: `2px solid ${selectedEventId === ev.id ? ev.color : C.lightGray}`,
                      background: selectedEventId === ev.id ? `${ev.color}10` : C.white,
                      transition: "all 0.15s",
                    }}>
                      <input
                        type="radio"
                        name="event"
                        checked={selectedEventId === ev.id}
                        onChange={() => setSelectedEventId(ev.id)}
                        style={{ accentColor: ev.color }}
                      />
                      <span style={{ fontSize: 18 }}>{ev.emoji}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: selectedEventId === ev.id ? ev.color : C.charcoal }}>
                          {ev.nameShort}
                        </div>
                        <div style={{ fontSize: 10, color: C.gray }}>{ev.fullDate}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleRecord}
                style={{
                  width: "100%", padding: "13px", borderRadius: 10, border: "none",
                  background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
                  color: C.white, fontSize: 14, fontWeight: 800,
                  cursor: "pointer", fontFamily: "inherit",
                  boxShadow: `0 4px 16px ${C.teal}40`,
                }}
              >
                ✅ 出席を記録する
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RsvpSummaryPanel() {
  return (
    <div style={{
      background: C.white, borderRadius: 16,
      boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
      overflow: "hidden", marginTop: 20,
    }}>
      <div style={{
        padding: "16px 20px 14px",
        borderBottom: `1px solid ${C.lightGray}`,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{
          display: "inline-block", width: 4, height: 16,
          background: C.teal, borderRadius: 2,
        }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>
          参加意向サマリー
        </span>
      </div>

      <div style={{ padding: "12px 16px" }}>
        {EVENTS.map(ev => {
          const { going, notGoing } = getRsvpCounts(ev.id);
          const total = going + notGoing;
          const goingPct = total > 0 ? Math.round((going / total) * 100) : 0;
          return (
            <div key={ev.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px", marginBottom: 6,
              borderRadius: 10, border: `1px solid ${C.lightGray}`,
              background: C.offWhite,
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{ev.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.charcoal, marginBottom: 5 }}>
                  {ev.nameShort}
                </div>
                {total > 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      flex: 1, height: 8, borderRadius: 4,
                      background: C.lightGray, overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${goingPct}%`, height: "100%",
                        background: `linear-gradient(90deg, ${ev.color}, ${ev.color}bb)`,
                        borderRadius: 4, transition: "width 0.3s",
                      }} />
                    </div>
                    <span style={{ fontSize: 11, color: ev.color, fontWeight: 700, flexShrink: 0 }}>
                      {goingPct}%
                    </span>
                  </div>
                ) : (
                  <div style={{ height: 8, borderRadius: 4, background: C.lightGray }} />
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: 16, fontWeight: 800, color: going > 0 ? ev.color : C.lightGray,
                    lineHeight: 1,
                  }}>{going}</div>
                  <div style={{ fontSize: 10, color: C.gray, marginTop: 2 }}>参加したい</div>
                </div>
                <div style={{
                  width: 1, background: C.lightGray, alignSelf: "stretch",
                }} />
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: 16, fontWeight: 800, color: notGoing > 0 ? C.gray : C.lightGray,
                    lineHeight: 1,
                  }}>{notGoing}</div>
                  <div style={{ fontSize: 10, color: C.gray, marginTop: 2 }}>不参加</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ApplicationsPanel() {
  const [openEventId, setOpenEventId] = useState(null);

  return (
    <div style={{
      background: C.white, borderRadius: 16,
      boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
      overflow: "hidden", marginTop: 20,
    }}>
      <div style={{
        padding: "16px 20px 14px",
        borderBottom: `1px solid ${C.lightGray}`,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{
          display: "inline-block", width: 4, height: 16,
          background: C.purple, borderRadius: 2,
        }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>
          イベント申し込み一覧
        </span>
      </div>

      <div style={{ padding: "12px 16px" }}>
        {EVENTS.map(ev => {
          const apps = getApplicationsByEvent(ev.id);
          const formConfig = getForm(ev.id);
          const questions = formConfig?.questions || [];
          const isOpen = openEventId === ev.id;
          return (
            <div key={ev.id} style={{ marginBottom: 8 }}>
              <div
                onClick={() => setOpenEventId(isOpen ? null : ev.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                  border: `1px solid ${isOpen ? ev.color + "60" : C.lightGray}`,
                  background: isOpen ? `${ev.color}08` : C.offWhite,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 20 }}>{ev.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>
                    {ev.nameShort}
                  </div>
                  <div style={{ fontSize: 11, color: C.gray }}>{ev.fullDate}</div>
                </div>
                <div style={{
                  background: apps.length > 0 ? ev.color : C.lightGray,
                  color: apps.length > 0 ? C.white : C.gray,
                  borderRadius: 20, padding: "2px 12px",
                  fontSize: 12, fontWeight: 700,
                }}>
                  {apps.length}件
                </div>
                <span style={{
                  fontSize: 12, color: C.gray,
                  transform: isOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}>▼</span>
              </div>

              {isOpen && (
                <div style={{
                  border: `1px solid ${ev.color}30`,
                  borderTop: "none", borderRadius: "0 0 10px 10px",
                  overflow: "hidden",
                }}>
                  {apps.length === 0 ? (
                    <div style={{
                      padding: "16px", textAlign: "center",
                      color: C.gray, fontSize: 13,
                    }}>
                      申し込みはまだありません
                    </div>
                  ) : (
                    <div>
                      {apps.map((app, i) => (
                        <div key={i} style={{
                          padding: "12px 16px",
                          borderBottom: i < apps.length - 1 ? `1px solid ${C.lightGray}` : "none",
                          background: i % 2 === 0 ? C.white : C.offWhite,
                        }}>
                          {/* Header row */}
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: questions.length > 0 ? 8 : 0 }}>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontWeight: 700, color: C.charcoal, fontSize: 13 }}>
                                {app.userFlag} {app.userName}
                              </span>
                              {app.userNameEn && (
                                <span style={{ color: C.gray, fontSize: 11, marginLeft: 6 }}>({app.userNameEn})</span>
                              )}
                            </div>
                            <div style={{
                              background: `${ev.color}20`, color: ev.color,
                              borderRadius: 6, padding: "2px 8px",
                              fontSize: 11, fontWeight: 700,
                            }}>
                              {app.count}
                            </div>
                            <div style={{ color: C.gray, fontSize: 11, whiteSpace: "nowrap" }}>
                              {new Date(app.appliedAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>

                          {/* Custom answers */}
                          {questions.length > 0 && app.answers && (
                            <div style={{
                              background: C.offWhite, borderRadius: 8,
                              padding: "8px 12px",
                              display: "flex", flexDirection: "column", gap: 5,
                            }}>
                              {questions.map(q => {
                                const ans = app.answers[q.id];
                                const display = q.type === "name"
                                  ? [ans?.kanji, ans?.roman].filter(Boolean).join(" / ") || "—"
                                  : Array.isArray(ans) ? ans.join("、") : (ans || "—");
                                return (
                                  <div key={q.id} style={{ display: "flex", gap: 8, fontSize: 12 }}>
                                    <span style={{ color: C.gray, flexShrink: 0, minWidth: 100 }}>{q.label}</span>
                                    <span style={{ color: C.charcoal, fontWeight: 600 }}>{display}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
