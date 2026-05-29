import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { C } from "../constants";
import { useEvents } from "../hooks/useEvents";
import { getForm, isFormActive } from "../lib/formStorage";
import { saveApplicationToCloud } from "../lib/userService";

const SURVEY_KEY = "cp_survey_responses";

function loadSurveyResponses() {
  try { return JSON.parse(localStorage.getItem(SURVEY_KEY)) || []; }
  catch { return []; }
}

function saveSurveyResponse(resp) {
  const all = loadSurveyResponses();
  const idx = all.findIndex(a => a.eventId === resp.eventId && a.userId === resp.userId);
  if (idx >= 0) all[idx] = resp;
  else all.push(resp);
  localStorage.setItem(SURVEY_KEY, JSON.stringify(all));
}

function getSurveyResponse(eventId, userId) {
  return loadSurveyResponses().find(a => a.eventId === eventId && a.userId === userId) || null;
}

export default function SurveyPage({ user, stamps, forms = {} }) {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const events = useEvents();
  const event = events.find(e => e.id === Number(eventId));

  // formsプロップ優先（Firestoreから同期済み）、なければlocalStorage
  const formConfig = event ? (forms[event.id] || getForm(event.id)) : null;
  const existing = event && user ? getSurveyResponse(event.id, user.id) : null;

  const [form, setForm] = useState({ answers: {} });
  const [submitted, setSubmitted] = useState(!!existing);
  const [errors, setErrors] = useState({});

  const center = (content) => (
    <div style={{
      minHeight: "100vh",
      background: C.bgGradient,
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

  // Guard 1: not logged in
  if (!user) return center(
    <>
      <div style={{ fontSize: 36, marginBottom: 10 }}>🔒</div>
      <div style={{ fontWeight: 700, color: C.charcoal }}>登録が必要です</div>
    </>
  );

  // Guard 2: no stamp for this event
  if (!stamps?.has(Number(eventId))) return center(
    <>
      <div style={{ fontSize: 36, marginBottom: 10 }}>🎫</div>
      <div style={{ fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>
        このアンケートはイベント参加者のみ回答できます。
      </div>
    </>
  );

  // Guard 3: event not found or no form
  if (!event) return center(
    <>
      <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
      <div style={{ fontWeight: 700, color: C.charcoal }}>イベントが見つかりません</div>
    </>
  );

  if (!formConfig) return center(
    <>
      <div style={{ fontSize: 36, marginBottom: 10 }}>🛠️</div>
      <div style={{ fontWeight: 700, color: C.charcoal }}>アンケートはまだ作成されていません</div>
    </>
  );

  // Guard 4: form not active
  if (!isFormActive(Number(eventId))) return center(
    <>
      <div style={{ fontSize: 36, marginBottom: 10 }}>🔒</div>
      <div style={{ fontWeight: 700, color: C.charcoal }}>アンケートの受付期間外です</div>
    </>
  );

  // Already responded
  if (submitted) {
    return (
      <div style={{
        minHeight: "100vh",
        background: C.bgGradient,
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
              回答ありがとうございました！
            </div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 4 }}>
              Survey submitted
            </div>
          </div>
          <div style={{ padding: "28px 28px 24px" }}>
            <p style={{ color: C.gray, fontSize: 13, margin: "0 0 20px", lineHeight: 1.7 }}>
              回答済みです ありがとうございました！
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

    const resp = {
      type: "survey",
      eventId: event.id,
      userId: user?.id,
      userName: user?.name,
      userNameEn: user?.nameEn,
      userFlag: user?.flag || "🌍",
      answers: form.answers,
      respondedAt: new Date().toISOString(),
    };
    saveSurveyResponse(resp);
    saveApplicationToCloud(resp);
    setSubmitted(true);
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", boxSizing: "border-box",
    border: `1.5px solid ${C.lightGray}`, borderRadius: 8,
    fontSize: 14, color: C.charcoal, fontFamily: "inherit",
    outline: "none", background: C.white, transition: "border-color 0.2s",
  };

  const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
  const d = new Date(event.fullDate);
  const dateStr = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAYS[d.getDay()]}）`;

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bgGradient,
      padding: "28px 16px 48px",
      fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
    }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>

        {/* Title */}
        <div style={{ textAlign: "center", color: C.white, marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: 5, opacity: 0.6, marginBottom: 4 }}>
            POST-EVENT SURVEY
          </div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>アンケート</div>
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
            }}>📝</div>
            <div>
              <div style={{ color: C.white, fontWeight: 700, fontSize: 13 }}>
                アンケートに回答する
              </div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>
                ご参加ありがとうございました。ぜひ感想をお聞かせください。
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: "24px 24px 20px" }}>

            {/* Dynamic questions from admin form builder */}
            {(formConfig.questions || []).length === 0 && (
              <div style={{
                textAlign: "center", color: C.gray, fontSize: 13,
                padding: "20px 0", marginBottom: 16,
              }}>
                質問項目がありません
              </div>
            )}

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
              {event.emoji} 回答を送信する
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
      </div>
    </div>
  );
}
