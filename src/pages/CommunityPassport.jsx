import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { C, USERS, getLevel } from "../constants";
import { useEvents } from "../hooks/useEvents";
import { useLang } from "../i18n/LangContext";

// ── 写真トリミングモーダル ───────────────────────────────
function PhotoCropModal({ src, onConfirm, onCancel }) {
  const D = 260;
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const [imgSize, setImgSize] = useState({ w: 1, h: 1 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // confirm 用に最新の offset/scale を ref で持つ
  const offsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  useEffect(() => { offsetRef.current = offset; }, [offset]);
  useEffect(() => { scaleRef.current = scale; }, [scale]);

  const onImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const { naturalWidth: w, naturalHeight: h } = img;
    const s = Math.max(D / w, D / h);
    setImgSize({ w, h });
    setScale(s);
    setOffset({ x: (D - w * s) / 2, y: (D - h * s) / 2 });
  };

  // ── ネイティブタッチイベント（passive:false で preventDefault が効く）──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let isDragging = false;
    let lastX = 0, lastY = 0;
    let lastPinch = null;

    const onTS = (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        isDragging = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinch = Math.sqrt(dx * dx + dy * dy);
      }
    };
    const onTM = (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - lastX;
        const dy = e.touches[0].clientY - lastY;
        setOffset(o => ({ x: o.x + dx, y: o.y + dy }));
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      } else if (e.touches.length === 2 && lastPinch) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        setScale(s => Math.max(0.3, Math.min(5, s * (dist / lastPinch))));
        lastPinch = dist;
      }
    };
    const onTE = () => { isDragging = false; lastPinch = null; };

    el.addEventListener("touchstart", onTS, { passive: false });
    el.addEventListener("touchmove",  onTM, { passive: false });
    el.addEventListener("touchend",   onTE);
    return () => {
      el.removeEventListener("touchstart", onTS);
      el.removeEventListener("touchmove",  onTM);
      el.removeEventListener("touchend",   onTE);
    };
  }, []);

  // ── マウスドラッグ ──
  const isDraggingMouse = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const onMouseDown = (e) => { isDraggingMouse.current = true; lastMouse.current = { x: e.clientX, y: e.clientY }; };
  const onMouseMove = (e) => {
    if (!isDraggingMouse.current) return;
    setOffset(o => ({ x: o.x + e.clientX - lastMouse.current.x, y: o.y + e.clientY - lastMouse.current.y }));
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseUp = () => { isDraggingMouse.current = false; };

  const handleConfirm = () => {
    const OUT = 300;
    const canvas = document.createElement("canvas");
    canvas.width = OUT; canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUT, OUT);
    const r = OUT / D;
    const { x, y } = offsetRef.current;
    const s = scaleRef.current;
    ctx.drawImage(imgRef.current, x * r, y * r, imgSize.w * s * r, imgSize.h * s * r);
    onConfirm(canvas.toDataURL("image/jpeg", 0.82));
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 24,
      fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
    }}>
      <div style={{ color: C.white, fontSize: 15, fontWeight: 800, marginBottom: 6 }}>📷 写真を調整</div>
      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginBottom: 16 }}>
        ドラッグで移動 ／ ピンチ or スライダーで拡大縮小
      </div>

      {/* トリミング円 */}
      <div
        ref={containerRef}
        style={{
          width: D, height: D, borderRadius: "50%",
          border: `3px solid ${C.gold}`,
          overflow: "hidden", position: "relative",
          background: "#fff", cursor: "grab",
          userSelect: "none", touchAction: "none",
          boxShadow: `0 0 0 2000px rgba(0,0,0,0.6)`,
        }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
      >
        <img
          ref={imgRef} src={src} onLoad={onImgLoad} draggable={false}
          style={{
            position: "absolute",
            left: offset.x, top: offset.y,
            width: imgSize.w * scale, height: imgSize.h * scale,
            pointerEvents: "none", userSelect: "none",
          }}
        />
      </div>

      {/* ズームスライダー */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 18 }}>🔍</span>
        <input
          type="range" min={20} max={400} step={1}
          value={Math.round(scale * 100)}
          onChange={e => setScale(Number(e.target.value) / 100)}
          style={{ width: 200, accentColor: C.gold }}
        />
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 20 }}>🔍</span>
      </div>

      {/* ボタン */}
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button onClick={onCancel} style={{
          padding: "10px 28px", borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.25)",
          background: "transparent", color: C.white,
          fontSize: 14, cursor: "pointer", fontFamily: "inherit",
        }}>キャンセル</button>
        <button onClick={handleConfirm} style={{
          padding: "10px 28px", borderRadius: 10,
          border: "none", background: C.gold,
          color: C.white, fontSize: 14, fontWeight: 800,
          cursor: "pointer", fontFamily: "inherit",
        }}>✓ 確定</button>
      </div>
    </div>
  );
}

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

export default function CommunityPassport({ stamps, onManualStamp, user, onPhotoUpdate }) {
  const { t } = useLang();
  const [flash, setFlash] = useState(null);
  const [qrExpanded, setQrExpanded] = useState(false);
  const [photoHover, setPhotoHover] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const fileInputRef = useRef(null);
  const ME = user || USERS[0];
  const events = useEvents();

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropConfirm = (dataUrl) => {
    onPhotoUpdate?.(dataUrl);
    setCropSrc(null);
  };

  const toggle = (id) => {
    onManualStamp(ME.id, id);
    setFlash(id);
    setTimeout(() => setFlash(null), 2500);
  };

  const count = stamps.size;
  const level = getLevel(count);
  const pct = Math.round((count / events.length) * 100);

  const qrValue = btoa(unescape(encodeURIComponent(JSON.stringify({
    id: ME.id, name: ME.name, nameEn: ME.nameEn, flag: ME.flag,
  }))));

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
            {t("passport.header")}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 2 }}>{t("passport.title")}</div>
          <div style={{ fontSize: 12, opacity: 0.5, marginTop: 3 }}>{t("passport.subtitle")}</div>
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
            {/* hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: 1 }}>
              {/* アバター（タップで写真変更） */}
              <div
                onClick={handlePhotoClick}
                onMouseEnter={() => setPhotoHover(true)}
                onMouseLeave={() => setPhotoHover(false)}
                style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: C.goldLight, border: `3px solid ${C.gold}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, flexShrink: 0,
                  cursor: "pointer", overflow: "hidden",
                  position: "relative",
                  transition: "opacity 0.2s",
                }}
              >
                {ME.photo
                  ? <img src={ME.photo} alt="profile"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span>👤</span>
                }
                {/* カメラオーバーレイ */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "rgba(0,0,0,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                  opacity: photoHover ? 1 : 0,
                  transition: "opacity 0.2s",
                }}>📷</div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: C.white, fontWeight: 800, fontSize: 16 }}>{ME.name}</div>
                <div style={{
                  color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 2,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
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

          {/* QR Card — at the top for easy staff scan */}
          <div
            onClick={() => setQrExpanded(true)}
            style={{
              margin: "22px 22px 0",
              background: `linear-gradient(135deg, ${C.navy} 0%, #1a3a5c 50%, ${C.teal} 100%)`,
              borderRadius: 16,
              padding: "20px 24px",
              position: "relative",
              overflow: "hidden",
              boxShadow: `0 8px 24px rgba(0,0,0,0.25)`,
              cursor: "pointer",
            }}>
            {/* Decorative circles */}
            <div style={{
              position: "absolute", top: -30, right: -30,
              width: 120, height: 120, borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", bottom: -20, left: 60,
              width: 80, height: 80, borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
              pointerEvents: "none",
            }} />

            <div style={{ display: "flex", alignItems: "center", gap: 20, position: "relative" }}>
              {/* QR code */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <div style={{
                  background: C.white,
                  borderRadius: 12,
                  padding: 10,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                }}>
                  <QRCodeSVG value={qrValue} size={110} fgColor={C.navy} level="M" />
                </div>
                {/* 写真サムネイル */}
                {ME.photo && (
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    border: `2px solid ${C.gold}`,
                    overflow: "hidden", background: C.goldLight,
                  }}>
                    <img src={ME.photo} alt="profile"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 9, letterSpacing: 3,
                  color: "rgba(255,255,255,0.45)",
                  marginBottom: 6, textTransform: "uppercase",
                }}>
                  {t("passport.qr_label")}
                </div>
                <div style={{
                  fontSize: 18, fontWeight: 800, color: C.white,
                  lineHeight: 1.2, marginBottom: 2,
                }}>
                  {ME.name}
                </div>
                <div style={{
                  fontSize: 11, color: "rgba(255,255,255,0.5)",
                  marginBottom: 12,
                }}>
                  {ME.nameEn}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                      fontSize: 9, color: "rgba(255,255,255,0.4)",
                      letterSpacing: 1, minWidth: 28,
                    }}>{t("passport.no")}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: C.gold, letterSpacing: 1,
                      fontFamily: "monospace",
                    }}>{ME.no}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                      fontSize: 9, color: "rgba(255,255,255,0.4)",
                      letterSpacing: 1, minWidth: 28,
                    }}>{t("passport.lv")}</span>
                    <span style={{
                      background: level.color,
                      color: C.white,
                      borderRadius: 4, padding: "1px 8px",
                      fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
                    }}>⭐ {level.label}</span>
                  </div>
                </div>

                <div style={{
                  marginTop: 12,
                  fontSize: 10, color: "rgba(255,255,255,0.35)",
                  lineHeight: 1.5, whiteSpace: "pre-line",
                }}>
                  {t("passport.qr_show")}
                </div>
                <div style={{
                  marginTop: 8, fontSize: 9,
                  color: "rgba(255,255,255,0.25)",
                  letterSpacing: 0.5,
                }}>
                  {t("passport.qr_tap")}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{
            background: C.offWhite, padding: "12px 22px",
            display: "flex", alignItems: "center", gap: 20,
            borderBottom: `1px solid ${C.lightGray}`,
            marginTop: 22,
          }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 30, fontWeight: 800, color: C.teal }}>{count}</span>
              <span style={{ fontSize: 12, color: C.gray }}>{t("passport.stamps_of", { n: events.length })}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 11, color: C.gray, marginBottom: 4,
              }}>
                <span>{t("passport.participation")}</span><span>{pct}%</span>
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
              <div style={{ fontSize: 11, color: C.gray, marginBottom: 3 }}>{t("passport.next_level")}</div>
              <div style={{
                fontSize: 12, fontWeight: 700,
                color: count >= events.length ? C.gold : level.color,
              }}>
                {count >= events.length
                  ? t("passport.complete")
                  : t("passport.more", { n: level.next - count, level: getLevel(level.next).label })}
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
              {t("passport.stamp_title")}
              <span style={{ fontSize: 11, color: C.gray, fontWeight: 400 }}>
                {t("passport.stamp_hint")}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {events.map(ev => (
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
                {events.find(e => e.id === flash)?.nameShort}
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
              {t("passport.level_guide")}
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

          {/* Footer */}
          <div style={{
            background: C.teal, padding: "8px 22px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>
              {t("passport.footer_l")}
            </span>
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>
              {t("passport.footer_r")}
            </span>
          </div>
        </div>
      </div>

      {/* Photo crop modal */}
      {cropSrc && (
        <PhotoCropModal
          src={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {/* QR expanded modal */}
      {qrExpanded && (
        <div
          onClick={() => setQrExpanded(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 20,
            fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
          }}
        >
          <div style={{
            fontSize: 11, letterSpacing: 3,
            color: "rgba(255,255,255,0.4)", marginBottom: 4,
            textTransform: "uppercase",
          }}>{t("passport.qr_label")}</div>
          <div style={{
            background: C.white, borderRadius: 16, padding: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}>
            <QRCodeSVG value={qrValue} size={220} fgColor={C.navy} level="M" />
          </div>
          <div style={{ textAlign: "center" }}>
            {ME.photo && (
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                border: `3px solid ${C.gold}`,
                overflow: "hidden", margin: "0 auto 10px",
              }}>
                <img src={ME.photo} alt="profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <div style={{ color: C.white, fontWeight: 800, fontSize: 18 }}>
              {ME.flag} {ME.name}
            </div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 3 }}>
              {ME.nameEn}　／　No. {ME.no}
            </div>
          </div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 8 }}>
            {t("passport.qr_close")}
          </div>
        </div>
      )}
    </div>
  );
}
