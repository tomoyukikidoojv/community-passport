import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import * as XLSX from "xlsx";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { C, getLevel, NOTICE_CATS } from "../constants";
import { fetchAllUsers, fetchAllAttendance } from "../lib/userService";
import { useEvents } from "../hooks/useEvents";
import EventsManager from "./admin/EventsManager";
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
  { id: "attendance",    label: "出席状況",   emoji: "📊" },
  { id: "stats",         label: "統計",       emoji: "📈" },
  { id: "members",       label: "会員一覧",   emoji: "👥" },
  { id: "announcements", label: "お知らせ",   emoji: "📢" },
  { id: "applications",  label: "参加者",     emoji: "📋" },
  { id: "events",        label: "イベント",   emoji: "📅" },
  { id: "formbuilder",   label: "アンケート", emoji: "📝" },
];

// ── ラベルマップ ──────────────────────────────────────────
const ACT_LABELS = {
  event: "イベント運営", interpret: "通訳・翻訳", children: "子供向け活動",
  education: "教育・言語サポート", cultural: "文化交流",
  sports: "スポーツ・レクリエーション", cooking: "料理・フードイベント",
  music: "音楽・パフォーマンス", arts: "アート・クラフト",
  community: "地域交流・コミュニティ活動", others: "その他",
};
const EVT_LABELS = {
  children: "子供向け活動", cultural: "文化交流", cooking: "料理・フードイベント",
  arts: "アート・クラフト", sports: "スポーツ・レクリエーション",
  music: "音楽・パフォーマンス", community: "地域交流・コミュニティ活動", others: "その他",
};
const labelize = (keys = [], map) => keys.map(k => map[k] || k).join(" / ");

// ── Excel ダウンロード ────────────────────────────────────
function downloadExcel(members) {
  const rows = members.map(m => ({
    "会員番号":           m.no || "",
    "名前":               m.name || "",
    "国":                 m.country?.name || "",
    "国旗":               m.flag || "",
    "メールアドレス":     m.email || "",
    "電話番号":           m.phone || "",
    "生年月日":           m.dob || "",
    "登録日":             m.since || "",
    "話せる言語":         (m.languages || []).join(" / "),
    "参加希望イベント":   labelize(m.eventInterests, EVT_LABELS) +
                          (m.eventInterestsOther ? ` / ${m.eventInterestsOther}` : ""),
    "ボランティア":       m.volunteer === "yes" ? "はい" : m.volunteer === "no" ? "いいえ" : "",
    "希望活動内容":       labelize(m.activities, ACT_LABELS),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  // 列幅を自動調整
  ws["!cols"] = Object.keys(rows[0] || {}).map(k => ({
    wch: Math.max(k.length * 2, 12),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "会員一覧");
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `members_${date}.xlsx`);
}

export default function AdminDashboard({ attendance, onStamp, announcements, onPostAnnouncement, onDeleteAnnouncement, onEditAnnouncement }) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [flash, setFlash] = useState(null);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("attendance");
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [members, setMembers] = useState([]);
  const [cloudAttendance, setCloudAttendance] = useState({});
  const [loadingMembers, setLoadingMembers] = useState(true);
  const events = useEvents();
  const navigate = useNavigate();

  // Firebase から登録ユーザーとスタンプを取得
  useEffect(() => {
    Promise.all([fetchAllUsers(), fetchAllAttendance()]).then(([users, stamps]) => {
      const sorted = [...users].sort((a, b) => (b.id || 0) - (a.id || 0));
      setMembers(sorted);
      setCloudAttendance(stamps);
      setLoadingMembers(false);
    });
  }, []);

  // Firebase のスタンプ + ローカルのスタンプをマージして使う
  const mergedAttendance = { ...attendance };
  Object.entries(cloudAttendance).forEach(([uid, set]) => {
    const id = Number(uid);
    const local = attendance[id] || new Set();
    mergedAttendance[id] = new Set([...local, ...set]);
  });

  const toggleAttendance = (userId, eventId) => {
    onStamp(userId, eventId);
    setFlash({ userId, eventId });
    setTimeout(() => setFlash(null), 1500);
  };

  const totalPerEvent = events.map(ev =>
    members.filter(u => mergedAttendance[u.id]?.has(ev.id)).length
  );
  const totalPerUser = members.map(u => mergedAttendance[u.id]?.size || 0);
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
              { label: "登録者数",     value: members.length,  unit: "人", color: C.teal    },
              { label: "イベント数",   value: events.length,   unit: "回", color: C.tealMid },
              { label: "総スタンプ数", value: grandTotal,      unit: "個", color: C.green   },
              { label: "平均参加率",
                value: members.length > 0 && events.length > 0
                  ? Math.round((grandTotal / (members.length * events.length)) * 100)
                  : 0,
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
                  {events.map(ev => (
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
                    <span style={{ fontSize: 10, fontWeight: 400, color: C.gray }}>/{events.length}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingMembers ? (
                  <tr><td colSpan={events.length + 2} style={{ padding: "24px", textAlign: "center", color: C.gray, fontSize: 13 }}>
                    読み込み中…
                  </td></tr>
                ) : members.length === 0 ? (
                  <tr><td colSpan={events.length + 2} style={{ padding: "24px", textAlign: "center", color: C.gray, fontSize: 13 }}>
                    登録されたユーザーはまだいません
                  </td></tr>
                ) : null}
                {members.map((user, ui) => {
                  const userStamps = mergedAttendance[user.id] || new Set();
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
                            fontSize: 16, flexShrink: 0, overflow: "hidden",
                          }}>
                            {user.photo
                              ? <img src={user.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : user.flag
                            }
                          </div>
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

                      {events.map(ev => {
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
                        background: count >= events.length ? `${C.gold}20` : count > 0 ? C.tealPale : rowBg,
                        borderBottom: `1px solid ${C.lightGray}`,
                        borderLeft: `2px solid ${C.tealLight}`,
                        fontWeight: 800, color: level.color,
                        fontSize: 16, padding: "8px",
                      }}>
                        {count}
                        {count >= events.length && <div style={{ fontSize: 12 }}>🏆</div>}
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
                  {events.map((ev, i) => (
                    <td key={ev.id} style={{
                      textAlign: "center",
                      background: C.tealPale,
                      borderTop: `2px solid ${C.tealLight}`,
                      borderLeft: `1px solid ${C.tealLight}`,
                      fontWeight: 800, color: ev.color, fontSize: 16, padding: "8px",
                    }}>
                      {totalPerEvent[i]}
                      <div style={{ fontSize: 9, color: C.gray, fontWeight: 400 }}>
                        {members.length > 0 ? Math.round((totalPerEvent[i] / members.length) * 100) : 0}%
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

        {/* ── Tab: 統計 ── */}
        {activeTab === "stats" && (
          <StatsPanel
            members={members}
            mergedAttendance={mergedAttendance}
            events={events}
            loading={loadingMembers}
          />
        )}

        {/* ── Tab: 会員一覧 ── */}
        {activeTab === "members" && <MembersPanel />}

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
                const isEditing = editingAnnouncement?.id === item.id;
                if (isEditing) {
                  return (
                    <AnnouncementEditForm
                      key={item.id}
                      item={editingAnnouncement}
                      onSave={(updated) => {
                        onEditAnnouncement(updated);
                        setEditingAnnouncement(null);
                      }}
                      onCancel={() => setEditingAnnouncement(null)}
                    />
                  );
                }
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
                      onClick={() => setEditingAnnouncement({ ...item })}
                      style={{
                        background: "none", border: `1px solid ${C.lightGray}`,
                        borderRadius: 6, padding: "3px 8px",
                        color: C.gray, cursor: "pointer", fontSize: 11,
                        fontFamily: "inherit", flexShrink: 0, transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = C.tealPale; e.currentTarget.style.color = C.teal; e.currentTarget.style.borderColor = C.teal; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.gray; e.currentTarget.style.borderColor = C.lightGray; }}
                    >編集</button>
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

        {/* ── Tab: イベント管理 ── */}
        {activeTab === "events" && <EventsManager />}

        {/* ── Tab: フォーム ── */}
        {activeTab === "formbuilder" && <EventFormBuilder />}

      </div>
    </div>
    </>
  );
}

function QrScanModal({ onStamp, onClose }) {
  const events = useEvents();
  const [scanned, setScanned] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id);
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

  const ev = events.find(e => e.id === selectedEventId);

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
                  {events.map(ev => (
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

// ── 会員一覧パネル ────────────────────────────────────────
const EVT_OPTIONS = [
  { key: "children", label: "子供向け活動" },
  { key: "cultural", label: "文化交流" },
  { key: "cooking",  label: "料理・フードイベント" },
  { key: "arts",     label: "アート・クラフト" },
  { key: "sports",   label: "スポーツ・レクリエーション" },
  { key: "music",    label: "音楽・パフォーマンス" },
  { key: "community",label: "地域交流・コミュニティ活動" },
  { key: "others",   label: "その他" },
];

function MembersPanel() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterVolunteer, setFilterVolunteer] = useState(""); // "" | "yes" | "no"
  const [filterEvent, setFilterEvent] = useState("");         // "" | event key

  useEffect(() => {
    fetchAllUsers().then(users => {
      setMembers(users.sort((a, b) => (a.no || "").localeCompare(b.no || "")));
      setLoading(false);
    });
  }, []);

  const filtered = members.filter(m => {
    if (search && !m.name?.includes(search) && !m.email?.includes(search) &&
        !m.no?.includes(search) && !m.country?.name?.includes(search)) return false;
    if (filterVolunteer && m.volunteer !== filterVolunteer) return false;
    if (filterEvent && !(m.eventInterests || []).includes(filterEvent)) return false;
    return true;
  });

  const hasFilter = search || filterVolunteer || filterEvent;
  const clearAll = () => { setSearch(""); setFilterVolunteer(""); setFilterEvent(""); };

  const selectStyle = {
    padding: "6px 10px", borderRadius: 8, border: `1.5px solid ${C.lightGray}`,
    fontSize: 12, fontFamily: "inherit", outline: "none",
    color: C.charcoal, background: C.white, cursor: "pointer",
  };

  const thStyle = {
    padding: "10px 12px", background: C.offWhite,
    borderBottom: `2px solid ${C.lightGray}`,
    fontSize: 11, fontWeight: 700, color: C.charcoal,
    textAlign: "left", whiteSpace: "nowrap",
  };
  const tdStyle = (i) => ({
    padding: "10px 12px",
    borderBottom: `1px solid ${C.lightGray}`,
    fontSize: 12, color: C.charcoal, verticalAlign: "top",
    background: i % 2 === 0 ? C.white : C.offWhite,
  });

  return (
    <div style={{ background: C.white, borderRadius: 16, boxShadow: "0 8px 30px rgba(0,0,0,0.2)", overflow: "hidden" }}>
      {/* ヘッダー */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.lightGray}` }}>
        {/* 上段：タイトル + ダウンロード */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-block", width: 4, height: 16, background: C.teal, borderRadius: 2 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>会員一覧</span>
            <span style={{ background: C.tealPale, color: C.teal, borderRadius: 20, padding: "1px 10px", fontSize: 11, fontWeight: 700 }}>
              {filtered.length} / {members.length}人
            </span>
          </div>
          <button
            onClick={() => downloadExcel(filtered)}
            disabled={filtered.length === 0}
            style={{
              padding: "7px 16px", borderRadius: 8, border: "none",
              background: filtered.length > 0 ? "#1D6F42" : C.lightGray,
              color: C.white, fontSize: 12, fontWeight: 700,
              cursor: filtered.length > 0 ? "pointer" : "default",
              fontFamily: "inherit", whiteSpace: "nowrap",
            }}
          >
            📥 Excelダウンロード
          </button>
        </div>

        {/* 下段：検索・フィルター */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <input
            type="text" placeholder="🔍 名前・メール・国で検索"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...selectStyle, width: 200 }}
          />
          <select value={filterVolunteer} onChange={e => setFilterVolunteer(e.target.value)} style={selectStyle}>
            <option value="">ボランティア：すべて</option>
            <option value="yes">✓ はい</option>
            <option value="no">いいえ</option>
          </select>
          <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)} style={selectStyle}>
            <option value="">参加希望イベント：すべて</option>
            {EVT_OPTIONS.map(o => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
          {hasFilter && (
            <button onClick={clearAll} style={{
              padding: "6px 12px", borderRadius: 8,
              border: `1.5px solid ${C.lightGray}`,
              background: C.white, color: C.gray,
              fontSize: 12, cursor: "pointer", fontFamily: "inherit",
            }}>✕ クリア</button>
          )}
        </div>
      </div>

      {/* テーブル */}
      <div style={{ overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: C.gray, fontSize: 13 }}>読み込み中…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: C.gray, fontSize: 13 }}>
            {search ? "該当する会員が見つかりません" : "登録された会員はまだいません"}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "inherit" }}>
            <thead>
              <tr>
                {["会員番号", "名前", "国", "メール", "電話", "生年月日", "登録日", "言語", "参加希望イベント", "ボランティア", "希望活動内容"].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id || i}>
                  <td style={tdStyle(i)}>
                    <span style={{ fontFamily: "monospace", color: C.teal, fontWeight: 700 }}>{m.no}</span>
                  </td>
                  <td style={tdStyle(i)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {m.photo
                        ? <img src={m.photo} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                        : <span style={{ fontSize: 18 }}>{m.flag}</span>
                      }
                      <span style={{ fontWeight: 700 }}>{m.name}</span>
                    </div>
                  </td>
                  <td style={tdStyle(i)}>{m.country?.name || "—"}</td>
                  <td style={tdStyle(i)}><a href={`mailto:${m.email}`} style={{ color: C.teal, textDecoration: "none" }}>{m.email || "—"}</a></td>
                  <td style={tdStyle(i)} >{m.phone || "—"}</td>
                  <td style={tdStyle(i)}>{m.dob || "—"}</td>
                  <td style={tdStyle(i)}>{m.since || "—"}</td>
                  <td style={tdStyle(i)}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, maxWidth: 160 }}>
                      {(m.languages || []).map(l => (
                        <span key={l} style={{ background: C.tealPale, color: C.teal, borderRadius: 10, padding: "1px 7px", fontSize: 10, whiteSpace: "nowrap" }}>{l}</span>
                      ))}
                    </div>
                  </td>
                  <td style={tdStyle(i)}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, maxWidth: 180 }}>
                      {(m.eventInterests || []).map(k => (
                        <span key={k} style={{ background: "#FEF3C7", color: "#92400E", borderRadius: 10, padding: "1px 7px", fontSize: 10, whiteSpace: "nowrap" }}>{EVT_LABELS[k] || k}</span>
                      ))}
                      {m.eventInterestsOther && (
                        <span style={{ background: "#FEF3C7", color: "#92400E", borderRadius: 10, padding: "1px 7px", fontSize: 10 }}>{m.eventInterestsOther}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ ...tdStyle(i), textAlign: "center" }}>
                    {m.volunteer === "yes"
                      ? <span style={{ color: "#1A6B45", fontWeight: 700 }}>✓ はい</span>
                      : m.volunteer === "no"
                      ? <span style={{ color: C.gray }}>いいえ</span>
                      : "—"}
                  </td>
                  <td style={tdStyle(i)}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, maxWidth: 180 }}>
                      {(m.activities || []).map(k => (
                        <span key={k} style={{ background: "#F0FDF4", color: "#166534", borderRadius: 10, padding: "1px 7px", fontSize: 10, whiteSpace: "nowrap" }}>{ACT_LABELS[k] || k}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── お知らせ編集フォーム ───────────────────────────────────
function AnnouncementEditForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState({ category: item.category, title: item.title, body: item.body });
  const [error, setError] = useState("");
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const cat = NOTICE_CATS.find(c => c.id === form.category);

  const submit = e => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) { setError("タイトルと本文を入力してください"); return; }
    onSave({ ...item, ...form });
  };

  return (
    <form onSubmit={submit} style={{
      border: `2px solid ${C.teal}`, borderRadius: 10, marginBottom: 8,
      background: C.tealPale, overflow: "hidden",
    }}>
      <div style={{ padding: "8px 12px 4px", fontSize: 11, fontWeight: 700, color: C.teal }}>
        ✏️ 編集中
      </div>
      <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8 }}>
          <select value={form.category} onChange={set("category")} style={{
            ...inputStyle,
            appearance: "none", cursor: "pointer",
            background: `${cat.color}12`, color: cat.color,
            fontWeight: 700, border: `1.5px solid ${cat.color}50`,
          }}>
            {NOTICE_CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <input type="text" value={form.title} onChange={set("title")} placeholder="タイトル" style={inputStyle} />
        </div>
        <textarea value={form.body} onChange={set("body")} rows={2} placeholder="本文" style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
        {error && <div style={{ color: C.red, fontSize: 11 }}>{error}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" style={{
            padding: "7px 18px", borderRadius: 8, border: "none",
            background: C.teal, color: C.white, fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>💾 保存</button>
          <button type="button" onClick={onCancel} style={{
            padding: "7px 14px", borderRadius: 8,
            border: `1px solid ${C.lightGray}`, background: C.white,
            color: C.gray, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          }}>キャンセル</button>
        </div>
      </div>
    </form>
  );
}

// ── 統計パネル ────────────────────────────────────────────
const LEVEL_COLORS_MAP = {
  Newcomer: C.gray, Explorer: C.tealMid, Regular: C.green, Active: C.gold, Ambassador: C.navy,
};
const PIE_PALETTE = ["#1B4F72","#2471A3","#1A6B45","#C9A227","#8E44AD","#D35400","#C0392B","#2C3E50","#7F8C8D","#6C3483"];
const EVT_SHORT = { children:"子供向け", cultural:"文化交流", cooking:"料理", arts:"アート", sports:"スポーツ", music:"音楽", community:"コミュニティ", others:"その他" };
const ACT_SHORT = { event:"イベント運営", interpret:"通訳", children:"子供向け", education:"教育", cultural:"文化交流", sports:"スポーツ", cooking:"料理", music:"音楽", arts:"アート", community:"コミュニティ", others:"その他" };

function StatsPanel({ members, mergedAttendance, events, loading }) {
  if (loading) return (
    <div style={{ background: C.white, borderRadius: 16, padding: "48px", textAlign: "center", color: C.gray, fontSize: 13, boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}>
      読み込み中…
    </div>
  );

  const total = members.length;

  // ── データ集計 ──────────────────────────────────────
  const volunteerCount = members.filter(m => m.volunteer === "yes").length;
  const totalStamps = members.reduce((s, m) => s + (mergedAttendance[m.id]?.size || 0), 0);
  const avgStamps = total > 0 ? (totalStamps / total).toFixed(1) : "0";

  const countryCounts = {};
  members.forEach(m => {
    const cn = m.country?.name || "不明";
    countryCounts[cn] = (countryCounts[cn] || 0) + 1;
  });
  const countryData = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  const eventData = events.map(ev => ({
    name: ev.nameShort,
    参加者数: members.filter(m => mergedAttendance[m.id]?.has(ev.id)).length,
    color: ev.color,
  }));

  const levelMap = { Newcomer: 0, Explorer: 0, Regular: 0, Active: 0, Ambassador: 0 };
  members.forEach(m => { levelMap[getLevel(mergedAttendance[m.id]?.size || 0).label]++; });
  const levelData = Object.entries(levelMap)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const evtCounts = {};
  members.forEach(m => (m.eventInterests || []).forEach(k => { evtCounts[k] = (evtCounts[k] || 0) + 1; }));
  const evtData = Object.entries(evtCounts).sort((a,b)=>b[1]-a[1])
    .map(([k, value]) => ({ name: EVT_SHORT[k] || k, value }));

  const actCounts = {};
  members.forEach(m => (m.activities || []).forEach(k => { actCounts[k] = (actCounts[k] || 0) + 1; }));
  const actData = Object.entries(actCounts).sort((a,b)=>b[1]-a[1])
    .map(([k, value]) => ({ name: ACT_SHORT[k] || k, value }));

  // ── 共通スタイル ──────────────────────────────────
  const card = {
    background: C.white, borderRadius: 14,
    boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
    overflow: "hidden", marginBottom: 16,
  };
  const cardHeader = (color) => ({
    padding: "12px 18px 10px", borderBottom: `1px solid ${C.lightGray}`,
    display: "flex", alignItems: "center", gap: 8,
    fontSize: 13, fontWeight: 700, color: C.charcoal,
  });
  const accent = (color) => ({
    display: "inline-block", width: 4, height: 16,
    background: color, borderRadius: 2,
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: C.white, border: `1px solid ${C.lightGray}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
        <div style={{ fontWeight: 700, color: C.charcoal, marginBottom: 2 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.fill || C.teal }}>{p.value} 人</div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* サマリーカード */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "登録者数",        value: total,                           unit: "人",   color: C.teal    },
          { label: "ボランティア希望", value: total > 0 ? `${volunteerCount} (${Math.round(volunteerCount/total*100)}%)` : 0, unit: "", color: C.green   },
          { label: "平均スタンプ数",  value: avgStamps,                       unit: "個",   color: C.tealMid },
          { label: "参加国数",        value: Object.keys(countryCounts).length, unit: "カ国", color: C.gold    },
        ].map(s => (
          <div key={s.label} style={{ background: C.white, borderRadius: 12, padding: "14px 16px", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", borderTop: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>{s.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1.2 }}>{s.value}</span>
              <span style={{ fontSize: 12, color: C.gray }}>{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* イベント参加者数 */}
      <div style={card}>
        <div style={cardHeader(C.teal)}>
          <span style={accent(C.teal)} />
          イベント別参加者数
        </div>
        <div style={{ padding: "16px 18px" }}>
          {total === 0 ? (
            <div style={{ textAlign: "center", color: C.gray, fontSize: 12, padding: "20px 0" }}>データなし</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={eventData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.gray }} />
                <YAxis tick={{ fontSize: 10, fill: C.gray }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="参加者数" radius={[4,4,0,0]}>
                  {eventData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 国籍分布 + レベル分布 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ ...card, marginBottom: 0 }}>
          <div style={cardHeader(C.gold)}>
            <span style={accent(C.gold)} />
            国籍分布（上位10カ国）
          </div>
          <div style={{ padding: "16px 18px" }}>
            {countryData.length === 0 ? (
              <div style={{ textAlign: "center", color: C.gray, fontSize: 12, padding: "20px 0" }}>データなし</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={countryData} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: C.gray }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: C.gray }} width={72} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="人数" radius={[0,4,4,0]}>
                    {countryData.map((_, i) => <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div style={{ ...card, marginBottom: 0 }}>
          <div style={cardHeader(C.tealMid)}>
            <span style={accent(C.tealMid)} />
            レベル分布
          </div>
          <div style={{ padding: "16px 18px" }}>
            {levelData.length === 0 ? (
              <div style={{ textAlign: "center", color: C.gray, fontSize: 12, padding: "20px 0" }}>データなし</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={levelData} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" outerRadius={70}
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false} fontSize={10}
                    >
                      {levelData.map((e, i) => <Cell key={i} fill={LEVEL_COLORS_MAP[e.name] || C.gray} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} 人`]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                  {levelData.map(l => (
                    <div key={l.name} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: LEVEL_COLORS_MAP[l.name] || C.gray }} />
                      <span style={{ color: C.charcoal }}>{l.name}</span>
                      <span style={{ color: C.gray }}>({l.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 参加希望イベントの傾向 */}
      {evtData.length > 0 && (
        <div style={card}>
          <div style={cardHeader("#92400E")}>
            <span style={accent("#F59E0B")} />
            参加希望イベントの傾向
          </div>
          <div style={{ padding: "16px 18px" }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={evtData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.gray }} />
                <YAxis tick={{ fontSize: 10, fill: C.gray }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="人数" fill="#F59E0B" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ボランティア活動希望の傾向 */}
      {actData.length > 0 && (
        <div style={card}>
          <div style={cardHeader(C.green)}>
            <span style={accent(C.green)} />
            ボランティア活動希望の傾向
          </div>
          <div style={{ padding: "16px 18px" }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={actData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.gray }} />
                <YAxis tick={{ fontSize: 10, fill: C.gray }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="人数" fill={C.green} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function RsvpSummaryPanel() {
  const events = useEvents();
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
        {events.map(ev => {
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
  const events = useEvents();
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
        {events.map(ev => {
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
