import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../constants";
import { useLang } from "../i18n/LangContext";
import LangDropdown from "../components/LangDropdown";
import { sendPasswordResetEmail, EMAIL_CONFIGURED } from "../lib/emailService";
import { fetchUserByCredentials, saveUserToCloud, hashPassword } from "../lib/userService";

const USER_LOCK_KEY = "cp_user_lock";
const USER_MAX_FAILS = 5;
const USER_LOCK_MINS = 10;

export default function LoginPage({ savedUser, onLogin, onReset, onShowRegister, onCloudLogin }) {
  const navigate = useNavigate();
  const { t } = useLang();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [userFails, setUserFails] = useState(() => {
    try {
      const lock = JSON.parse(localStorage.getItem(USER_LOCK_KEY));
      return (lock && new Date(lock.until) > new Date()) ? lock.fails : 0;
    } catch { return 0; }
  });
  const [userLockedUntil, setUserLockedUntil] = useState(() => {
    try {
      const lock = JSON.parse(localStorage.getItem(USER_LOCK_KEY));
      if (lock && new Date(lock.until) > new Date()) return new Date(lock.until);
      localStorage.removeItem(USER_LOCK_KEY);
    } catch {}
    return null;
  });
  const [now, setNow] = useState(new Date());

  useState(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  });

  const isUserLocked = userLockedUntil && userLockedUntil > now;
  const userLockSecs = isUserLocked ? Math.ceil((userLockedUntil - now) / 1000) : 0;

  // Cross-device login state
  const [crossEmail, setCrossEmail] = useState("");
  const [crossPassword, setCrossPassword] = useState("");
  const [crossStatus, setCrossStatus] = useState(null); // null | "loading" | "not_found" | "wrong" | "error"

  // Reset flow states
  const [resetMode, setResetMode] = useState(false);
  const [resetInput, setResetInput] = useState("");
  const [resetStatus, setResetStatus] = useState(null); // null | "sending" | "sent" | "not_found" | "err" | "unconfigured"
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (isUserLocked) return;
    const hashed = await hashPassword(password);
    // ハッシュ比較（新形式）または平文比較（旧形式の後方互換）
    const match = savedUser.password === hashed || savedUser.password === password;
    if (match) {
      localStorage.removeItem(USER_LOCK_KEY);
      setUserFails(0);
      setUserLockedUntil(null);
      onLogin();
      saveUserToCloud(savedUser);
    } else {
      const newFails = userFails + 1;
      setUserFails(newFails);
      if (newFails >= USER_MAX_FAILS) {
        const until = new Date(Date.now() + USER_LOCK_MINS * 60 * 1000);
        localStorage.setItem(USER_LOCK_KEY, JSON.stringify({ until: until.toISOString(), fails: newFails }));
        setUserLockedUntil(until);
      }
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
        background: C.bgGradient,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "32px 16px",
        fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"rgba(124,58,237,0.18)", filter:"blur(100px)", top:-150, right:-100, pointerEvents:"none" }} />
        <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"rgba(11,122,107,0.18)", filter:"blur(90px)", bottom:-100, left:-80, pointerEvents:"none" }} />
        {/* 管理者ログインボタン */}
        <button
          onClick={() => navigate("/kanri-ashiya2026")}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.20)",
            borderRadius: 20, padding: "5px 14px",
            color: "rgba(255,255,255,0.45)", fontSize: 11,
            cursor: "pointer", fontFamily: "inherit",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.20)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.10)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
        >
          👑 管理者
        </button>
        <div style={{ width: "100%", maxWidth: 400, marginBottom: 12, position: "relative", zIndex: 1 }}>
          <LangDropdown />
        </div>
        <div style={{
          background: C.glassWhite,
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.35)",
          borderRadius: 20, maxWidth: 400, width: "100%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)", overflow: "hidden",
          position: "relative", zIndex: 1,
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
      background: C.bgGradient,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "32px 16px",
      fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"rgba(124,58,237,0.18)", filter:"blur(100px)", top:-150, right:-100, pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"rgba(11,122,107,0.18)", filter:"blur(90px)", bottom:-100, left:-80, pointerEvents:"none" }} />
      {/* 管理者ログインボタン */}
      <button
        onClick={() => navigate("/kanri-ashiya2026")}
        style={{
          position: "absolute", top: 16, right: 16,
          background: "rgba(255,255,255,0.10)",
          border: "1px solid rgba(255,255,255,0.20)",
          borderRadius: 20, padding: "5px 14px",
          color: "rgba(255,255,255,0.45)", fontSize: 11,
          cursor: "pointer", fontFamily: "inherit",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.20)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.10)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
      >
        👑 管理者
      </button>
      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        <LangDropdown />
      </div>

      <div style={{
        background: C.glassWhite,
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.35)",
        borderRadius: 20, maxWidth: 400, width: "100%",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)", overflow: "hidden",
        position: "relative", zIndex: 1,
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

          {isUserLocked ? (
            <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔒</div>
              <div style={{ fontWeight: 700, color: "#C0392B", marginBottom: 6, fontSize: 14 }}>
                一時的にブロック中
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "monospace", color: C.charcoal }}>
                {Math.floor(userLockSecs / 60)}:{String(userLockSecs % 60).padStart(2, "0")}
              </div>
              <div style={{ fontSize: 11, color: C.gray, marginTop: 4 }}>
                {USER_MAX_FAILS}回失敗しました。しばらく待ってから再試行してください
              </div>
            </div>
          ) : (
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
                  {userFails > 0 && userFails < USER_MAX_FAILS && (
                    <span style={{ color: "#E67E22" }}>（残り{USER_MAX_FAILS - userFails}回）</span>
                  )}
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
          )}

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
