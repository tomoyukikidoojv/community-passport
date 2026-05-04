import { useState } from "react";
import { C } from "../constants";
import { useLang } from "../i18n/LangContext";
import { sendContactEmail } from "../lib/emailService";

// ── LINE設定 ─────────────────────────────────────────────
// LINE公式アカウントのURLに変更してください
// 例: "https://line.me/R/ti/p/@xxxxxxxx"
const LINE_URL = "https://line.me/R/ti/p/@307ghsul";

export default function ContactPage({ user }) {
  const { t } = useLang();
  const [tab, setTab] = useState("line"); // "line" | "form"
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", message: "" });
  const [status, setStatus] = useState(null); // null | "sending" | "sent" | "err"

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) return;
    setStatus("sending");
    const result = await sendContactEmail(form.name, form.email, form.message);
    setStatus(result === "sent" ? "sent" : result === "not_configured" ? "sent" : "err");
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", boxSizing: "border-box",
    border: `1.5px solid ${C.lightGray}`, borderRadius: 8,
    fontSize: 14, color: C.charcoal, fontFamily: "inherit",
    outline: "none", background: C.white, transition: "border-color 0.2s",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${C.teal} 0%, ${C.navy} 100%)`,
      padding: "28px 16px 48px",
      fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
    }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", color: C.white, marginBottom: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{t("contact.title")}</div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{t("contact.subtitle")}</div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 20,
          background: "rgba(255,255,255,0.15)", borderRadius: 14, padding: 6,
        }}>
          {[
            { key: "line", icon: "💚", label: t("contact.tab_line") },
            { key: "form", icon: "✉️", label: t("contact.tab_form") },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              style={{
                flex: 1, padding: "10px", borderRadius: 10, border: "none",
                cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600,
                background: tab === item.key ? C.white : "transparent",
                color: tab === item.key ? C.teal : "rgba(255,255,255,0.8)",
                boxShadow: tab === item.key ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                transition: "all 0.2s",
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        {/* LINE tab */}
        {tab === "line" && (
          <div style={{
            background: C.white, borderRadius: 20,
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            padding: "36px 28px", textAlign: "center",
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>💚</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.charcoal, marginBottom: 8 }}>
              {t("contact.line_title")}
            </div>
            <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.7, marginBottom: 28 }}>
              {t("contact.line_desc")}
            </div>
            <a
              href={LINE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "14px 40px",
                background: "#06C755",
                color: C.white, borderRadius: 12,
                fontSize: 16, fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(6,199,85,0.4)",
              }}
            >
              {t("contact.line_btn")}
            </a>
          </div>
        )}

        {/* Form tab */}
        {tab === "form" && (
          <div style={{
            background: C.white, borderRadius: 20,
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            overflow: "hidden",
          }}>
            <div style={{
              background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
              padding: "16px 24px",
            }}>
              <div style={{ color: C.white, fontWeight: 700, fontSize: 15 }}>
                ✉️ {t("contact.form_title")}
              </div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>
                {t("contact.form_desc")}
              </div>
            </div>

            {status === "sent" ? (
              <div style={{ padding: "48px 28px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.teal, marginBottom: 8 }}>
                  {t("contact.sent_title")}
                </div>
                <div style={{ fontSize: 13, color: C.gray }}>
                  {t("contact.sent_desc")}
                </div>
                <button
                  onClick={() => { setStatus(null); setForm(f => ({ ...f, message: "" })); }}
                  style={{
                    marginTop: 24, padding: "10px 28px",
                    background: C.teal, color: C.white,
                    border: "none", borderRadius: 8,
                    fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {t("contact.send_another")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ padding: "24px 28px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>
                      {t("contact.name")}
                    </label>
                    <input type="text" value={form.name} onChange={set("name")}
                      placeholder={t("contact.name_placeholder")}
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>
                      {t("contact.email")}
                    </label>
                    <input type="email" value={form.email} onChange={set("email")}
                      placeholder="email@example.com"
                      style={inputStyle} />
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>
                    {t("contact.message")} <span style={{ color: "#E74C3C" }}>*</span>
                  </label>
                  <textarea
                    value={form.message} onChange={set("message")}
                    placeholder={t("contact.message_placeholder")}
                    rows={5}
                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                  />
                </div>

                {status === "err" && (
                  <div style={{ color: "#E74C3C", fontSize: 12, marginBottom: 12 }}>
                    {t("contact.err")}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  style={{
                    width: "100%", padding: "13px",
                    background: status === "sending"
                      ? C.lightGray
                      : `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
                    color: C.white, border: "none", borderRadius: 10,
                    fontSize: 15, fontWeight: 700, cursor: status === "sending" ? "default" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {status === "sending" ? "..." : t("contact.submit")}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
