import { useState } from "react";
import { C } from "../../constants";
import { loadEvents, saveEvents } from "../../lib/eventStorage";
import { useEvents } from "../../hooks/useEvents";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const PRESET_COLORS = ["#1B4F72","#2471A3","#8E44AD","#1A6B45","#9B3A1B","#C0392B","#D4AC0D","#2E4057"];
const PRESET_EMOJIS = ["🌏","🍽️","📖","💬","💡","🚨","🎉","🎵","🏃","🌸","🎨","🤝"];

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfWeek(y, m) { return new Date(y, m, 1).getDay(); }

function emptyForm() {
  return { emoji: "🎉", nameShort: "", fullDate: "", time: "", place: "", color: "#1B4F72", images: [] };
}

export default function EventsManager() {
  const events = useEvents();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [editingId, setEditingId] = useState(null); // null = closed, "new" = adding, id = editing
  const [form, setForm] = useState(emptyForm());
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const openAdd = () => { setForm(emptyForm()); setEditingId("new"); };
  const openEdit = (ev) => {
    setForm({
      emoji: ev.emoji,
      nameShort: ev.nameShort,
      fullDate: ev.fullDate,
      time: ev.time || "",
      place: ev.place || "",
      color: ev.color,
      images: ev.images || [],
    });
    setEditingId(ev.id);
  };
  const closeForm = () => { setEditingId(null); setForm(emptyForm()); };

  const handleSave = () => {
    if (!form.nameShort.trim() || !form.fullDate) return;
    let updated;
    if (editingId === "new") {
      const newEv = {
        id: Date.now(),
        emoji: form.emoji,
        name: form.nameShort,
        nameShort: form.nameShort,
        fullDate: form.fullDate,
        date: new Date(form.fullDate).toLocaleDateString("ja-JP", { month: "long" }).replace("月", "月"),
        time: form.time,
        place: form.place,
        color: form.color,
        images: form.images || [],
        applyUrl: "",
      };
      updated = [...events, newEv].sort((a, b) => a.fullDate.localeCompare(b.fullDate));
    } else {
      updated = events.map(ev => ev.id === editingId ? {
        ...ev,
        emoji: form.emoji,
        name: form.nameShort,
        nameShort: form.nameShort,
        fullDate: form.fullDate,
        date: new Date(form.fullDate).toLocaleDateString("ja-JP", { month: "long" }).replace("月", "月"),
        time: form.time,
        place: form.place,
        color: form.color,
        images: form.images || [],
      } : ev);
    }
    saveEvents(updated);
    closeForm();
  };

  const handleDelete = (id) => {
    saveEvents(events.filter(ev => ev.id !== id));
    setDeleteConfirm(null);
  };

  // Calendar helpers
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const eventsThisMonth = events.filter(ev => {
    const d = new Date(ev.fullDate);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });

  const inputStyle = {
    width: "100%", padding: "8px 12px", boxSizing: "border-box",
    border: `1.5px solid ${C.lightGray}`, borderRadius: 8,
    fontSize: 13, color: C.charcoal, fontFamily: "inherit",
    outline: "none", background: C.white,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Calendar view ── */}
      <div style={{
        background: C.white, borderRadius: 16,
        boxShadow: "0 8px 30px rgba(0,0,0,0.2)", overflow: "hidden",
      }}>
        {/* Month nav */}
        <div style={{
          padding: "14px 20px",
          borderBottom: `1px solid ${C.lightGray}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-block", width: 4, height: 16, background: C.teal, borderRadius: 2 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>カレンダー</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => { if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11); } else setViewMonth(m => m-1); }}
              style={{ background:"none", border:`1px solid ${C.lightGray}`, borderRadius:6, padding:"4px 10px", cursor:"pointer", color:C.gray }}>‹</button>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.charcoal, minWidth: 80, textAlign:"center" }}>
              {viewYear}年{viewMonth + 1}月
            </span>
            <button onClick={() => { if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0); } else setViewMonth(m => m+1); }}
              style={{ background:"none", border:`1px solid ${C.lightGray}`, borderRadius:6, padding:"4px 10px", cursor:"pointer", color:C.gray }}>›</button>
          </div>
        </div>

        <div style={{ padding: "12px 16px" }}>
          {/* Weekday headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
            {WEEKDAYS.map((d, i) => (
              <div key={d} style={{
                textAlign: "center", fontSize: 11, fontWeight: 700, padding: "4px 0",
                color: i === 0 ? "#C0392B" : i === 6 ? "#2471A3" : C.gray,
              }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1;
              const dayEvents = eventsThisMonth.filter(ev => new Date(ev.fullDate).getDate() === day);
              const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
              return (
                <div key={day} style={{
                  minHeight: 52, borderRadius: 8, padding: "4px 3px",
                  background: isToday ? C.tealPale : dayEvents.length > 0 ? C.offWhite : "transparent",
                  border: isToday ? `1.5px solid ${C.teal}` : `1px solid transparent`,
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: isToday ? 800 : 400,
                    color: isToday ? C.teal : C.charcoal,
                    textAlign: "center", marginBottom: 2,
                  }}>{day}</div>
                  {dayEvents.map(ev => (
                    <div
                      key={ev.id}
                      onClick={() => openEdit(ev)}
                      style={{
                        background: ev.color, color: C.white,
                        borderRadius: 4, padding: "1px 4px",
                        fontSize: 9, fontWeight: 700,
                        marginBottom: 2, cursor: "pointer",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        lineHeight: 1.5,
                      }}
                      title={ev.nameShort}
                    >
                      {ev.emoji} {ev.nameShort}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Event list ── */}
      <div style={{
        background: C.white, borderRadius: 16,
        boxShadow: "0 8px 30px rgba(0,0,0,0.2)", overflow: "hidden",
      }}>
        <div style={{
          padding: "14px 20px",
          borderBottom: `1px solid ${C.lightGray}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-block", width: 4, height: 16, background: C.navy, borderRadius: 2 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>
              イベント一覧
              <span style={{ fontSize: 11, fontWeight: 400, color: C.gray, marginLeft: 8 }}>{events.length}件</span>
            </span>
          </div>
          <button
            onClick={openAdd}
            style={{
              padding: "6px 16px", borderRadius: 20, border: "none",
              background: C.teal, color: C.white,
              fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}
          >＋ 追加</button>
        </div>

        {/* Add/Edit form */}
        {editingId !== null && (
          <div style={{
            margin: "16px 20px",
            background: C.offWhite,
            borderRadius: 12,
            border: `1.5px solid ${C.tealLight}`,
            padding: "16px",
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.teal, marginBottom: 12 }}>
              {editingId === "new" ? "＋ 新しいイベント" : "✏️ イベントを編集"}
            </div>

            {/* Emoji + Name row */}
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 80 }}>
                <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>絵文字</div>
                <input type="text" value={form.emoji} onChange={set("emoji")}
                  style={{ ...inputStyle, textAlign: "center", fontSize: 20 }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>イベント名 <span style={{ color: "#C0392B" }}>*</span></div>
                <input type="text" value={form.nameShort} onChange={set("nameShort")}
                  placeholder="例：Welcome Meetup"
                  style={inputStyle} />
              </div>
            </div>

            {/* Emoji presets */}
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {PRESET_EMOJIS.map(e => (
                <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${form.emoji === e ? C.teal : C.lightGray}`,
                    background: form.emoji === e ? C.tealPale : C.white,
                    fontSize: 16, cursor: "pointer", lineHeight: 1,
                  }}>{e}</button>
              ))}
            </div>

            {/* Date + Time row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>開催日 <span style={{ color: "#C0392B" }}>*</span></div>
                <input type="date" value={form.fullDate} onChange={set("fullDate")} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>時間</div>
                <input type="text" value={form.time} onChange={set("time")}
                  placeholder="例：14:00〜16:00" style={inputStyle} />
              </div>
            </div>

            {/* Place */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>場所</div>
              <input type="text" value={form.place} onChange={set("place")}
                placeholder="例：芦屋市民センター" style={inputStyle} />
            </div>

            {/* Images */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.gray, marginBottom: 6 }}>チラシ・画像（複数可）</div>
              <label style={{
                display: "inline-block", padding: "7px 16px", borderRadius: 8,
                border: `1.5px dashed ${C.lightGray}`, cursor: "pointer",
                fontSize: 12, color: C.gray, background: C.white, marginBottom: 8,
              }}>
                📎 画像を追加
                <input
                  type="file" accept="image/*" multiple
                  style={{ display: "none" }}
                  onChange={e => {
                    const files = Array.from(e.target.files);
                    files.forEach(file => {
                      const reader = new FileReader();
                      reader.onload = ev => {
                        setForm(f => ({ ...f, images: [...(f.images || []), ev.target.result] }));
                      };
                      reader.readAsDataURL(file);
                    });
                    e.target.value = "";
                  }}
                />
              </label>
              {(form.images || []).length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(form.images || []).map((img, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img src={img} alt="" style={{
                        width: 80, height: 80, objectFit: "cover",
                        borderRadius: 8, border: `1px solid ${C.lightGray}`,
                      }} />
                      <button
                        onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                        style={{
                          position: "absolute", top: -6, right: -6,
                          width: 20, height: 20, borderRadius: "50%",
                          background: C.red, color: C.white, border: "none",
                          fontSize: 12, cursor: "pointer", lineHeight: 1,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Color */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.gray, marginBottom: 6 }}>カラー</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: c, border: form.color === c ? `3px solid ${C.charcoal}` : "3px solid transparent",
                      cursor: "pointer",
                    }} />
                ))}
                <input type="color" value={form.color} onChange={set("color")}
                  style={{ width: 32, height: 28, borderRadius: 6, border: `1px solid ${C.lightGray}`, cursor: "pointer", padding: 0 }} />
              </div>
            </div>

            {/* Preview */}
            <div style={{
              background: form.color + "15", border: `1px solid ${form.color}40`,
              borderRadius: 8, padding: "8px 12px", marginBottom: 14,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 22 }}>{form.emoji}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: form.color }}>{form.nameShort || "（イベント名）"}</div>
                <div style={{ fontSize: 11, color: C.gray }}>{form.fullDate || "日付未設定"}　{form.time}</div>
                {form.place && <div style={{ fontSize: 11, color: C.gray }}>📍 {form.place}</div>}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleSave}
                disabled={!form.nameShort.trim() || !form.fullDate}
                style={{
                  padding: "8px 24px", borderRadius: 8, border: "none",
                  background: (!form.nameShort.trim() || !form.fullDate) ? C.lightGray : C.teal,
                  color: C.white, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}
              >保存</button>
              <button
                onClick={closeForm}
                style={{
                  padding: "8px 16px", borderRadius: 8,
                  border: `1px solid ${C.lightGray}`,
                  background: C.white, color: C.gray, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                }}
              >キャンセル</button>
            </div>
          </div>
        )}

        {/* Event list */}
        <div style={{ padding: "0 20px 20px" }}>
          {events.length === 0 ? (
            <div style={{ color: C.gray, fontSize: 13, textAlign: "center", padding: "30px 0" }}>
              イベントがありません
            </div>
          ) : (
            [...events].sort((a, b) => a.fullDate.localeCompare(b.fullDate)).map(ev => (
              <div key={ev.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 10,
                border: `1px solid ${C.lightGray}`,
                marginBottom: 8, background: C.offWhite,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: ev.color + "20", border: `2px solid ${ev.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, flexShrink: 0,
                }}>{ev.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.charcoal }}>{ev.nameShort}</div>
                  <div style={{ fontSize: 11, color: C.gray }}>
                    {ev.fullDate}　{ev.time}
                    {ev.place && `　📍 ${ev.place}`}
                  </div>
                </div>

                {/* Delete confirm */}
                {deleteConfirm === ev.id ? (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: C.red }}>削除しますか？</span>
                    <button onClick={() => handleDelete(ev.id)} style={{
                      padding: "3px 10px", borderRadius: 6, border: "none",
                      background: C.red, color: C.white, fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                    }}>はい</button>
                    <button onClick={() => setDeleteConfirm(null)} style={{
                      padding: "3px 10px", borderRadius: 6, border: `1px solid ${C.lightGray}`,
                      background: C.white, color: C.gray, fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                    }}>いいえ</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => openEdit(ev)} style={{
                      padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.lightGray}`,
                      background: C.white, color: C.gray, fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                    }}>編集</button>
                    <button onClick={() => setDeleteConfirm(ev.id)} style={{
                      padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.lightGray}`,
                      background: C.white, color: C.red, fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                    }}>削除</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
