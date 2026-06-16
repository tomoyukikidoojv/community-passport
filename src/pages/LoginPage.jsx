import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../constants";
import { useLang } from "../i18n/LangContext";
import LangDropdown from "../components/LangDropdown";
import { sendResetCode, EMAIL_CONFIGURED } from "../lib/emailService";
import { fetchUserByCredentials, fetchUserByEmail, saveUserToCloud, hashPassword } from "../lib/userService";

const USER_LOCK_KEY = "cp_user_lock";
const USER_MAX_FAILS = 5;
const USER_LOCK_MINS = 10;

export default function LoginPage({ savedUser, onLogin, onReset, onPasswordChange, onShowRegister, onCloudLogin }) {
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

  // Cross-device password reset state (for Chrome where no savedUser)
  const [crossResetMode, setCrossResetMode] = useState(false);
  const [crossResetStep, setCrossResetStep] = useState("email"); // "email" | "code" | "newpwd" | "done"
  const [crossResetEmail, setCrossResetEmail] = useState("");
  const [crossResetError, setCrossResetError] = useState(null);
  const [crossCodeInput, setCrossCodeInput] = useState("");
  const [crossVerifyCode, setCrossVerifyCode] = useState(null);
  const [crossCodeExpiry, setCrossCodeExpiry] = useState(null);
  const [crossNewPwd, setCrossNewPwd] = useState("");
  const [crossConfirmPwd, setCrossConfirmPwd] = useState("");
  const [crossResetUser, setCrossResetUser] = useState(null); // Firestoreから取得したユーザー

  const crossResetClear = () => {
    setCrossResetMode(false);
    setCrossResetStep("email");
    setCrossResetEmail("");
    setCrossResetError(null);
    setCrossCodeInput("");
    setCrossVerifyCode(null);
    setCrossCodeExpiry(null);
    setCrossNewPwd("");
    setCrossConfirmPwd("");
    setCrossResetUser(null);
  };

  const handleCrossResetSendCode = async () => {
    const email = crossResetEmail.trim();
    if (!email) return;
    setCrossResetError("sending");
    const user = await fetchUserByEmail(email);
    if (!user) { setCrossResetError("このメールアドレスは登録されていません"); return; }
    const code = Math.floor(1000 + Math.random() * 9000);
    const result = await sendResetCode(email, user.name, code);
    if (result === "sent") {
      setCrossResetUser(user);
      setCrossVerifyCode(code);
      setCrossCodeExpiry(Date.now() + 10 * 60 * 1000);
      setCrossResetStep("code");
      setCrossResetError(null);
    } else if (result === "not_configured") {
      setCrossResetError("メール送信が設定されていません");
    } else {
      setCrossResetError("送信に失敗しました。もう一度お試しください");
    }
  };

  const handleCrossResetVerifyCode = () => {
    if (!crossCodeInput) return;
    if (Date.now() > crossCodeExpiry) { setCrossResetError("コードの有効期限が切れました"); return; }
    if (Number(crossCodeInput) !== crossVerifyCode) { setCrossResetError("コードが違います"); return; }
    setCrossResetStep("newpwd");
    setCrossResetError(null);
  };

  const handleCrossResetSetPassword = async () => {
    if (!crossNewPwd || !crossConfirmPwd) return;
    if (crossNewPwd !== crossConfirmPwd) { setCrossResetError("パスワードが一致しません"); return; }
    if (crossNewPwd.length < 4) { setCrossResetError("パスワードは4文字以上で設定してください"); return; }
    setCrossResetError("saving");
    try {
      const hashed = await hashPassword(crossNewPwd);
      const updated = { ...crossResetUser, password: hashed };
      await saveUserToCloud(updated);
      setCrossResetStep("done");
      setCrossResetError(null);
    } catch {
      setCrossResetError("保存に失敗しました。もう一度お試しください");
    }
  };

  // Reset flow states
  const [resetMode, setResetMode] = useState(false);
  const [resetStep, setResetStep] = useState("email"); // "email" | "code" | "newpwd" | "done"
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState(null);
  const [codeInput, setCodeInput] = useState("");
  const [verifyCode, setVerifyCode] = useState(null);   // 生成した4桁コード（数字）
  const [codeExpiry, setCodeExpiry] = useState(null);   // 有効期限
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (isUserLocked) return;
    const hashed = await hashPassword(password);
    // ローカルハッシュ比較（新形式）または平文比較（旧形式の後方互換）
    const localMatch = savedUser.password === hashed || savedUser.password === password;
    if (localMatch) {
      localStorage.removeItem(USER_LOCK_KEY);
      setUserFails(0);
      setUserLockedUntil(null);
      onLogin();
      saveUserToCloud(savedUser);
      return;
    }
    // ローカルが一致しない場合はFirestoreで再確認（別デバイスでリセットされた場合に対応）
    const cloudResult = await fetchUserByCredentials(savedUser.email, password);
    if (cloudResult !== "not_found" && cloudResult !== "wrong_password" && cloudResult !== "error") {
      // Firestoreで一致 → ローカルを最新に更新してログイン
      localStorage.setItem("cp_user", JSON.stringify(cloudResult));
      if (onPasswordChange) onPasswordChange(cloudResult);
      localStorage.removeItem(USER_LOCK_KEY);
      setUserFails(0);
      setUserLockedUntil(null);
      onLogin();
      return;
    }
    const newFails = userFails + 1;
    setUserFails(newFails);
    if (newFails >= USER_MAX_FAILS) {
      const until = new Date(Date.now() + USER_LOCK_MINS * 60 * 1000);
      localStorage.setItem(USER_LOCK_KEY, JSON.stringify({ until: until.toISOString(), fails: newFails }));
      setUserLockedUntil(until);
    }
    setError(true);
    setPassword("");
  };

  const resetClear = () => {
    setResetMode(false);
    setResetStep("email");
    setResetEmail("");
    setResetError(null);
    setCodeInput("");
    setVerifyCode(null);
    setCodeExpiry(null);
    setNewPwd("");
    setConfirmPwd("");
  };

  // Step1: メール確認 → 4桁コード送信
  const handleSendCode = async () => {
    const email = resetEmail.trim();
    if (!email) return;
    if (savedUser.email !== email) { setResetError("メールアドレスが一致しません"); return; }

    setResetError("sending");
    const code = Math.floor(1000 + Math.random() * 9000); // 1000〜9999
    const result = await sendResetCode(email, savedUser.name, code);
    if (result === "sent") {
      setVerifyCode(code);
      setCodeExpiry(Date.now() + 10 * 60 * 1000); // 10分有効
      setResetStep("code");
      setResetError(null);
    } else if (result === "not_configured") {
      setResetError("メール送信が設定されていません");
    } else {
      setResetError("送信に失敗しました。もう一度お試しください");
    }
  };

  // Step2: コード確認
  const handleVerifyCode = () => {
    if (!codeInput) return;
    if (Date.now() > codeExpiry) { setResetError("コードの有効期限が切れました。最初からやり直してください"); return; }
    if (Number(codeInput) !== verifyCode) { setResetError("コードが違います"); return; }
    setResetStep("newpwd");
    setResetError(null);
  };

  // Step3: 新パスワード設定
  const handleSetNewPassword = async () => {
    const p1 = newPwd;
    const p2 = confirmPwd;
    if (!p1 || !p2) return;
    if (p1 !== p2) { setResetError("パスワードが一致しません"); return; }
    if (p1.length < 4) { setResetError("パスワードは4文字以上で設定してください"); return; }

    setResetError("saving");
    try {
      const hashed = await hashPassword(p1);
      const updated = { ...savedUser, password: hashed };
      localStorage.setItem("cp_user", JSON.stringify(updated));
      await saveUserToCloud(updated);
      if (onPasswordChange) onPasswordChange(updated);
      setResetStep("done");
      setResetError(null);
    } catch {
      setResetError("保存に失敗しました。もう一度お試しください");
    }
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
        <div style={{ width: "100%", maxWidth: 400, marginBottom: 12, position: "relative", zIndex: 10 }}>
          <LangDropdown />
        </div>
        <div style={{
          background: C.glassWhite,
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.35)",
          borderRadius: 20, maxWidth: 400, width: "100%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
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
            {!crossResetMode ? (
              <>
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
                    fontFamily: "inherit", marginBottom: 12,
                  }}
                >
                  {crossStatus === "loading" ? "..." : `🎫 ${t("login.btn")}`}
                </button>

                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  <button
                    onClick={() => setCrossResetMode(true)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: C.gray, fontSize: 12, fontFamily: "inherit",
                      textDecoration: "underline",
                    }}
                  >
                    {t("login.forgot")}
                  </button>
                </div>

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
              </>
            ) : (
              /* パスワードリセットパネル（別デバイス用） */
              <div style={{
                background: `${C.teal}08`, border: `1px solid ${C.tealLight}`,
                borderRadius: 12, padding: "16px", textAlign: "left",
              }}>
                {crossResetStep === "email" && (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.teal, marginBottom: 8 }}>
                      🔑 パスワード再設定
                    </div>
                    <div style={{ fontSize: 11, color: C.gray, marginBottom: 10, lineHeight: 1.5 }}>
                      登録メールアドレスに4桁の確認コードを送ります
                    </div>
                    <input
                      type="email"
                      value={crossResetEmail}
                      onChange={e => { setCrossResetEmail(e.target.value); setCrossResetError(null); }}
                      placeholder="example@email.com"
                      style={{
                        width: "100%", padding: "9px 12px", boxSizing: "border-box",
                        border: `1.5px solid ${crossResetError && crossResetError !== "sending" ? "#E74C3C" : C.lightGray}`,
                        borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 10,
                      }}
                    />
                    {crossResetError && crossResetError !== "sending" && (
                      <div style={{ fontSize: 12, color: "#E74C3C", marginBottom: 10, padding: "8px 10px", borderRadius: 8, background: "#E74C3C12" }}>
                        {crossResetError}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={handleCrossResetSendCode}
                        disabled={crossResetError === "sending"}
                        style={{
                          flex: 1, padding: "8px",
                          background: crossResetError === "sending" ? C.lightGray : C.teal,
                          color: C.white, border: "none", borderRadius: 8,
                          fontSize: 12, fontWeight: 700,
                          cursor: crossResetError === "sending" ? "default" : "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {crossResetError === "sending" ? "送信中..." : "📧 コードを送る"}
                      </button>
                      <button onClick={crossResetClear} style={{ flex: 1, padding: "8px", background: C.white, color: C.gray, border: `1px solid ${C.lightGray}`, borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                        キャンセル
                      </button>
                    </div>
                  </>
                )}

                {crossResetStep === "code" && (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.teal, marginBottom: 8 }}>📬 確認コードを入力</div>
                    <div style={{ fontSize: 11, color: C.gray, marginBottom: 10 }}>
                      メールに届いた4桁の数字を入力してください（10分以内）
                    </div>
                    <input
                      type="number" inputMode="numeric"
                      value={crossCodeInput}
                      onChange={e => { setCrossCodeInput(e.target.value); setCrossResetError(null); }}
                      placeholder="1234" maxLength={4}
                      style={{
                        width: "100%", padding: "12px", boxSizing: "border-box",
                        border: `1.5px solid ${crossResetError ? "#E74C3C" : C.lightGray}`,
                        borderRadius: 8, fontSize: 22, fontFamily: "monospace",
                        outline: "none", textAlign: "center", letterSpacing: 6, marginBottom: 10,
                      }}
                    />
                    {crossResetError && (
                      <div style={{ fontSize: 12, color: "#E74C3C", marginBottom: 10, padding: "8px 10px", borderRadius: 8, background: "#E74C3C12" }}>
                        {crossResetError}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <button onClick={handleCrossResetVerifyCode} style={{ flex: 1, padding: "8px", background: C.teal, color: C.white, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                        確認する →
                      </button>
                      <button onClick={crossResetClear} style={{ flex: 1, padding: "8px", background: C.white, color: C.gray, border: `1px solid ${C.lightGray}`, borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                        キャンセル
                      </button>
                    </div>
                    <button onClick={() => { setCrossResetStep("email"); setCrossResetError(null); setCrossCodeInput(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.gray, fontSize: 11, fontFamily: "inherit", textDecoration: "underline" }}>
                      コードを再送する
                    </button>
                  </>
                )}

                {crossResetStep === "newpwd" && (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.teal, marginBottom: 12 }}>🔒 新しいパスワードを設定</div>
                    <input
                      type="password" value={crossNewPwd}
                      onChange={e => { setCrossNewPwd(e.target.value); setCrossResetError(null); }}
                      placeholder="新しいパスワード（4文字以上）"
                      style={{ width: "100%", padding: "9px 12px", boxSizing: "border-box", border: `1.5px solid ${crossResetError ? "#E74C3C" : C.lightGray}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 8 }}
                    />
                    <input
                      type="password" value={crossConfirmPwd}
                      onChange={e => { setCrossConfirmPwd(e.target.value); setCrossResetError(null); }}
                      placeholder="もう一度入力"
                      style={{ width: "100%", padding: "9px 12px", boxSizing: "border-box", border: `1.5px solid ${crossResetError === "パスワードが一致しません" ? "#E74C3C" : C.lightGray}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 10 }}
                    />
                    {crossResetError && crossResetError !== "saving" && (
                      <div style={{ fontSize: 12, color: "#E74C3C", marginBottom: 10, padding: "8px 10px", borderRadius: 8, background: "#E74C3C12" }}>
                        {crossResetError}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={handleCrossResetSetPassword}
                        disabled={crossResetError === "saving"}
                        style={{ flex: 1, padding: "8px", background: crossResetError === "saving" ? C.lightGray : C.teal, color: C.white, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: crossResetError === "saving" ? "default" : "pointer", fontFamily: "inherit" }}
                      >
                        {crossResetError === "saving" ? "保存中..." : "✅ 変更する"}
                      </button>
                      <button onClick={crossResetClear} style={{ flex: 1, padding: "8px", background: C.white, color: C.gray, border: `1px solid ${C.lightGray}`, borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                        キャンセル
                      </button>
                    </div>
                  </>
                )}

                {crossResetStep === "done" && (
                  <>
                    <div style={{ textAlign: "center", padding: "8px 0 12px", fontSize: 13, color: "#27AE60", fontWeight: 700 }}>
                      ✅ パスワードを変更しました
                    </div>
                    <div style={{ fontSize: 11, color: C.gray, textAlign: "center", marginBottom: 12 }}>
                      新しいパスワードでログインしてください
                    </div>
                    <button
                      onClick={crossResetClear}
                      style={{ width: "100%", padding: "8px", background: C.teal, color: C.white, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      ログインページへ戻る
                    </button>
                  </>
                )}
              </div>
            )}
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
      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 10 }}>
        <LangDropdown />
      </div>

      <div style={{
        background: C.glassWhite,
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.35)",
        borderRadius: 20, maxWidth: 400, width: "100%",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
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

                {/* ── Step1: メールアドレス入力 ── */}
                {resetStep === "email" && (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.teal, marginBottom: 8 }}>
                      🔑 パスワード再設定
                    </div>
                    <div style={{ fontSize: 11, color: C.gray, marginBottom: 10, lineHeight: 1.5 }}>
                      登録メールアドレスに4桁の確認コードを送ります
                    </div>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={e => { setResetEmail(e.target.value); setResetError(null); }}
                      placeholder="example@email.com"
                      style={{
                        width: "100%", padding: "9px 12px", boxSizing: "border-box",
                        border: `1.5px solid ${resetError && resetError !== "sending" ? "#E74C3C" : C.lightGray}`,
                        borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none",
                        marginBottom: 10,
                      }}
                    />
                    {resetError && resetError !== "sending" && (
                      <div style={{ fontSize: 12, color: "#E74C3C", marginBottom: 10, padding: "8px 10px", borderRadius: 8, background: "#E74C3C12" }}>
                        {resetError}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={handleSendCode}
                        disabled={resetError === "sending"}
                        style={{
                          flex: 1, padding: "8px",
                          background: resetError === "sending" ? C.lightGray : C.teal,
                          color: C.white, border: "none", borderRadius: 8,
                          fontSize: 12, fontWeight: 700,
                          cursor: resetError === "sending" ? "default" : "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {resetError === "sending" ? "送信中..." : "📧 コードを送る"}
                      </button>
                      <button onClick={resetClear} style={{ flex: 1, padding: "8px", background: C.white, color: C.gray, border: `1px solid ${C.lightGray}`, borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                        {t("common.cancel")}
                      </button>
                    </div>
                  </>
                )}

                {/* ── Step2: コード確認 ── */}
                {resetStep === "code" && (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.teal, marginBottom: 8 }}>
                      📬 確認コードを入力
                    </div>
                    <div style={{ fontSize: 11, color: C.gray, marginBottom: 10, lineHeight: 1.5 }}>
                      メールに届いた4桁の数字を入力してください（10分以内）
                    </div>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={codeInput}
                      onChange={e => { setCodeInput(e.target.value); setResetError(null); }}
                      placeholder="1234"
                      maxLength={4}
                      style={{
                        width: "100%", padding: "12px", boxSizing: "border-box",
                        border: `1.5px solid ${resetError ? "#E74C3C" : C.lightGray}`,
                        borderRadius: 8, fontSize: 22, fontFamily: "monospace",
                        outline: "none", textAlign: "center", letterSpacing: 6,
                        marginBottom: 10,
                      }}
                    />
                    {resetError && (
                      <div style={{ fontSize: 12, color: "#E74C3C", marginBottom: 10, padding: "8px 10px", borderRadius: 8, background: "#E74C3C12" }}>
                        {resetError}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <button
                        onClick={handleVerifyCode}
                        style={{ flex: 1, padding: "8px", background: C.teal, color: C.white, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                      >
                        確認する →
                      </button>
                      <button onClick={resetClear} style={{ flex: 1, padding: "8px", background: C.white, color: C.gray, border: `1px solid ${C.lightGray}`, borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                        {t("common.cancel")}
                      </button>
                    </div>
                    <button
                      onClick={() => { setResetStep("email"); setResetError(null); setCodeInput(""); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: C.gray, fontSize: 11, fontFamily: "inherit", textDecoration: "underline" }}
                    >
                      コードを再送する
                    </button>
                  </>
                )}

                {/* ── Step3: 新パスワード設定 ── */}
                {resetStep === "newpwd" && (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.teal, marginBottom: 12 }}>
                      🔒 新しいパスワードを設定
                    </div>
                    <input
                      type="password"
                      value={newPwd}
                      onChange={e => { setNewPwd(e.target.value); setResetError(null); }}
                      placeholder="新しいパスワード（4文字以上）"
                      style={{
                        width: "100%", padding: "9px 12px", boxSizing: "border-box",
                        border: `1.5px solid ${resetError ? "#E74C3C" : C.lightGray}`,
                        borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 8,
                      }}
                    />
                    <input
                      type="password"
                      value={confirmPwd}
                      onChange={e => { setConfirmPwd(e.target.value); setResetError(null); }}
                      placeholder="もう一度入力"
                      style={{
                        width: "100%", padding: "9px 12px", boxSizing: "border-box",
                        border: `1.5px solid ${resetError === "パスワードが一致しません" ? "#E74C3C" : C.lightGray}`,
                        borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 10,
                      }}
                    />
                    {resetError && resetError !== "saving" && (
                      <div style={{ fontSize: 12, color: "#E74C3C", marginBottom: 10, padding: "8px 10px", borderRadius: 8, background: "#E74C3C12" }}>
                        {resetError}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={handleSetNewPassword}
                        disabled={resetError === "saving"}
                        style={{ flex: 1, padding: "8px", background: resetError === "saving" ? C.lightGray : C.teal, color: C.white, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: resetError === "saving" ? "default" : "pointer", fontFamily: "inherit" }}
                      >
                        {resetError === "saving" ? "保存中..." : "✅ 変更する"}
                      </button>
                      <button onClick={resetClear} style={{ flex: 1, padding: "8px", background: C.white, color: C.gray, border: `1px solid ${C.lightGray}`, borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                        {t("common.cancel")}
                      </button>
                    </div>
                  </>
                )}

                {/* ── 完了 ── */}
                {resetStep === "done" && (
                  <>
                    <div style={{ textAlign: "center", padding: "8px 0 12px", fontSize: 13, color: "#27AE60", fontWeight: 700 }}>
                      ✅ パスワードを変更しました
                    </div>
                    <button
                      onClick={resetClear}
                      style={{ width: "100%", padding: "8px", background: C.teal, color: C.white, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      ログインページへ戻る
                    </button>
                  </>
                )}

                {/* Delete account link */}
                {resetStep !== "done" && (
                  <div style={{ textAlign: "center", marginTop: 12 }}>
                    <button
                      onClick={() => { resetClear(); setShowDeleteConfirm(true); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#E74C3C", fontSize: 11, fontFamily: "inherit", textDecoration: "underline", opacity: 0.7 }}
                    >
                      {t("login.reset_title")}
                    </button>
                  </div>
                )}
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
