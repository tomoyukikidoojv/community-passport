import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../constants";
import { useEvents } from "../hooks/useEvents";
import { useLang } from "../i18n/LangContext";

const RSVP_KEY = "cp_rsvp"; // { "userId_eventId": "going" | "not_going" }

function loadAllRsvp() {
  try { return JSON.parse(localStorage.getItem(RSVP_KEY)) || {}; }
  catch { return {}; }
}
function saveAllRsvp(data) {
  localStorage.setItem(RSVP_KEY, JSON.stringify(data));
}

export function getRsvpCounts(eventId) {
  const all = loadAllRsvp();
  let going = 0, notGoing = 0;
  Object.entries(all).forEach(([key, status]) => {
    if (key.endsWith(`_${eventId}`)) {
      if (status === "going") going++;
      else if (status === "not_going") notGoing++;
    }
  });
  return { going, notGoing };
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(dateStr, year, month, day) {
  const d = new Date(dateStr);
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
}

function formatFullDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAYS[d.getDay()]}）`;
}

export default function CalendarPage({ stamps, user }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [allRsvp, setAllRsvp] = useState(loadAllRsvp);
  const events = useEvents();
  const [lightboxImg, setLightboxImg] = useState(null);

  const uid = user?.id ?? "guest";
  // Current user's RSVP: { [eventId]: status }
  const rsvp = Object.fromEntries(
    Object.entries(allRsvp)
      .filter(([k]) => k.startsWith(`${uid}_`))
      .map(([k, v]) => [k.slice(`${uid}_`.length), v])
  );

  const handleRsvp = (eventId, status) => {
    const key = `${uid}_${eventId}`;
    const updated = { ...allRsvp };
    if (updated[key] === status) {
      delete updated[key]; // toggle off
    } else {
      updated[key] = status;
    }
    setAllRsvp(updated);
    saveAllRsvp(updated);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  // Events in this month
  const monthEvents = events.filter(ev => {
    const d = new Date(ev.fullDate);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });

  // Upcoming events (from today, sorted)
  const upcoming = [...events]
    .filter(ev => new Date(ev.fullDate) >= new Date(today.toDateString()))
    .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));

  // All events sorted for the list
  const allSorted = [...events].sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d) =>
    d && d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const eventsOnDay = (d) =>
    events.filter(ev => isSameDay(ev.fullDate, viewYear, viewMonth, d));

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${C.teal} 0%, ${C.navy} 100%)`,
      padding: "28px 16px 48px",
      fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
    }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>

        {/* Title */}
        <div style={{ textAlign: "center", color: C.white, marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 5, opacity: 0.6, marginBottom: 4 }}>
            EVENT SCHEDULE
          </div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{`📅 ${t("calendar.title")}`}</div>
          <div style={{ fontSize: 12, opacity: 0.5, marginTop: 3 }}>{t("calendar.subtitle")}</div>
        </div>

        {/* ── Monthly calendar ─────────────────────── */}
        <div style={{
          background: C.white, borderRadius: 16,
          boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
          overflow: "hidden", marginBottom: 20,
        }}>
          {/* Month nav */}
          <div style={{
            background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
            padding: "14px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <button
              onClick={prevMonth}
              style={{
                background: "rgba(255,255,255,0.15)", border: "none",
                borderRadius: 8, width: 34, height: 34,
                color: C.white, fontSize: 16, cursor: "pointer",
              }}
            >‹</button>
            <div style={{ color: C.white, fontWeight: 800, fontSize: 18 }}>
              {viewYear}年{viewMonth + 1}月
              {monthEvents.length > 0 && (
                <span style={{
                  marginLeft: 10, background: C.gold,
                  borderRadius: 20, padding: "2px 10px",
                  fontSize: 11, fontWeight: 700,
                }}>{monthEvents.length}</span>
              )}
            </div>
            <button
              onClick={nextMonth}
              style={{
                background: "rgba(255,255,255,0.15)", border: "none",
                borderRadius: 8, width: 34, height: 34,
                color: C.white, fontSize: 16, cursor: "pointer",
              }}
            >›</button>
          </div>

          {/* Weekday headers */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
            background: C.offWhite, borderBottom: `1px solid ${C.lightGray}`,
          }}>
            {WEEKDAYS.map((w, i) => (
              <div key={w} style={{
                textAlign: "center", padding: "8px 0",
                fontSize: 11, fontWeight: 700,
                color: i === 0 ? "#E74C3C" : i === 6 ? "#2471A3" : C.gray,
              }}>{w}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
          }}>
            {cells.map((day, idx) => {
              const dayEvents = day ? eventsOnDay(day) : [];
              const isWeekend = idx % 7 === 0 || idx % 7 === 6;
              return (
                <div
                  key={idx}
                  style={{
                    minHeight: 60, padding: "6px 4px 4px",
                    borderRight: `1px solid ${C.lightGray}`,
                    borderBottom: `1px solid ${C.lightGray}`,
                    background: isToday(day) ? `${C.teal}08` : C.white,
                    cursor: dayEvents.length > 0 ? "pointer" : "default",
                  }}
                  onClick={() => dayEvents.length > 0 && setSelectedEvent(dayEvents[0])}
                >
                  {day && (
                    <>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%",
                        background: isToday(day) ? C.teal : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 3px",
                        fontSize: 12, fontWeight: isToday(day) ? 700 : 400,
                        color: isToday(day) ? C.white
                          : idx % 7 === 0 ? "#E74C3C"
                          : idx % 7 === 6 ? "#2471A3"
                          : C.charcoal,
                      }}>{day}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
                        {dayEvents.map(ev => (
                          <div key={ev.id} style={{
                            width: "90%", borderRadius: 4,
                            background: ev.color,
                            fontSize: 9, color: C.white,
                            fontWeight: 700, padding: "1px 3px",
                            textAlign: "center", whiteSpace: "nowrap",
                            overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            {ev.emoji} {ev.nameShort}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Event detail popup ───────────────────── */}
        {selectedEvent && (
          <div
            onClick={() => setSelectedEvent(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "16px",
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: C.white, borderRadius: 16, maxWidth: 400, width: "100%",
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              }}
            >
              <div style={{
                background: selectedEvent.color, padding: "20px 24px",
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <div style={{ fontSize: 40 }}>{selectedEvent.emoji}</div>
                <div>
                  <div style={{ color: C.white, fontWeight: 800, fontSize: 17, whiteSpace: "pre-line" }}>
                    {selectedEvent.name}
                  </div>
                  {stamps?.has(selectedEvent.id) && (
                    <div style={{
                      display: "inline-block", marginTop: 6,
                      background: "rgba(255,255,255,0.25)", borderRadius: 20,
                      padding: "2px 10px", fontSize: 11, color: C.white, fontWeight: 700,
                    }}>{t("calendar.attended")}</div>
                  )}
                </div>
              </div>
              <div style={{ padding: "20px 24px" }}>
                {[
                  [t("calendar.date"), `${formatFullDate(selectedEvent.fullDate)}　${selectedEvent.time}`],
                  [t("calendar.place"), selectedEvent.place],
                ].map(([label, value]) => (
                  <div key={label} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: C.gray, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal }}>{value}</div>
                  </div>
                ))}

                {/* RSVP buttons (only for future events) */}
                {new Date(selectedEvent.fullDate) >= new Date(today.toDateString()) && !stamps?.has(selectedEvent.id) && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: C.gray, marginBottom: 8 }}>{t("calendar.rsvp_label")}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleRsvp(selectedEvent.id, "going")}
                        style={{
                          flex: 1, padding: "10px",
                          background: rsvp[selectedEvent.id] === "going" ? selectedEvent.color : C.offWhite,
                          color: rsvp[selectedEvent.id] === "going" ? C.white : C.charcoal,
                          border: `2px solid ${rsvp[selectedEvent.id] === "going" ? selectedEvent.color : C.lightGray}`,
                          borderRadius: 8, fontSize: 13, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                        }}
                      >
                        {rsvp[selectedEvent.id] === "going" ? t("calendar.going_done") : t("calendar.going")}
                      </button>
                      <button
                        onClick={() => handleRsvp(selectedEvent.id, "not_going")}
                        style={{
                          flex: 1, padding: "10px",
                          background: rsvp[selectedEvent.id] === "not_going" ? C.lightGray : C.offWhite,
                          color: rsvp[selectedEvent.id] === "not_going" ? C.gray : C.charcoal,
                          border: `2px solid ${rsvp[selectedEvent.id] === "not_going" ? C.gray : C.lightGray}`,
                          borderRadius: 8, fontSize: 13, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                        }}
                      >
                        {rsvp[selectedEvent.id] === "not_going" ? t("calendar.not_going_done") : t("calendar.not_going")}
                      </button>
                    </div>
                  </div>
                )}

                {/* Apply button */}
                {new Date(selectedEvent.fullDate) >= new Date(today.toDateString()) && !stamps?.has(selectedEvent.id) && (
                  <button
                    onClick={() => { setSelectedEvent(null); navigate(`/apply/${selectedEvent.id}`); }}
                    style={{
                      width: "100%", padding: "11px", marginBottom: 8,
                      background: `linear-gradient(90deg, ${selectedEvent.color}, ${selectedEvent.color}cc)`,
                      color: C.white, border: "none", borderRadius: 8,
                      fontSize: 13, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                      boxShadow: `0 3px 10px ${selectedEvent.color}40`,
                    }}
                  >
                    {t("calendar.apply_btn")}
                  </button>
                )}

                {/* Image gallery */}
                {selectedEvent.images && selectedEvent.images.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: C.gray, marginBottom: 8 }}>{t("calendar.images")}</div>
                    <div style={{
                      display: "flex", gap: 8, overflowX: "auto",
                      WebkitOverflowScrolling: "touch", scrollbarWidth: "none",
                      paddingBottom: 4,
                    }}>
                      {selectedEvent.images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt=""
                          onClick={() => setLightboxImg(img)}
                          style={{
                            height: 100, borderRadius: 8,
                            objectFit: "cover", cursor: "pointer",
                            border: `1px solid ${C.lightGray}`,
                            flexShrink: 0,
                            transition: "transform 0.15s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
                          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setSelectedEvent(null)}
                  style={{
                    width: "100%", padding: "10px",
                    background: C.offWhite, border: `1px solid ${C.lightGray}`,
                    borderRadius: 8, fontSize: 13, color: C.gray,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >{t("calendar.close")}</button>
              </div>
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightboxImg && (
          <div
            onClick={() => setLightboxImg(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 300,
              background: "rgba(0,0,0,0.92)", backdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 16,
            }}
          >
            <img
              src={lightboxImg}
              alt=""
              style={{
                maxWidth: "100%", maxHeight: "90vh",
                borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              }}
            />
            <div style={{
              position: "absolute", top: 16, right: 16,
              color: "rgba(255,255,255,0.6)", fontSize: 12,
            }}>{t("calendar.close")}</div>
          </div>
        )}

        {/* ── Upcoming events list ─────────────────── */}
        <div style={{
          background: C.white, borderRadius: 16,
          boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
          overflow: "hidden",
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
              {t("calendar.all")}
            </span>
          </div>

          <div style={{ padding: "12px 16px" }}>
            {allSorted.map(ev => {
              const isPast = new Date(ev.fullDate) < new Date(today.toDateString());
              const stamped = stamps?.has(ev.id);
              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "12px 10px", borderRadius: 10, cursor: "pointer",
                    marginBottom: 6, transition: "background 0.15s",
                    background: isPast ? C.offWhite : C.white,
                    border: `1px solid ${isPast ? C.lightGray : ev.color + "30"}`,
                    opacity: isPast ? 0.6 : 1,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = `${ev.color}08`}
                  onMouseLeave={e => e.currentTarget.style.background = isPast ? C.offWhite : C.white}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                    background: `${ev.color}15`,
                    border: `2px solid ${ev.color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22,
                  }}>{ev.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, whiteSpace: "pre-line" }}>
                      {ev.nameShort}
                    </div>
                    <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>
                      {formatFullDate(ev.fullDate)}　{ev.time}
                    </div>
                    <div style={{ fontSize: 11, color: C.gray }}>📍 {ev.place}</div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: "right", display: "flex", flexDirection: "column", gap: 4 }}>
                    {stamped ? (
                      <div style={{
                        background: ev.color, color: C.white,
                        borderRadius: 20, padding: "3px 10px",
                        fontSize: 10, fontWeight: 700,
                      }}>✓ 参加済み</div>
                    ) : isPast ? (
                      <div style={{
                        background: C.lightGray, color: C.gray,
                        borderRadius: 20, padding: "3px 10px",
                        fontSize: 10,
                      }}>{t("calendar.ended")}</div>
                    ) : rsvp[ev.id] === "going" ? (
                      <div style={{
                        background: ev.color, color: C.white,
                        borderRadius: 20, padding: "3px 10px",
                        fontSize: 10, fontWeight: 700,
                      }}>{t("calendar.going_short")}</div>
                    ) : rsvp[ev.id] === "not_going" ? (
                      <div style={{
                        background: C.lightGray, color: C.gray,
                        borderRadius: 20, padding: "3px 10px",
                        fontSize: 10,
                      }}>{t("calendar.not_going_short")}</div>
                    ) : (
                      <div style={{
                        background: `${ev.color}18`, color: ev.color,
                        border: `1px solid ${ev.color}40`,
                        borderRadius: 20, padding: "3px 10px",
                        fontSize: 10, fontWeight: 700,
                      }}>{t("calendar.unanswered")}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
