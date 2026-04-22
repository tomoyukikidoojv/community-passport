import { useState } from "react";
import { C } from "../constants";
import { useLang } from "../i18n/LangContext";
import LangDropdown from "../components/LangDropdown";
import { sendPasswordResetEmail, EMAIL_CONFIGURED } from "../lib/emailService";
import { fetchUserByCredentials, saveUserToCloud } from "../lib/userService";

export default function LoginPage({ savedUser, onLogin, onReset, onShowRegister, onCloudLogin }) {
  const { t } = useLang();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  // Cross-device login state
  const [crossEmail, setCrossEmail] = useState("");
  const [crossPassword, setCrossPassword] = useState("");
  const [crossStatus, setCrossStatus] = useState(null); // null | "loading" | "not_found" | "wrong" | "error"

  // Reset flow states
  const [resetMode, setResetMode] = useState(false);
  const [resetInput, setResetInput] = useState("");
  const [resetStatus, setResetStatus] = useState(null); // null | "sending" | "sent" | "not_found" | "err" | "unconfigured"
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (password === savedUser.password) {
      onLogin();
      saveUserToCloud(savedUser); // 別デバイス用にクラウド同期
    } else {
      setError(true);
      setPassword("");
    }
  };

  const handleResetSend = async () => {
    const input = resetInput.trim();
    if (!input) return;

    if (savedUser.email !== input) {
      setResetStatus("not_found");
      return;
    }

    setResetStatus("sending");
    const result = await sendPasswordResetEmail(input, savedUser.name, savedUser.password);
    if (result === "sent") setResetStatus("sent");
    else if (result === "not_configured") setResetStatus("unconfigured");
    else setResetStatus("err");
  };

  const statusMsg = {
    sent: { color: "#27AE60", text: t("login.reset_sent_email") },
    unconfigured: { color: C.teal, text: t("login.reset_sent_unconfigured") },
    not_found: { color: "#E74C3C", text: t("login.reset_not_found") },
    err: { color: "#E74C3C", text: t("login.reset_err") },
  };

  // No local data (different device) — cross-device login form
  if (!savedUser) {
    const handleCrossLogin = async () => {
      if (!crossEmail.trim() || !crossPassword.trim()) return;
      setCrossStatus("loading");
      const result = await fetchUserByCredentials(crossEmail.trim(), crossPassword);
      if (result === "not_found" || result === "wrong_password") {
        setCrossStatus("wrong");
      } else if (result === "error") {
        setCrossStatus("error");
      } else {
        // 成功: クラウドからデータ取得
        onCloudLogin(result);
      }
    };

    const inputStyle = {
      width: "100%", padding: "10px 14px", boxSizing: "border-box",
      border: `1.5px solid ${C.lightGray}`, borderRadius: 8,
      fontSize: 14, fontFamily: "inherit", outline: "none", color: C.charcoal,
      marginBottom: 12,
    };

    return (
      <div style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${C.teal} 0%, ${C.navy} 100%)`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "32px 16px",
        fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
      }}>
        <div style={{ width: "100%", maxWidth: 400, marginBottom: 12 }}>
          <LangDropdown />
        </div>
        <div style={{
          background: C.white, borderRadius: 20, maxWidth: 400, width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)", overflow: "hidden",
        }}>
          <div style={{
            background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
            padding: "24px", textAlign: "center",
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📱</div>
            <div style={{ color: C.white, fontSize: 18, fontWeight: 800 }}>
              {t("login.other_device_title")}
            </div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 4 }}>
              {t("login.other_device_desc")}
            </div>
          </div>

          <div style={{ padding: "24px 28px 28px" }}>
            <div style={{ marginBottom: 6 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>
                {t("register.email")}
              </label>
              <input
                type="email"
                value={crossEmail}
                onChange={e => { setCrossEmail(e.target.value); setCrossStatus(null); }}
                placeholder="email@example.com"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>
                {t("login.password")}
              </label>
              <input
                type="password"
                value={crossPassword}
                onChange={e => { setCrossPassword(e.target.value); setCrossStatus(null); }}
                placeholder={t("login.password_placeholder")}
                style={{ ...inputStyle, marginBottom: 0 }}
              />
            </div>

            {crossStatus === "wrong" && (
              <div style={{ color: "#E74C3C", fontSize: 12, marginBottom: 12 }}>
                {t("login.cross_err")}
              </div>
            )}
            {crossStatus === "error" && (
              <div style={{ color: "#E74C3C", fontSize: 12, marginBottom: 12 }}>
                {t("login.reset_err")}
              </div>
            )}

            <button
              onClick={handleCrossLogin}
              disabled={crossStatus === "loading"}
              style={{
                width: "100%", padding: "13px",
                background: crossStatus === "loading" ? C.lightGray : `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
                color: C.white, border: "none", borderRadius: 10,
                fontSize: 15, fontWeight: 700,
                cursor: crossStatus === "loading" ? "default" : "pointer",
                fontFamily: "inherit", marginBottom: 16,
              }}
            >
              {crossStatus === "loading" ? "..." : `🎫 ${t("login.btn")}`}
            </button>

            <div style={{ textAlign: "center", fontSize: 13, color: C.gray }}>
              {t("register.have_account_no")}{" "}
              <button
                onClick={onShowRegister}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: C.teal, fontSize: 13, fontWeight: 700,
                  fontFamily: "inherit", textDecoration: "underline",
                }}
              >
                {t("register.title")} →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${C.teal} 0%, ${C.navy} 100%)`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "32px 16px",
      fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <LangDropdown />
      </div>

      <div style={{
        background: C.white, borderRadius: 20, maxWidth: 400, width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
          padding: "28px 24px",
          textAlign: "center",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: C.goldLight, border: `3px solid ${C.gold}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, margin: "0 auto 12px",
          }}>{savedUser.flag}</div>
          <div style={{ color: C.white, fontSize: 20, fontWeight: 800 }}>
            {savedUser.name}
          </div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 4 }}>
            No. {savedUser.no}
          </div>
        </div>

        {/* Login form */}
        <div style={{ padding: "28px 28px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: C.gray }}>{t("login.select")}</div>
            <div style={{ fontSize: 11, color: C.gray, opacity: 0.7, marginTop: 2 }}>
              {t("login.subtitle")}
            </div>
          </div>

          <form onSubmit={submit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: "block", fontSize: 13, fontWeight: 700,
                color: C.charcoal, marginBottom: 6,
              }}>
                {t("login.password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false); }}
                placeholder={t("login.password_placeholder")}
                autoFocus
                style={{
                  width: "100%", padding: "10px 14px", boxSizing: "border-box",
                  border: `1.5px solid ${error ? "#E74C3C" : C.lightGray}`,
                  borderRadius: 8, fontSize: 14, fontFamily: "inherit",
                  outline: "none", color: C.charcoal,
                  transition: "border-color 0.2s",
                }}
              />
              {error && (
                <div style={{ color: "#E74C3C", fontSize: 12, marginTop: 6 }}>
                  {t("login.error")}
                </div>
              )}
            </div>

            <button
              type="submit"
              style={{
                width: "100%", padding: "13px",
                background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
                color: C.white, border: "none", borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: `0 4px 16px ${C.teal}40`,
              }}
            >
              {`🎫 ${t("login.btn")}`}
            </button>
          </form>

          {/* Forgot password / New registration */}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            {!resetMode && !showDeleteConfirm && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => setResetMode(true)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: C.gray, fontSize: 12, fontFamily: "inherit",
                    textDecoration: "underline",
                  }}
                >
                  {t("login.forgot")}
                </button>
                <button
                  onClick={onShowRegister}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: C.teal, fontSize: 12, fontFamily: "inherit",
                    textDecoration: "underline",
                  }}
                >
                  📝 {t("login.new_register")}
                </button>
              </div>
            )}

            {/* Password reset panel */}
            {resetMode && !showDeleteConfirm && (
              <div style={{
                background: `${C.teal}08`, border: `1px solid ${C.tealLight}`,
                borderRadius: 12, padding: "16px", textAlign: "left",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.teal, marginBottom: 12 }}>
                  🔑 {t("login.reset_email_label")}
                </div>

                <input
                  type="email"
                  value={resetInput}
                  onChange={e => { setResetInput(e.target.value); setResetStatus(null); }}
                  placeholder="example@email.com"
                  style={{
                    width: "100%", padding: "9px 12px", boxSizing: "border-box",
                    border: `1.5px solid ${C.lightGray}`, borderRadius: 8,
                    fontSize: 13, fontFamily: "inherit", outline: "none",
                    marginBottom: 10,
                  }}
                />

                {/* Status message */}
                {resetStatus && resetStatus !== "sending" && statusMsg[resetStatus] && (
                  <div style={{
                    fontSize: 12, color: statusMsg[resetStatus].color,
                    marginBottom: 10, lineHeight: 1.5,
                    padding: "8px 10px", borderRadius: 8,
                    background: `${statusMsg[resetStatus].color}12`,
                  }}>
                    {statusMsg[resetStatus].text}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleResetSend}
                    disabled={resetStatus === "sending" || resetStatus === "sent"}
                    style={{
                      flex: 1, padding: "8px",
                      background: (resetStatus === "sending" || resetStatus === "sent") ? C.lightGray : C.teal,
                      color: C.white, border: "none", borderRadius: 8,
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {resetStatus === "sending" ? "..." : t("login.reset_send")}
                  </button>
                  <button
                    onClick={() => { setResetMode(false); setResetInput(""); setResetStatus(null); }}
                    style={{
                      flex: 1, padding: "8px",
                      background: C.white, color: C.gray,
                      border: `1px solid ${C.lightGray}`, borderRadius: 8,
                      fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    {t("common.cancel")}
                  </button>
                </div>

                {/* Delete account link */}
                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <button
                    onClick={() => { setResetMode(false); setShowDeleteConfirm(true); }}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "#E74C3C", fontSize: 11, fontFamily: "inherit",
                      textDecoration: "underline", opacity: 0.7,
                    }}
                  >
                    {t("login.reset_title")}
                  </button>
                </div>
              </div>
            )}

            {/* Delete/reset account confirm */}
            {showDeleteConfirm && (
              <div style={{
                background: "#FEF9F9", border: `1px solid #F5C6CB`,
                borderRadius: 12, padding: "16px", textAlign: "left",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#C0392B", marginBottom: 6 }}>
                  {t("login.reset_title")}
                </div>
                <div style={{ fontSize: 12, color: C.charcoal, marginBottom: 12, lineHeight: 1.6 }}>
                  {t("login.reset_body")}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={onReset}
                    style={{
                      flex: 1, padding: "8px",
                      background: "#E74C3C", color: C.white,
                      border: "none", borderRadius: 8,
                      fontSize: 12, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    {t("login.reset_btn")}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      flex: 1, padding: "8px",
                      background: C.white, color: C.gray,
                      border: `1px solid ${C.lightGray}`, borderRadius: 8,
                      fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
