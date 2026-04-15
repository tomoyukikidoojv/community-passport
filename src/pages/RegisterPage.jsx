import { useState } from "react";
import { C, USERS } from "../constants";

const COUNTRIES = [
  { flag: "🇯🇵", name: "日本",       lang: "日本語" },
  { flag: "🇧🇷", name: "ブラジル",   lang: "ポルトガル語" },
  { flag: "🇨🇳", name: "中国",       lang: "中国語（普通話）" },
  { flag: "🇺🇸", name: "アメリカ",   lang: "英語" },
  { flag: "🇪🇬", name: "エジプト",   lang: "アラビア語" },
  { flag: "🇲🇽", name: "メキシコ",   lang: "スペイン語" },
  { flag: "🇵🇭", name: "フィリピン", lang: "タガログ語" },
  { flag: "🇻🇳", name: "ベトナム",   lang: "ベトナム語" },
  { flag: "🇰🇷", name: "韓国",       lang: "韓国語" },
  { flag: "🇮🇳", name: "インド",     lang: "ヒンディー語" },
  { flag: "🌍", name: "その他",       lang: "その他" },
];

const YEARS = ["〜1年", "1〜3年", "3〜5年", "5〜10年", "10年以上"];

function Field({ label, labelEn, required, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: "block", marginBottom: 6,
        fontSize: 13, fontWeight: 700, color: C.charcoal,
      }}>
        {label}
        {labelEn && (
          <span style={{ fontWeight: 400, color: C.gray, marginLeft: 8, fontSize: 11 }}>
            {labelEn}
          </span>
        )}
        {required && (
          <span style={{ color: "#E74C3C", marginLeft: 4, fontSize: 12 }}>*</span>
        )}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 14px",
  border: `1.5px solid ${C.lightGray}`,
  borderRadius: 8, fontSize: 14, color: C.charcoal,
  fontFamily: "inherit", outline: "none",
  background: C.white, boxSizing: "border-box",
  transition: "border-color 0.2s",
};

export default function RegisterPage({ onRegistered }) {
  const [form, setForm] = useState({
    nameJa: "", nameEn: "", email: "",
    country: "", years: "", lang: "",
    password: "", passwordConfirm: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [newUser, setNewUser] = useState(null);

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors(er => ({ ...er, [k]: null }));

    if (k === "country") {
      const found = COUNTRIES.find(c => c.flag + " " + c.name === e.target.value);
      if (found) setForm(f => ({ ...f, country: e.target.value, lang: found.lang }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.nameJa.trim())                   errs.nameJa         = "お名前を入力してください";
    if (!form.nameEn.trim())                   errs.nameEn         = "Enter your name in English";
    if (!form.email.includes("@"))             errs.email          = "有効なメールアドレスを入力してください";
    if (!form.country)                         errs.country        = "国籍を選択してください";
    if (!form.years)                           errs.years          = "在住歴を選択してください";
    if (form.password.length < 4)              errs.password       = "4文字以上で設定してください";
    if (form.password !== form.passwordConfirm) errs.passwordConfirm = "パスワードが一致しません";
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const countryObj = COUNTRIES.find(c => c.flag + " " + c.name === form.country);
    const user = {
      id: USERS.length + 1,
      name: form.nameJa,
      nameEn: form.nameEn,
      no: `2026-00${48 + USERS.length}`,
      flag: countryObj?.flag || "🌍",
      since: "2026年" + new Date().toLocaleString("ja-JP", { month: "long" }),
      lang: form.lang,
      years: form.years,
      password: form.password,
    };
    setNewUser(user);
    setSubmitted(true);
  };

  // ── Success screen ────────────────────────────────────
  if (submitted && newUser) {
    return (
      <div style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${C.teal} 0%, ${C.navy} 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "32px 16px",
        fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
      }}>
        <div style={{
          background: C.white, borderRadius: 20, maxWidth: 480, width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden",
          textAlign: "center",
        }}>
          <div style={{
            background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
            padding: "28px 24px 24px",
          }}>
            <div style={{ fontSize: 52, marginBottom: 8 }}>🎉</div>
            <div style={{ color: C.white, fontSize: 20, fontWeight: 800, letterSpacing: 1 }}>
              登録完了！
            </div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 }}>
              Registration complete
            </div>
          </div>

          <div style={{ padding: "28px 32px 24px" }}>
            <div style={{
              border: `2px solid ${C.tealLight}`,
              borderRadius: 14, padding: "18px 20px",
              background: C.offWhite, marginBottom: 24,
              textAlign: "left",
            }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: C.gray, marginBottom: 10 }}>
                COMMUNITY PASSPORT
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: C.goldLight, border: `3px solid ${C.gold}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, flexShrink: 0,
                }}>
                  {newUser.flag}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: C.teal }}>
                    {newUser.name}
                  </div>
                  <div style={{ color: C.gray, fontSize: 12, marginTop: 2 }}>
                    {newUser.nameEn}
                  </div>
                  <div style={{
                    display: "inline-block", marginTop: 6,
                    background: `${C.gray}15`, borderRadius: 20,
                    padding: "2px 10px", fontSize: 11, color: C.gray,
                  }}>
                    No. {newUser.no}
                  </div>
                </div>
              </div>
              <div style={{
                marginTop: 14, paddingTop: 14,
                borderTop: `1px solid ${C.lightGray}`,
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
              }}>
                {[
                  ["登録日", newUser.since],
                  ["在住歴", newUser.years],
                  ["母語",   newUser.lang || "—"],
                  ["レベル", "🌱 Newcomer"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 10, color: C.gray }}>{k}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.charcoal }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <p style={{ color: C.gray, fontSize: 13, margin: "0 0 20px" }}>
              イベントに参加するたびにスタンプが押されます。<br />
              まずはマイパスポートを確認してみましょう！
            </p>

            <button
              onClick={() => onRegistered(newUser)}
              style={{
                width: "100%", padding: "14px",
                background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
                color: C.white, border: "none", borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit", letterSpacing: 0.5,
              }}
            >
              🎫 マイパスポートを見る →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${C.teal} 0%, ${C.navy} 100%)`,
      padding: "28px 16px 48px",
      fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
    }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        <div style={{ textAlign: "center", color: C.white, marginBottom: 28 }}>
          <div style={{ fontSize: 11, letterSpacing: 5, opacity: 0.6, marginBottom: 4 }}>
            MEMBER REGISTRATION
          </div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>📝 参加者登録</div>
          <div style={{ fontSize: 12, opacity: 0.5, marginTop: 3 }}>
            コミュニティパスポートを発行します
          </div>
        </div>

        <div style={{
          background: C.white, borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden",
        }}>
          <div style={{
            background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
            padding: "16px 28px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: C.goldLight, border: `2px solid ${C.gold}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
            }}>📋</div>
            <div>
              <div style={{ color: C.white, fontWeight: 700, fontSize: 14 }}>
                新規メンバー登録
              </div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>
                New member registration
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: "28px 28px 24px" }}>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="お名前" labelEn="Name" required>
                <input
                  type="text" value={form.nameJa} onChange={set("nameJa")}
                  placeholder="山田 花子"
                  onFocus={() => setFocusedField("nameJa")}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    ...inputStyle,
                    borderColor: errors.nameJa ? "#E74C3C"
                      : focusedField === "nameJa" ? C.teal : C.lightGray,
                  }}
                />
                {errors.nameJa && (
                  <div style={{ color: "#E74C3C", fontSize: 11, marginTop: 4 }}>{errors.nameJa}</div>
                )}
              </Field>
              <Field label="ローマ字" labelEn="English name" required>
                <input
                  type="text" value={form.nameEn} onChange={set("nameEn")}
                  placeholder="Hanako Yamada"
                  onFocus={() => setFocusedField("nameEn")}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    ...inputStyle,
                    borderColor: errors.nameEn ? "#E74C3C"
                      : focusedField === "nameEn" ? C.teal : C.lightGray,
                  }}
                />
                {errors.nameEn && (
                  <div style={{ color: "#E74C3C", fontSize: 11, marginTop: 4 }}>{errors.nameEn}</div>
                )}
              </Field>
            </div>

            <Field label="メールアドレス" labelEn="Email address" required>
              <input
                type="email" value={form.email} onChange={set("email")}
                placeholder="hanako@example.com"
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                style={{
                  ...inputStyle,
                  borderColor: errors.email ? "#E74C3C"
                    : focusedField === "email" ? C.teal : C.lightGray,
                }}
              />
              {errors.email && (
                <div style={{ color: "#E74C3C", fontSize: 11, marginTop: 4 }}>{errors.email}</div>
              )}
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="国籍" labelEn="Nationality" required>
                <select
                  value={form.country} onChange={set("country")}
                  onFocus={() => setFocusedField("country")}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    ...inputStyle,
                    borderColor: errors.country ? "#E74C3C"
                      : focusedField === "country" ? C.teal : C.lightGray,
                    appearance: "none", cursor: "pointer",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%237F8C8D' d='M6 8L0 0h12z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                    paddingRight: 32,
                  }}
                >
                  <option value="">選択してください</option>
                  {COUNTRIES.map(c => (
                    <option key={c.name} value={`${c.flag} ${c.name}`}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <div style={{ color: "#E74C3C", fontSize: 11, marginTop: 4 }}>{errors.country}</div>
                )}
              </Field>
              <Field label="芦屋市在住歴" labelEn="Years in Ashiya" required>
                <select
                  value={form.years} onChange={set("years")}
                  onFocus={() => setFocusedField("years")}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    ...inputStyle,
                    borderColor: errors.years ? "#E74C3C"
                      : focusedField === "years" ? C.teal : C.lightGray,
                    appearance: "none", cursor: "pointer",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%237F8C8D' d='M6 8L0 0h12z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                    paddingRight: 32,
                  }}
                >
                  <option value="">選択してください</option>
                  {YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                {errors.years && (
                  <div style={{ color: "#E74C3C", fontSize: 11, marginTop: 4 }}>{errors.years}</div>
                )}
              </Field>
            </div>

            <Field label="母語" labelEn="Mother tongue">
              <input
                type="text" value={form.lang} onChange={set("lang")}
                placeholder="国籍を選択すると自動入力されます"
                onFocus={() => setFocusedField("lang")}
                onBlur={() => setFocusedField(null)}
                style={{
                  ...inputStyle,
                  borderColor: focusedField === "lang" ? C.teal : C.lightGray,
                  background: form.lang ? C.tealPale : C.white,
                  color: form.lang ? C.teal : C.charcoal,
                }}
              />
            </Field>

            {/* Password */}
            <div style={{ margin: "4px 0 16px", borderTop: `1px dashed ${C.lightGray}` }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="パスワード" labelEn="Password" required>
                <input
                  type="password" value={form.password} onChange={set("password")}
                  placeholder="4文字以上"
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    ...inputStyle,
                    borderColor: errors.password ? "#E74C3C"
                      : focusedField === "password" ? C.teal : C.lightGray,
                  }}
                />
                {errors.password && (
                  <div style={{ color: "#E74C3C", fontSize: 11, marginTop: 4 }}>{errors.password}</div>
                )}
              </Field>
              <Field label="パスワード確認" labelEn="Confirm" required>
                <input
                  type="password" value={form.passwordConfirm} onChange={set("passwordConfirm")}
                  placeholder="もう一度入力"
                  onFocus={() => setFocusedField("passwordConfirm")}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    ...inputStyle,
                    borderColor: errors.passwordConfirm ? "#E74C3C"
                      : focusedField === "passwordConfirm" ? C.teal : C.lightGray,
                  }}
                />
                {errors.passwordConfirm && (
                  <div style={{ color: "#E74C3C", fontSize: 11, marginTop: 4 }}>{errors.passwordConfirm}</div>
                )}
              </Field>
            </div>

            <div style={{ margin: "4px 0 20px", borderTop: `1px dashed ${C.lightGray}` }} />

            <div style={{
              background: C.goldLight, border: `1px solid ${C.gold}30`,
              borderLeft: `4px solid ${C.gold}`,
              borderRadius: 8, padding: "10px 14px", marginBottom: 22,
              fontSize: 12, color: C.charcoal, lineHeight: 1.6,
            }}>
              📌 登録後、QRコード付きのコミュニティパスポートが発行されます。<br />
              イベント会場でQRコードを提示するとスタンプが押されます。
            </div>

            <button
              type="submit"
              style={{
                width: "100%", padding: "14px",
                background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
                color: C.white, border: "none", borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit", letterSpacing: 0.5,
                boxShadow: `0 4px 16px ${C.teal}40`,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              パスポートを発行する →
            </button>

            <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: C.gray }}>
              <span style={{ color: "#E74C3C" }}>*</span> は必須項目です
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
