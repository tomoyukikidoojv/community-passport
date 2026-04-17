import { useState } from "react";
import { C } from "../constants";
import { useLang } from "../i18n/LangContext";

export default function LoginPage({ savedUser, onLogin, onReset }) {
  const { t } = useLang();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (password === savedUser.password) {
      onLogin();
    } else {
      setError(true);
      setPassword("");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${C.teal} 0%, ${C.navy} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px 16px",
      fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
    }}>
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
            {savedUser.nameEn}　／　No. {savedUser.no}
          </div>
        </div>

        {/* Login form */}
        <div style={{ padding: "28px 28px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: C.gray }}>
              {t("login.select")}
            </div>
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

          {/* Reset */}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            {!showReset ? (
              <button
                onClick={() => setShowReset(true)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: C.gray, fontSize: 12, fontFamily: "inherit",
                  textDecoration: "underline",
                }}
              >
                パスワードを忘れた場合
              </button>
            ) : (
              <div style={{
                background: C.redPale, border: `1px solid ${C.red}30`,
                borderRadius: 10, padding: "14px 16px",
                textAlign: "left",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.red, marginBottom: 6 }}>
                  ⚠️ 登録を削除して最初からやり直しますか？
                </div>
                <div style={{ fontSize: 12, color: C.charcoal, marginBottom: 12, lineHeight: 1.6 }}>
                  スタンプの記録もすべて消えます。
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={onReset}
                    style={{
                      flex: 1, padding: "8px",
                      background: C.red, color: C.white,
                      border: "none", borderRadius: 8,
                      fontSize: 12, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    削除してやり直す
                  </button>
                  <button
                    onClick={() => setShowReset(false)}
                    style={{
                      flex: 1, padding: "8px",
                      background: C.white, color: C.gray,
                      border: `1px solid ${C.lightGray}`, borderRadius: 8,
                      fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    キャンセル
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
