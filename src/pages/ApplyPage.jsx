import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { C } from "../constants";
import { useEvents } from "../hooks/useEvents";
import { getForm, isFormActive } from "../lib/formStorage";

const APPLY_KEY = "cp_applications";

function loadApplications() {
  try { return JSON.parse(localStorage.getItem(APPLY_KEY)) || []; }
  catch { return []; }
}

function saveApplication(app) {
  const all = loadApplications();
  // Update if already applied, otherwise add new
  const idx = all.findIndex(a => a.eventId === app.eventId && a.userId === app.userId);
  if (idx >= 0) all[idx] = app;
  else all.push(app);
  localStorage.setItem(APPLY_KEY, JSON.stringify(all));
}

export function getApplication(eventId, userId) {
  return loadApplications().find(a => a.eventId === eventId && a.userId === userId) || null;
}

export function getApplicationsByEvent(eventId) {
  return loadApplications().filter(a => a.eventId === eventId);
}

const COUNTS = ["1人", "2人", "3人", "4人", "5人以上"];

export default function ApplyPage({ user }) {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const events = useEvents();
  const event = events.find(e => e.id === Number(eventId));

  const existing = event && user ? getApplication(event.id, user.id) : null;
  const formConfig = event ? getForm(event.id) : null;
  const active = event ? isFormActive(event.id) : false;

  const [form, setForm] = useState({
    name: user?.name || "",
    nameEn: user?.nameEn || "",
    email: "",
    count: "1人",
    comment: "",
    answers: {},
  });
  const [submitted, setSubmitted] = useState(!!existing);
  const [errors, setErrors] = useState({});

  const center = (content) => (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${C.teal} 0%, ${C.navy} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px 16px",
      fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
    }}>
      <div style={{
        background: C.white, borderRadius: 16, maxWidth: 420, width: "100%",
        padding: "36px 28px", textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {content}
        <button
          onClick={() => navigate("/calendar")}
          style={{
            marginTop: 20, padding: "10px 28px",
            background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
            color: C.white, border: "none", borderRadius: 8,
            fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}
        >カレンダーに戻る</button>
      </div>
    </div>
  );

  if (!event) return center(<><div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div><div style={{ fontWeight: 700, color: C.charcoal }}>イベントが見つかりません</div></>);
  if (!formConfig) return center(<><div style={{ fontSize: 36, marginBottom: 10 }}>🛠️</div><div style={{ fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>申し込みフォーム準備中</div><div style={{ fontSize: 13, color: C.gray }}>まだフォームが作成されていません</div></>);
  if (!active) {
    const now = new Date();
    const notYet = formConfig.openDate && new Date(formConfig.openDate) > now;
    return center(<>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{notYet ? "⏳" : "🔒"}</div>
      <div style={{ fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>
        {notYet ? "受付開始前です" : "受付は終了しました"}
      </div>
      {notYet && formConfig.openDate && (
        <div style={{ fontSize: 13, color: C.gray }}>
          受付開始：{formConfig.openDate}
        </div>
      )}
    </>);
  }

  const isPast = new Date(event.fullDate) < new Date(new Date().toDateString());

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors(er => ({ ...er, [k]: null }));
  };

  const setAnswer = (qId, value) => {
    setForm(f => ({ ...f, answers: { ...f.answers, [qId]: value } }));
    if (errors[`q_${qId}`]) setErrors(er => ({ ...er, [`q_${qId}`]: null }));
  };

  const toggleCheckbox = (qId, option) => {
    const cur = form.answers[qId] || [];
    const next = cur.includes(option) ? cur.filter(o => o !== option) : [...cur, option];
    setAnswer(qId, next);
    if (errors[`q_${qId}`]) setErrors(er => ({ ...er, [`q_${qId}`]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "お名前を入力してください";
    (formConfig.questions || []).forEach(q => {
      if (!q.required) return;
      const ans = form.answers[q.id];
      const isEmpty = q.type === "name"
        ? !ans || !ans.kanji?.trim()
        : !ans || (Array.isArray(ans) ? ans.length === 0 : !String(ans).trim());
      if (isEmpty) errs[`q_${q.id}`] = "この項目は必須です";
    });
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const app = {
      eventId: event.id,
      userId: user?.id,
      userName: form.name,
      userNameEn: form.nameEn,
      userFlag: user?.flag || "🌍",
      email: form.email,
      count: form.count,
      answers: form.answers,
      appliedAt: new Date().toISOString(),
    };
    saveApplication(app);
    setSubmitted(true);
  };

  const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
  const d = new Date(event.fullDate);
  const dateStr = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAYS[d.getDay()]}）`;

  const inputStyle = {
    width: "100%", padding: "10px 14px", boxSizing: "border-box",
    border: `1.5px solid ${C.lightGray}`, borderRadius: 8,
    fontSize: 14, color: C.charcoal, fontFamily: "inherit",
    outline: "none", background: C.white, transition: "border-color 0.2s",
  };

  // ── Success screen ─────────────────────────────────────
  if (submitted) {
    return (
      <div style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${C.teal} 0%, ${C.navy} 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "32px 16px",
        fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
      }}>
        <div style={{
          background: C.white, borderRadius: 20, maxWidth: 460, width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)", overflow: "hidden",
          textAlign: "center",
        }}>
          <div style={{
            background: event.color, padding: "28px 24px 24px",
          }}>
            <div style={{ fontSize: 52, marginBottom: 8 }}>{event.emoji}</div>
            <div style={{ color: C.white, fontSize: 20, fontWeight: 800 }}>
              申し込みが完了しました！
            </div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 4 }}>
              Application submitted
            </div>
          </div>

          <div style={{ padding: "28px 28px 24px" }}>
            <div style={{
              background: C.offWhite, borderRadius: 12, padding: "16px 18px",
              marginBottom: 20, textAlign: "left",
            }}>
              <div style={{ fontSize: 11, color: C.gray, marginBottom: 10, letterSpacing: 2 }}>
                申し込み内容
              </div>
              {[
                ["イベント", `${event.emoji} ${event.nameShort}`],
                ["日時",     `${dateStr}　${event.time}`],
                ["場所",     event.place],
                ["参加人数", form.count],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} style={{
                  display: "flex", gap: 12, marginBottom: 8, fontSize: 13,
                }}>
                  <span style={{ color: C.gray, minWidth: 70, flexShrink: 0 }}>{k}</span>
                  <span style={{ color: C.charcoal, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>

            <p style={{ color: C.gray, fontSize: 12, margin: "0 0 20px", lineHeight: 1.7 }}>
              当日はコミュニティパスポートを<br />
              受付でご提示ください。
            </p>

            <button
              onClick={() => navigate("/calendar")}
              style={{
                width: "100%", padding: "13px",
                background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
                color: C.white, border: "none", borderRadius: 10,
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              📅 カレンダーに戻る
            </button>
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
      <div style={{ maxWidth: 520, margin: "0 auto" }}>

        {/* Title */}
        <div style={{ textAlign: "center", color: C.white, marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 5, opacity: 0.6, marginBottom: 4 }}>
            EVENT APPLICATION
          </div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>📝 イベント申し込み</div>
        </div>

        {/* Event info card */}
        <div style={{
          background: C.white, borderRadius: 14,
          overflow: "hidden", marginBottom: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}>
          <div style={{
            background: event.color, padding: "14px 20px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{ fontSize: 36 }}>{event.emoji}</div>
            <div>
              <div style={{ color: C.white, fontWeight: 800, fontSize: 16, whiteSpace: "pre-line" }}>
                {event.name}
              </div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 3 }}>
                {dateStr}　{event.time}
              </div>
            </div>
          </div>
          <div style={{ padding: "10px 20px", fontSize: 12, color: C.gray }}>
            📍 {event.place}
          </div>
        </div>

        {isPast ? (
          <div style={{
            background: C.white, borderRadius: 14, padding: "32px",
            textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>⏰</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>
              申し込み受付は終了しました
            </div>
            <div style={{ fontSize: 13, color: C.gray, marginBottom: 20 }}>
              このイベントはすでに終了しています
            </div>
            <button
              onClick={() => navigate("/calendar")}
              style={{
                padding: "10px 28px",
                background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
                color: C.white, border: "none", borderRadius: 8,
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >カレンダーに戻る</button>
          </div>
        ) : (
          <div style={{
            background: C.white, borderRadius: 14,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)", overflow: "hidden",
          }}>
            <div style={{
              background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
              padding: "14px 22px",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: C.goldLight, border: `2px solid ${C.gold}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18,
              }}>📋</div>
              <div>
                <div style={{ color: C.white, fontWeight: 700, fontSize: 13 }}>
                  申し込みフォーム
                </div>
                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>
                  Application form
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "24px 24px 20px" }}>

              {/* Name */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.charcoal, marginBottom: 5 }}>
                    お名前 <span style={{ color: "#E74C3C" }}>*</span>
                  </label>
                  <input
                    type="text" value={form.name} onChange={set("name")}
                    style={{
                      ...inputStyle,
                      borderColor: errors.name ? "#E74C3C" : C.lightGray,
                      background: C.tealPale, color: C.teal,
                    }}
                  />
                  {errors.name && <div style={{ color: "#E74C3C", fontSize: 11, marginTop: 4 }}>{errors.name}</div>}
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.charcoal, marginBottom: 5 }}>
                    ローマ字
                  </label>
                  <input
                    type="text" value={form.nameEn} onChange={set("nameEn")}
                    style={{ ...inputStyle, background: C.tealPale, color: C.teal }}
                  />
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.charcoal, marginBottom: 5 }}>
                  メールアドレス
                  <span style={{ fontWeight: 400, color: C.gray, marginLeft: 8, fontSize: 11 }}>
                    確認メール送信用（任意）
                  </span>
                </label>
                <input
                  type="email" value={form.email} onChange={set("email")}
                  placeholder="hanako@example.com"
                  style={inputStyle}
                />
              </div>

              {/* Count */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.charcoal, marginBottom: 5 }}>
                  参加人数
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {COUNTS.map(c => (
                    <button
                      key={c} type="button"
                      onClick={() => setForm(f => ({ ...f, count: c }))}
                      style={{
                        padding: "7px 16px", borderRadius: 20,
                        border: `2px solid ${form.count === c ? event.color : C.lightGray}`,
                        background: form.count === c ? `${event.color}15` : C.white,
                        color: form.count === c ? event.color : C.gray,
                        fontSize: 13, fontWeight: form.count === c ? 700 : 400,
                        cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                      }}
                    >{c}</button>
                  ))}
                </div>
              </div>

              {/* Dynamic questions from admin form builder */}
              {(formConfig.questions || []).map((q) => (
                <div key={q.id} style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>
                    {q.label || "（質問未入力）"}
                    {q.required && <span style={{ color: "#E74C3C", marginLeft: 4 }}>*</span>}
                  </label>

                  {q.type === "name" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>日本語名</div>
                        <input
                          type="text"
                          value={(form.answers[q.id] || {}).kanji || ""}
                          onChange={e => setAnswer(q.id, { ...(form.answers[q.id] || {}), kanji: e.target.value })}
                          placeholder="例：山田 花子"
                          style={{
                            ...inputStyle,
                            borderColor: errors[`q_${q.id}`] ? "#E74C3C" : C.lightGray,
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: C.gray, marginBottom: 4 }}>ローマ字</div>
                        <input
                          type="text"
                          value={(form.answers[q.id] || {}).roman || ""}
                          onChange={e => setAnswer(q.id, { ...(form.answers[q.id] || {}), roman: e.target.value })}
                          placeholder="例：Hanako Yamada"
                          style={{ ...inputStyle }}
                        />
                      </div>
                    </div>
                  )}

                  {q.type === "text" && (
                    <textarea
                      value={form.answers[q.id] || ""}
                      onChange={e => setAnswer(q.id, e.target.value)}
                      rows={3}
                      style={{
                        ...inputStyle,
                        resize: "vertical", lineHeight: 1.6,
                        borderColor: errors[`q_${q.id}`] ? "#E74C3C" : C.lightGray,
                      }}
                    />
                  )}

                  {q.type === "radio" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(q.options || []).map((opt, i) => (
                        <label key={i} style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "9px 14px", borderRadius: 8, cursor: "pointer",
                          border: `1.5px solid ${form.answers[q.id] === opt ? event.color : C.lightGray}`,
                          background: form.answers[q.id] === opt ? `${event.color}10` : C.white,
                          transition: "all 0.15s",
                        }}>
                          <input
                            type="radio"
                            name={`q_${q.id}`}
                            value={opt}
                            checked={form.answers[q.id] === opt}
                            onChange={() => setAnswer(q.id, opt)}
                            style={{ accentColor: event.color }}
                          />
                          <span style={{ fontSize: 13, color: C.charcoal }}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === "checkbox" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(q.options || []).map((opt, i) => {
                        const checked = (form.answers[q.id] || []).includes(opt);
                        return (
                          <label key={i} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "9px 14px", borderRadius: 8, cursor: "pointer",
                            border: `1.5px solid ${checked ? event.color : C.lightGray}`,
                            background: checked ? `${event.color}10` : C.white,
                            transition: "all 0.15s",
                          }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCheckbox(q.id, opt)}
                              style={{ accentColor: event.color }}
                            />
                            <span style={{ fontSize: 13, color: C.charcoal }}>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {errors[`q_${q.id}`] && (
                    <div style={{ color: "#E74C3C", fontSize: 11, marginTop: 5 }}>
                      {errors[`q_${q.id}`]}
                    </div>
                  )}
                </div>
              ))}

              {/* Note */}
              <div style={{
                background: C.goldLight, border: `1px solid ${C.gold}30`,
                borderLeft: `4px solid ${C.gold}`,
                borderRadius: 8, padding: "10px 14px", marginBottom: 20,
                fontSize: 12, color: C.charcoal, lineHeight: 1.6,
              }}>
                📌 当日はコミュニティパスポートを受付でご提示ください。<br />
                スタッフがスタンプを押します。
              </div>

              <button
                type="submit"
                style={{
                  width: "100%", padding: "14px",
                  background: `linear-gradient(90deg, ${event.color}, ${event.color}cc)`,
                  color: C.white, border: "none", borderRadius: 10,
                  fontSize: 15, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: `0 4px 16px ${event.color}40`,
                }}
              >
                {event.emoji} 申し込みを送信する
              </button>

              <button
                type="button"
                onClick={() => navigate("/calendar")}
                style={{
                  width: "100%", padding: "10px", marginTop: 10,
                  background: "none", border: "none",
                  color: C.gray, fontSize: 13, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ← カレンダーに戻る
              </button>

            </form>
          </div>
        )}
      </div>
    </div>
  );
}
