import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { C, EVENTS, USERS, getLevel } from "../constants";

function Stamp({ event, stamped, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        borderRadius: 14,
        border: `2px solid ${stamped ? event.color : C.lightGray}`,
        background: stamped ? `${event.color}12` : C.white,
        padding: "18px 10px 12px",
        cursor: "pointer",
        transition: "all 0.2s",
        transform: hover && !stamped ? "translateY(-2px)" : "none",
        boxShadow: stamped
          ? `0 4px 14px ${event.color}30`
          : hover ? "0 4px 12px rgba(0,0,0,0.1)" : "0 1px 4px rgba(0,0,0,0.06)",
        textAlign: "center",
        userSelect: "none",
        minHeight: 130,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      {/* Month badge */}
      <div style={{
        position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
        background: stamped ? event.color : C.lightGray,
        color: stamped ? C.white : C.gray,
        fontSize: 11, fontWeight: 700, padding: "2px 10px",
        borderRadius: 20, whiteSpace: "nowrap", transition: "all 0.2s",
      }}>{event.date}</div>

      {/* Circle */}
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: stamped ? event.color : C.lightGray,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24,
        boxShadow: stamped ? `0 0 0 3px ${C.white}, 0 0 0 6px ${event.color}50` : "none",
        transform: stamped ? "scale(1)" : "scale(0.85)",
        opacity: stamped ? 1 : 0.4,
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      }}>{stamped ? event.emoji : "○"}</div>

      {/* Name */}
      <div style={{
        fontSize: 11, color: stamped ? event.color : C.gray,
        fontWeight: stamped ? 700 : 400, lineHeight: 1.35, whiteSpace: "pre-line",
      }}>{event.name}</div>

      {/* Check */}
      {stamped && (
        <div style={{
          position: "absolute", top: 6, right: 6, width: 18, height: 18,
          borderRadius: "50%", background: event.color, color: C.white,
          fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900,
        }}>✓</div>
      )}
    </div>
  );
}

export default function CommunityPassport({ stamps, onManualStamp, user }) {
  const [flash, setFlash] = useState(null);
  const ME = user || USERS[0];

  const toggle = (id) => {
    onManualStamp(ME.id, id);
    setFlash(id);
    setTimeout(() => setFlash(null), 2500);
  };

  const count = stamps.size;
  const level = getLevel(count);
  const pct = Math.round((count / EVENTS.length) * 100);

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${C.teal} 0%, ${C.navy} 100%)`,
      padding: "28px 16px 40px",
      fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
    }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>

        <div style={{ textAlign: "center", color: C.white, marginBottom: 22 }}>
          <div style={{ fontSize: 11, letterSpacing: 5, opacity: 0.6, marginBottom: 4 }}>
            ASHIYA MULTICULTURAL COMMUNITY
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 2 }}>Community Passport</div>
          <div style={{ fontSize: 12, opacity: 0.5, marginTop: 3 }}>コミュニティパスポート</div>
        </div>

        {/* Card */}
        <div style={{
          background: C.white, borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)", overflow: "hidden",
        }}>
          {/* Profile header */}
          <div style={{
            background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
            padding: "16px 22px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: C.goldLight, border: `3px solid ${C.gold}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
              }}>👤</div>
              <div>
                <div style={{ color: C.white, fontWeight: 800, fontSize: 16 }}>{ME.name}</div>
                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 2 }}>
                  {ME.nameEn}　／　{ME.flag}　／　Since {ME.since}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{
                background: level.color, color: C.white,
                borderRadius: 30, padding: "5px 16px",
                fontWeight: 800, fontSize: 13, letterSpacing: 1,
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              }}>⭐ {level.label}</div>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, marginTop: 4 }}>
                No. {ME.no}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{
            background: C.offWhite, padding: "12px 22px",
            display: "flex", alignItems: "center", gap: 20,
            borderBottom: `1px solid ${C.lightGray}`,
          }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 30, fontWeight: 800, color: C.teal }}>{count}</span>
              <span style={{ fontSize: 12, color: C.gray }}>/ {EVENTS.length} スタンプ</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 11, color: C.gray, marginBottom: 4,
              }}>
                <span>参加率</span><span>{pct}%</span>
              </div>
              <div style={{ height: 8, background: C.lightGray, borderRadius: 8, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${pct}%`,
                  background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
                  borderRadius: 8, transition: "width 0.4s ease",
                }} />
              </div>
            </div>
            <div style={{ minWidth: 130, textAlign: "right" }}>
              <div style={{ fontSize: 11, color: C.gray, marginBottom: 3 }}>次のレベルまで</div>
              <div style={{
                fontSize: 12, fontWeight: 700,
                color: count >= EVENTS.length ? C.gold : level.color,
              }}>
                {count >= EVENTS.length
                  ? "🎉 コンプリート！"
                  : `あと ${level.next - count} 回 → ${getLevel(level.next).label}`}
              </div>
            </div>
          </div>

          {/* Stamps */}
          <div style={{ padding: "22px 22px 16px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 13, fontWeight: 700, color: C.charcoal,
              marginBottom: 18,
            }}>
              <span style={{
                display: "inline-block", width: 4, height: 16,
                background: C.teal, borderRadius: 2,
              }} />
              イベント参加スタンプ
              <span style={{ fontSize: 11, color: C.gray, fontWeight: 400 }}>
                — タップして記録（デモ用）
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {EVENTS.map(ev => (
                <Stamp
                  key={ev.id}
                  event={ev}
                  stamped={stamps.has(ev.id)}
                  onClick={() => toggle(ev.id)}
                />
              ))}
            </div>
          </div>

          {/* Flash notification */}
          {flash && (
            <div style={{
              margin: "0 22px 16px",
              background: C.tealPale, border: `1px solid ${C.tealLight}`,
              borderLeft: `4px solid ${C.teal}`,
              borderRadius: 8, padding: "10px 14px",
              fontSize: 13, color: C.teal, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              ✅ 参加が記録されました！
              <span style={{ fontWeight: 400, color: C.charcoal }}>
                {EVENTS.find(e => e.id === flash)?.nameShort}
              </span>
            </div>
          )}

          {/* Level guide */}
          <div style={{
            margin: "0 22px 22px",
            background: C.goldLight, border: `1px solid ${C.gold}30`,
            borderRadius: 10, padding: "12px 16px",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.charcoal, marginBottom: 8 }}>
              🎖️ レベルガイド
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { label: "Newcomer",    range: "0回",    color: C.gray    },
                { label: "Explorer",    range: "1〜2回", color: C.tealMid },
                { label: "Regular",     range: "3〜4回", color: C.green   },
                { label: "Active",      range: "5回",    color: C.gold    },
                { label: "Ambassador",  range: "全6回",  color: C.navy    },
              ].map(lv => (
                <div key={lv.label} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: C.white, borderRadius: 20, padding: "3px 10px 3px 6px",
                  border: `1.5px solid ${lv.color}`,
                  opacity: level.label === lv.label ? 1 : 0.45,
                  transform: level.label === lv.label ? "scale(1.06)" : "scale(1)",
                  transition: "all 0.2s",
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: lv.color }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: lv.color }}>{lv.label}</span>
                  <span style={{ fontSize: 10, color: C.gray }}>{lv.range}</span>
                </div>
              ))}
            </div>
          </div>

          {/* QR Code */}
          <div style={{
            margin: "0 22px 22px",
            background: C.offWhite, border: `1px solid ${C.lightGray}`,
            borderRadius: 12, padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 20,
          }}>
            <div style={{
              background: C.white, borderRadius: 10, padding: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)", flexShrink: 0,
            }}>
              <QRCodeSVG
                value={btoa(unescape(encodeURIComponent(JSON.stringify({
                  id: ME.id, name: ME.name, nameEn: ME.nameEn, flag: ME.flag,
                }))))}
                size={100}
                fgColor={C.navy}
                level="M"
              />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 5 }}>
                📱 受付用QRコード
              </div>
              <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.6 }}>
                イベント受付でスタッフに<br />
                このQRコードをご提示ください。<br />
                スキャンで出席が記録されます。
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            background: C.teal, padding: "8px 22px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>
              芦屋市多文化共生アドバイザー事業
            </span>
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>
              Foreign Services Consultant
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
