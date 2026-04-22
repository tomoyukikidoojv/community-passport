import { useState } from "react";
import { C, USERS } from "../constants";
import { useLang } from "../i18n/LangContext";
import LangDropdown from "../components/LangDropdown";
import COUNTRIES from "../i18n/countries";
import WORLD_LANGUAGES from "../i18n/languages-list";

const ACTIVITY_KEYS = [
  "event", "interpret", "children", "education",
  "cultural", "sports", "cooking", "music", "arts", "community", "others",
];

const inputStyle = {
  width: "100%", padding: "10px 14px",
  border: `1.5px solid ${C.lightGray}`,
  borderRadius: 8, fontSize: 14, color: C.charcoal,
  fontFamily: "inherit", outline: "none",
  background: C.white, boxSizing: "border-box",
  transition: "border-color 0.2s",
};

function SectionHeader({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: 2,
      color: C.teal, textTransform: "uppercase",
      borderBottom: `2px solid ${C.tealLight}`,
      paddingBottom: 6, marginBottom: 16, marginTop: 4,
    }}>{children}</div>
  );
}

export default function RegisterPage({ onRegistered }) {
  const { t, lang } = useLang();
  const [form, setForm] = useState({
    name: "",
    dob: "",
    country: "",
    email: "",
    phone: "",
    languages: [],
    volunteer: "",
    activities: [],
    password: "",
    passwordConfirm: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [newUser, setNewUser] = useState(null);
  const [countrySearch, setCountrySearch] = useState("");

  const set = k => e => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors(er => ({ ...er, [k]: null }));
  };

  const toggleLang = (code) => {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(code)
        ? f.languages.filter(l => l !== code)
        : [...f.languages, code],
    }));
    if (errors.languages) setErrors(er => ({ ...er, languages: null }));
  };

  const toggleActivity = (key) => {
    setForm(f => ({
      ...f,
      activities: f.activities.includes(key)
        ? f.activities.filter(a => a !== key)
        : [...f.activities, key],
    }));
  };

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const validate = () => {
    const errs = {};
    if (!form.name.trim())           errs.name      = t("register.err_name");
    if (!form.dob)                   errs.dob       = t("register.err_required");
    if (!form.country)               errs.country   = t("register.err_country");
    if (!form.email.trim())          errs.email     = t("register.err_required");
    if (!form.phone.trim())          errs.phone     = t("register.err_required");
    if (form.languages.length === 0) errs.languages = t("register.err_languages");
    if (!form.volunteer)             errs.volunteer = t("register.err_required");
    if (form.password.length < 4)   errs.password  = t("register.err_password");
    if (form.password !== form.passwordConfirm) errs.passwordConfirm = t("register.err_password_match");
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const countryObj = COUNTRIES.find(c => c.code === form.country);
    const langLabels = form.languages.map(code =>
      WORLD_LANGUAGES.find(l => l.code === code)?.name || code
    );

    const user = {
      id: Date.now(),
      name: form.name,
      nameEn: form.name,
      no: `2026-${String(Date.now()).slice(-4)}`,
      flag: countryObj?.flag || "🌍",
      country: countryObj || { code: "XX", name: form.country, flag: "🌍" },
      languages: langLabels,
      since: new Date().toLocaleDateString(lang === "ja" ? "ja-JP" : "en-US", { year: "numeric", month: "long" }),
      dob: form.dob || "",
      email: form.email.trim() || "",
      phone: form.phone.trim() || "",
      volunteer: form.volunteer || "",
      activities: form.activities,
      password: form.password,
    };
    setNewUser(user);
    setSubmitted(true);
  };

  // ── Success screen ─────────────────────────────────────
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
            <div style={{ color: C.white, fontSize: 20, fontWeight: 800 }}>
              {t("register.success_title")}
            </div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 }}>
              {t("register.success_sub")}
            </div>
          </div>

          <div style={{ padding: "28px 32px 24px" }}>
            <div style={{
              border: `2px solid ${C.tealLight}`, borderRadius: 14,
              padding: "18px 20px", background: C.offWhite, marginBottom: 24,
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
                }}>{newUser.flag}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: C.teal }}>{newUser.name}</div>
                  <div style={{ color: C.gray, fontSize: 12, marginTop: 2 }}>{newUser.country?.name}</div>
                  <div style={{
                    display: "inline-block", marginTop: 6,
                    background: `${C.gray}15`, borderRadius: 20,
                    padding: "2px 10px", fontSize: 11, color: C.gray,
                  }}>No. {newUser.no}</div>
                </div>
              </div>
              <div style={{
                marginTop: 14, paddingTop: 14,
                borderTop: `1px solid ${C.lightGray}`,
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
              }}>
                {[
                  [t("register.success_since"), newUser.since],
                  [t("register.success_languages"), newUser.languages.join(", ")],
                  [t("register.success_level"), "🌱 Newcomer"],
                ].map(([k, v]) => (
                  <div key={k} style={{ gridColumn: k === t("register.success_languages") ? "span 2" : "auto" }}>
                    <div style={{ fontSize: 10, color: C.gray }}>{k}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.charcoal }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => onRegistered(newUser)}
              style={{
                width: "100%", padding: "14px",
                background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
                color: C.white, border: "none", borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >{t("register.success_btn")}</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${C.teal} 0%, ${C.navy} 100%)`,
      padding: "28px 16px 48px",
      fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
    }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        <LangDropdown />

        <div style={{ textAlign: "center", color: C.white, marginBottom: 28 }}>
          <div style={{ fontSize: 11, letterSpacing: 5, opacity: 0.6, marginBottom: 4 }}>
            MEMBER REGISTRATION
          </div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>📝 {t("register.title")}</div>
          <div style={{ fontSize: 12, opacity: 0.5, marginTop: 3 }}>
            {t("register.subtitle")}
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
                {t("register.header")}
              </div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>
                {t("register.subtitle")}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: "28px 28px 24px" }}>

            {/* ── 基本情報 ── */}
            <SectionHeader>👤 Personal Info</SectionHeader>

            {/* Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>
                {t("register.name")} <span style={{ color: "#E74C3C" }}>*</span>
              </label>
              <input
                type="text" value={form.name} onChange={set("name")}
                placeholder={t("register.name_placeholder")}
                style={{ ...inputStyle, borderColor: errors.name ? "#E74C3C" : C.lightGray }}
              />
              {errors.name && <div style={{ color: "#E74C3C", fontSize: 11, marginTop: 4 }}>{errors.name}</div>}
            </div>

            {/* DOB + Country side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>
                  {t("register.dob")} <span style={{ color: "#E74C3C" }}>*</span>
                </label>
                <input
                  type="date" value={form.dob} onChange={set("dob")}
                  style={{ ...inputStyle, borderColor: errors.dob ? "#E74C3C" : C.lightGray }}
                />
                {errors.dob && <div style={{ color: "#E74C3C", fontSize: 11, marginTop: 4 }}>{errors.dob}</div>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>
                  {t("register.country")} <span style={{ color: "#E74C3C" }}>*</span>
                </label>
                <input
                  type="text"
                  value={countrySearch}
                  onChange={e => { setCountrySearch(e.target.value); setForm(f => ({ ...f, country: "" })); }}
                  placeholder={t("register.country_placeholder")}
                  style={{ ...inputStyle, borderColor: errors.country ? "#E74C3C" : C.lightGray }}
                />
                {countrySearch && (
                  <div style={{
                    maxHeight: 180, overflowY: "auto",
                    border: `1.5px solid ${C.tealLight}`, borderRadius: 8,
                    background: C.white, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    position: "absolute", zIndex: 10, width: "calc(50% - 44px)",
                  }}>
                    {filteredCountries.slice(0, 30).map(c => (
                      <div
                        key={c.code}
                        onClick={() => {
                          setForm(f => ({ ...f, country: c.code }));
                          setCountrySearch(`${c.flag} ${c.name}`);
                          setErrors(er => ({ ...er, country: null }));
                        }}
                        style={{
                          padding: "7px 12px", cursor: "pointer", fontSize: 13,
                          background: form.country === c.code ? C.tealPale : C.white,
                          display: "flex", alignItems: "center", gap: 6,
                        }}
                      >
                        <span>{c.flag}</span> {c.name}
                      </div>
                    ))}
                    {filteredCountries.length === 0 && (
                      <div style={{ padding: "10px 14px", color: C.gray, fontSize: 13 }}>—</div>
                    )}
                  </div>
                )}
                {errors.country && <div style={{ color: "#E74C3C", fontSize: 11, marginTop: 4 }}>{errors.country}</div>}
              </div>
            </div>

            {/* Email + Phone */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>
                  {t("register.email")} <span style={{ color: "#E74C3C" }}>*</span>
                </label>
                <input
                  type="email" value={form.email} onChange={set("email")}
                  placeholder={t("register.email_placeholder")}
                  style={{ ...inputStyle, borderColor: errors.email ? "#E74C3C" : C.lightGray }}
                />
                {errors.email && <div style={{ color: "#E74C3C", fontSize: 11, marginTop: 4 }}>{errors.email}</div>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>
                  {t("register.phone")} <span style={{ color: "#E74C3C" }}>*</span>
                </label>
                <input
                  type="tel" value={form.phone} onChange={e => {
                    // ハイフンなし・数字のみ
                    set("phone")({ target: { value: e.target.value.replace(/[^\d+]/g, "") } });
                  }}
                  placeholder="09012345678"
                  maxLength={15}
                  style={{ ...inputStyle, borderColor: errors.phone ? "#E74C3C" : C.lightGray }}
                />
                {errors.phone && <div style={{ color: "#E74C3C", fontSize: 11, marginTop: 4 }}>{errors.phone}</div>}
              </div>
            </div>

            {/* ── 言語 ── */}
            <SectionHeader>🌐 Languages</SectionHeader>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 4 }}>
                {t("register.languages")} <span style={{ color: "#E74C3C" }}>*</span>
                <span style={{ fontSize: 11, fontWeight: 400, color: C.gray, marginLeft: 8 }}>
                  {t("register.languages_hint")}
                </span>
              </label>
              <div style={{
                border: `1.5px solid ${errors.languages ? "#E74C3C" : C.lightGray}`,
                borderRadius: 8, padding: "12px",
                maxHeight: 200, overflowY: "auto",
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6,
              }}>
                {WORLD_LANGUAGES.map(wl => {
                  const selected = form.languages.includes(wl.code);
                  return (
                    <label key={wl.code} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 10px", borderRadius: 8, cursor: "pointer",
                      background: selected ? C.tealPale : "transparent",
                      border: `1px solid ${selected ? C.tealLight : "transparent"}`,
                      transition: "all 0.12s",
                    }}>
                      <input
                        type="checkbox" checked={selected}
                        onChange={() => toggleLang(wl.code)}
                        style={{ accentColor: C.teal, flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 12, color: selected ? C.teal : C.charcoal, fontWeight: selected ? 700 : 400 }}>
                        {wl.name}
                      </span>
                    </label>
                  );
                })}
              </div>
              {form.languages.length > 0 && (
                <div style={{ fontSize: 11, color: C.teal, marginTop: 5 }}>
                  ✓ {t("register.selected", { n: form.languages.length })}
                </div>
              )}
              {errors.languages && <div style={{ color: "#E74C3C", fontSize: 11, marginTop: 4 }}>{errors.languages}</div>}
            </div>

            {/* ── ボランティア ── */}
            <SectionHeader>🤝 Volunteer</SectionHeader>

            {/* Volunteer interest */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 10 }}>
                {t("register.volunteer_q")}
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { val: "yes", label: t("register.volunteer_yes") },
                  { val: "no",  label: t("register.volunteer_no") },
                ].map(opt => (
                  <label key={opt.val} style={{
                    flex: 1, display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                    border: `1.5px solid ${form.volunteer === opt.val ? C.teal : errors.volunteer ? "#E74C3C" : C.lightGray}`,
                    background: form.volunteer === opt.val ? C.tealPale : C.white,
                    transition: "all 0.15s",
                  }}>
                    <input
                      type="radio" name="volunteer" value={opt.val}
                      checked={form.volunteer === opt.val}
                      onChange={e => { set("volunteer")(e); setErrors(er => ({ ...er, volunteer: null })); }}
                      style={{ accentColor: C.teal }}
                    />
                    <span style={{
                      fontSize: 13, fontWeight: form.volunteer === opt.val ? 700 : 400,
                      color: form.volunteer === opt.val ? C.teal : C.charcoal,
                    }}>{opt.label}</span>
                  </label>
                ))}
              </div>
              {errors.volunteer && <div style={{ color: "#E74C3C", fontSize: 11, marginTop: 6 }}>{errors.volunteer}</div>}
            </div>

            {/* Activities */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 4 }}>
                {t("register.activities")}
                <span style={{ fontSize: 11, fontWeight: 400, color: C.gray, marginLeft: 8 }}>
                  {t("register.activities_hint")}
                </span>
              </label>
              <div style={{
                border: `1.5px solid ${C.lightGray}`, borderRadius: 8, padding: "12px",
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6,
              }}>
                {ACTIVITY_KEYS.map(key => {
                  const selected = form.activities.includes(key);
                  return (
                    <label key={key} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 10px", borderRadius: 8, cursor: "pointer",
                      background: selected ? `${C.teal}12` : "transparent",
                      border: `1px solid ${selected ? C.teal + "50" : "transparent"}`,
                      transition: "all 0.12s",
                    }}>
                      <input
                        type="checkbox" checked={selected}
                        onChange={() => toggleActivity(key)}
                        style={{ accentColor: C.teal, flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 12, color: selected ? C.teal : C.charcoal, fontWeight: selected ? 700 : 400, lineHeight: 1.3 }}>
                        {t(`register.act.${key}`)}
                      </span>
                    </label>
                  );
                })}
              </div>
              {form.activities.length > 0 && (
                <div style={{ fontSize: 11, color: C.teal, marginTop: 5 }}>
                  ✓ {form.activities.length} selected
                </div>
              )}
            </div>

            {/* ── パスワード ── */}
            <SectionHeader>🔑 Password</SectionHeader>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>
                  {t("register.password")} <span style={{ color: "#E74C3C" }}>*</span>
                </label>
                <input
                  type="password" value={form.password} onChange={set("password")}
                  placeholder={t("register.password_placeholder")}
                  style={{ ...inputStyle, borderColor: errors.password ? "#E74C3C" : C.lightGray }}
                />
                {errors.password && <div style={{ color: "#E74C3C", fontSize: 11, marginTop: 4 }}>{errors.password}</div>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>
                  {t("register.password_confirm")} <span style={{ color: "#E74C3C" }}>*</span>
                </label>
                <input
                  type="password" value={form.passwordConfirm} onChange={set("passwordConfirm")}
                  placeholder={t("register.password_confirm_placeholder")}
                  style={{ ...inputStyle, borderColor: errors.passwordConfirm ? "#E74C3C" : C.lightGray }}
                />
                {errors.passwordConfirm && <div style={{ color: "#E74C3C", fontSize: 11, marginTop: 4 }}>{errors.passwordConfirm}</div>}
              </div>
            </div>

            <div style={{ borderTop: `1px dashed ${C.lightGray}`, margin: "20px 0" }} />

            <div style={{
              background: C.goldLight, border: `1px solid ${C.gold}30`,
              borderLeft: `4px solid ${C.gold}`,
              borderRadius: 8, padding: "10px 14px", marginBottom: 22,
              fontSize: 12, color: C.charcoal, lineHeight: 1.6,
              whiteSpace: "pre-line",
            }}>
              {t("register.note")}
            </div>

            <button
              type="submit"
              style={{
                width: "100%", padding: "14px",
                background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
                color: C.white, border: "none", borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit", boxShadow: `0 4px 16px ${C.teal}40`,
              }}
            >
              {t("register.submit")}
            </button>

            <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: C.gray }}>
              <span style={{ color: "#E74C3C" }}>*</span> {t("register.required_note")}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
