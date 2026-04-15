import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C, EVENTS, USERS, getLevel, NOTICE_CATS } from "../constants";
import { getApplicationsByEvent } from "./ApplyPage";
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

export default function AdminDashboard({ attendance, onStamp, announcements, onPostAnnouncement, onDeleteAnnouncement }) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [flash, setFlash] = useState(null);
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
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${C.teal} 0%, ${C.navy} 100%)`,
      padding: "28px 16px 40px",
      fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
    }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        <div style={{ textAlign: "center", color: C.white, marginBottom: 22 }}>
          <div style={{ fontSize: 11, letterSpacing: 5, opacity: 0.6, marginBottom: 4 }}>ADMIN</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>👑 管理者ダッシュボード</div>
          <div style={{ fontSize: 12, opacity: 0.5, marginTop: 3 }}>
            参加者の出席状況を管理・承認
          </div>
          <button
            onClick={() => navigate("/passport")}
            style={{
              marginTop: 12,
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 20, padding: "6px 18px",
              color: C.white, fontSize: 12, cursor: "pointer",
              fontFamily: "inherit", transition: "all 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
          >
            👤 利用者画面を見る
          </button>
        </div>

        {/* Summary cards */}
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

        {/* Attendance table */}
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
            <div style={{ fontSize: 11, color: C.gray }}>
              セルをクリックして出席を記録・取消
            </div>
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
                            onClick={() => toggleAttendance(user.id, ev.id)}
                            onMouseEnter={() => setHoveredCell({ userId: user.id, eventId: ev.id })}
                            onMouseLeave={() => setHoveredCell(null)}
                            style={{
                              textAlign: "center", cursor: "pointer",
                              background: isFlash ? `${ev.color}25`
                                : attended ? `${ev.color}12`
                                : isHovered ? C.tealPale : rowBg,
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
                                border: `2px dashed ${isHovered ? ev.color : C.lightGray}`,
                                display: "flex", alignItems: "center",
                                justifyContent: "center", margin: "0 auto",
                                color: isHovered ? ev.color : C.lightGray,
                                fontSize: 14, transition: "all 0.15s",
                              }}>+</div>
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

        {/* Announcements management */}
        <div style={{
          background: C.white, borderRadius: 16,
          boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
          overflow: "hidden", marginTop: 20,
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
                background: C.gold, borderRadius: 2,
              }} />
              お知らせ管理
              <span style={{
                background: C.tealPale, color: C.teal, borderRadius: 20,
                padding: "1px 10px", fontSize: 11, fontWeight: 700,
              }}>{announcements.length}件</span>
            </div>
          </div>

          <div style={{ borderBottom: `1px solid ${C.lightGray}` }}>
            <div style={{
              padding: "12px 22px 8px",
              fontSize: 12, fontWeight: 700, color: C.gray,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span>＋ 新しいお知らせを投稿</span>
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
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px solid ${C.lightGray}`,
                    marginBottom: 8,
                    background: C.offWhite,
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
                        fontFamily: "inherit", flexShrink: 0,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = C.redPale; e.currentTarget.style.color = C.red; e.currentTarget.style.borderColor = C.red; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.gray; e.currentTarget.style.borderColor = C.lightGray; }}
                    >
                      削除
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Form builder ─────────────────────── */}
        <EventFormBuilder />

        {/* ── Applications section ─────────────── */}
        <ApplicationsPanel />

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
                                const display = Array.isArray(ans) ? ans.join("、") : (ans || "—");
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
