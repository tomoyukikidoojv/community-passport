import { useState, useRef, useEffect } from "react";
import { useLang } from "../i18n/LangContext";
import { LANGS } from "../i18n/translations";
import { C } from "../constants";

/**
 * Compact language picker: shows current language button, tap → dropdown with all options.
 * Used on RegisterPage and LoginPage (before user is logged in).
 */
export default function LangDropdown() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGS.find(l => l.code === lang) || LANGS[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  return (
    <div ref={ref} style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12, position: "relative", zIndex: 100 }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 14px", borderRadius: 20, border: "none",
          cursor: "pointer", fontSize: 13, fontFamily: "inherit",
          background: "rgba(255,255,255,0.22)",
          color: "#fff", fontWeight: 600,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          transition: "background 0.15s",
        }}
      >
        <span style={{ fontSize: 16 }}>{current.flag}</span>
        <span>{current.label}</span>
        <span style={{
          fontSize: 10, opacity: 0.8,
          transform: open ? "rotate(180deg)" : "none",
          transition: "transform 0.2s", display: "inline-block",
        }}>▼</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: "#fff", borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
          overflow: "hidden", minWidth: 160,
        }}>
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "10px 16px",
                border: "none", cursor: "pointer", fontFamily: "inherit",
                background: l.code === lang ? C.tealPale : "#fff",
                color: l.code === lang ? C.teal : C.charcoal,
                fontWeight: l.code === lang ? 700 : 400,
                fontSize: 13, textAlign: "left",
                borderBottom: "1px solid #f0f0f0",
                transition: "background 0.1s",
              }}
            >
              <span style={{ fontSize: 18 }}>{l.flag}</span>
              <span>{l.label}</span>
              {l.code === lang && <span style={{ marginLeft: "auto", color: C.teal, fontSize: 12 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
