import { useState } from "react";
import { C, EVENTS } from "../../constants";
import { loadForms, saveForm } from "../../lib/formStorage";

const QUESTION_TYPES = [
  { id: "text",     label: "テキスト入力",    icon: "📝" },
  { id: "radio",    label: "選択肢（単一）",   icon: "🔘" },
  { id: "checkbox", label: "チェックボックス", icon: "☑️" },
];

function newQuestion(type = "text") {
  return {
    id: Date.now().toString(),
    type,
    label: "",
    required: false,
    options: type !== "text" ? [""] : [],
  };
}

function QuestionEditor({ q, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const inputStyle = {
    width: "100%", padding: "8px 12px", boxSizing: "border-box",
    border: `1.5px solid ${C.lightGray}`, borderRadius: 8,
    fontSize: 13, color: C.charcoal, fontFamily: "inherit",
    outline: "none", background: C.white,
  };

  return (
    <div style={{
      border: `1.5px solid ${C.lightGray}`, borderRadius: 12,
      padding: "14px 16px", marginBottom: 10,
      background: C.offWhite,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        {/* Type selector */}
        <select
          value={q.type}
          onChange={e => {
            const t = e.target.value;
            onChange({ ...q, type: t, options: t !== "text" ? (q.options.length ? q.options : [""]) : [] });
          }}
          style={{
            ...inputStyle, width: "auto", cursor: "pointer",
            background: C.white, fontWeight: 700, color: C.teal,
            border: `1.5px solid ${C.tealLight}`,
          }}
        >
          {QUESTION_TYPES.map(t => (
            <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
          ))}
        </select>

        {/* Required toggle */}
        <label style={{
          display: "flex", alignItems: "center", gap: 5,
          fontSize: 12, color: C.gray, cursor: "pointer", marginLeft: 4,
        }}>
          <input
            type="checkbox" checked={q.required}
            onChange={e => onChange({ ...q, required: e.target.checked })}
          />
          必須
        </label>

        <div style={{ flex: 1 }} />

        {/* Move buttons */}
        <button onClick={onMoveUp} disabled={isFirst} style={{
          background: "none", border: `1px solid ${C.lightGray}`, borderRadius: 6,
          padding: "3px 8px", cursor: isFirst ? "default" : "pointer",
          color: isFirst ? C.lightGray : C.gray, fontSize: 12,
        }}>↑</button>
        <button onClick={onMoveDown} disabled={isLast} style={{
          background: "none", border: `1px solid ${C.lightGray}`, borderRadius: 6,
          padding: "3px 8px", cursor: isLast ? "default" : "pointer",
          color: isLast ? C.lightGray : C.gray, fontSize: 12,
        }}>↓</button>
        <button onClick={onDelete} style={{
          background: "none", border: `1px solid ${C.lightGray}`, borderRadius: 6,
          padding: "3px 8px", cursor: "pointer", color: C.red, fontSize: 12,
        }}>✕</button>
      </div>

      {/* Question label */}
      <input
        type="text"
        value={q.label}
        onChange={e => onChange({ ...q, label: e.target.value })}
        placeholder="質問の内容を入力"
        style={{ ...inputStyle, marginBottom: q.type !== "text" ? 8 : 0, fontWeight: 600 }}
      />

      {/* Options for radio/checkbox */}
      {q.type !== "text" && (
        <div style={{ marginTop: 6 }}>
          {q.options.map((opt, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <span style={{ color: C.gray, fontSize: 14, marginTop: 7, flexShrink: 0 }}>
                {q.type === "radio" ? "○" : "□"}
              </span>
              <input
                type="text"
                value={opt}
                onChange={e => {
                  const opts = [...q.options];
                  opts[i] = e.target.value;
                  onChange({ ...q, options: opts });
                }}
                placeholder={`選択肢 ${i + 1}`}
                style={{ ...inputStyle, flex: 1 }}
              />
              {q.options.length > 1 && (
                <button
                  onClick={() => onChange({ ...q, options: q.options.filter((_, j) => j !== i) })}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: C.gray, fontSize: 16, padding: "0 4px",
                  }}
                >×</button>
              )}
            </div>
          ))}
          <button
            onClick={() => onChange({ ...q, options: [...q.options, ""] })}
            style={{
              background: "none", border: `1px dashed ${C.lightGray}`,
              borderRadius: 8, padding: "5px 14px", cursor: "pointer",
              color: C.gray, fontSize: 12, fontFamily: "inherit",
              width: "100%", marginTop: 2,
            }}
          >＋ 選択肢を追加</button>
        </div>
      )}
    </div>
  );
}

export default function EventFormBuilder() {
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [forms, setForms] = useState(loadForms);
  const [saved, setSaved] = useState(false);

  const event = EVENTS.find(e => e.id === selectedEventId);
  const form = selectedEventId ? (forms[selectedEventId] || {
    enabled: false,
    capacity: "",
    openDate: "",
    closeDate: "",
    questions: [],
  }) : null;

  const updateForm = (patch) => {
    if (!selectedEventId) return;
    setForms(prev => ({
      ...prev,
      [selectedEventId]: { ...(prev[selectedEventId] || {}), ...patch },
    }));
    setSaved(false);
  };

  const addQuestion = (type) => {
    updateForm({ questions: [...(form.questions || []), newQuestion(type)] });
  };

  const updateQuestion = (idx, q) => {
    const qs = [...(form.questions || [])];
    qs[idx] = q;
    updateForm({ questions: qs });
  };

  const deleteQuestion = (idx) => {
    const qs = form.questions.filter((_, i) => i !== idx);
    updateForm({ questions: qs });
  };

  const moveQuestion = (idx, dir) => {
    const qs = [...form.questions];
    const target = idx + dir;
    if (target < 0 || target >= qs.length) return;
    [qs[idx], qs[target]] = [qs[target], qs[idx]];
    updateForm({ questions: qs });
  };

  const handleSave = () => {
    saveForm(selectedEventId, form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputStyle = {
    width: "100%", padding: "9px 12px", boxSizing: "border-box",
    border: `1.5px solid ${C.lightGray}`, borderRadius: 8,
    fontSize: 13, color: C.charcoal, fontFamily: "inherit",
    outline: "none", background: C.white,
  };

  return (
    <div style={{
      background: C.white, borderRadius: 16,
      boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
      overflow: "hidden", marginTop: 20,
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px 14px",
        borderBottom: `1px solid ${C.lightGray}`,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{
          display: "inline-block", width: 4, height: 16,
          background: "#8E44AD", borderRadius: 2,
        }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>
          申し込みフォーム作成
        </span>
      </div>

      <div style={{ padding: "16px 20px" }}>

        {/* Event selector */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.charcoal, marginBottom: 8 }}>
            対象イベントを選択
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {EVENTS.map(ev => {
              const hasForm = !!forms[ev.id]?.enabled;
              return (
                <button
                  key={ev.id}
                  onClick={() => { setSelectedEventId(ev.id); setSaved(false); }}
                  style={{
                    padding: "7px 14px", borderRadius: 10,
                    border: `2px solid ${selectedEventId === ev.id ? ev.color : C.lightGray}`,
                    background: selectedEventId === ev.id ? `${ev.color}12` : C.white,
                    cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 6,
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 16 }}>{ev.emoji}</span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: selectedEventId === ev.id ? ev.color : C.charcoal }}>
                      {ev.nameShort}
                    </div>
                    <div style={{ fontSize: 10, color: hasForm ? "#1A6B45" : C.gray }}>
                      {hasForm ? "✓ フォームあり" : "未設定"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form editor */}
        {form && event && (
          <>
            <div style={{
              background: `${event.color}10`,
              border: `1px solid ${event.color}30`,
              borderRadius: 10, padding: "12px 16px", marginBottom: 16,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 24 }}>{event.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: event.color }}>{event.nameShort}</div>
                <div style={{ fontSize: 11, color: C.gray }}>{event.fullDate}　{event.time}</div>
              </div>
              {/* Enable toggle */}
              <label style={{
                display: "flex", alignItems: "center", gap: 8,
                cursor: "pointer", fontSize: 13, fontWeight: 700,
                color: form.enabled ? "#1A6B45" : C.gray,
              }}>
                <div
                  onClick={() => updateForm({ enabled: !form.enabled })}
                  style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: form.enabled ? "#1A6B45" : C.lightGray,
                    position: "relative", cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  <div style={{
                    position: "absolute", top: 3,
                    left: form.enabled ? 23 : 3,
                    width: 18, height: 18, borderRadius: "50%",
                    background: C.white,
                    transition: "left 0.2s",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                  }} />
                </div>
                {form.enabled ? "受付中" : "受付停止"}
              </label>
            </div>

            {/* Settings */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.charcoal, marginBottom: 5 }}>
                  定員
                </div>
                <input
                  type="number" value={form.capacity}
                  onChange={e => updateForm({ capacity: e.target.value })}
                  placeholder="例：30"
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.charcoal, marginBottom: 5 }}>
                  受付開始日
                </div>
                <input
                  type="date" value={form.openDate}
                  onChange={e => updateForm({ openDate: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.charcoal, marginBottom: 5 }}>
                  受付締め切り日
                </div>
                <input
                  type="date" value={form.closeDate}
                  onChange={e => updateForm({ closeDate: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Questions */}
            <div style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: C.charcoal,
                marginBottom: 10, display: "flex", alignItems: "center", gap: 8,
              }}>
                質問項目
                <span style={{ fontSize: 11, color: C.gray, fontWeight: 400 }}>
                  — お名前・参加人数はデフォルトで含まれます
                </span>
              </div>

              {(form.questions || []).length === 0 && (
                <div style={{
                  border: `1.5px dashed ${C.lightGray}`, borderRadius: 10,
                  padding: "20px", textAlign: "center",
                  color: C.gray, fontSize: 13, marginBottom: 10,
                }}>
                  質問項目を追加してください
                </div>
              )}

              {(form.questions || []).map((q, i) => (
                <QuestionEditor
                  key={q.id}
                  q={q}
                  onChange={(updated) => updateQuestion(i, updated)}
                  onDelete={() => deleteQuestion(i)}
                  onMoveUp={() => moveQuestion(i, -1)}
                  onMoveDown={() => moveQuestion(i, 1)}
                  isFirst={i === 0}
                  isLast={i === (form.questions.length - 1)}
                />
              ))}

              {/* Add question buttons */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                {QUESTION_TYPES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => addQuestion(t.type)}
                    style={{
                      padding: "6px 14px", borderRadius: 20,
                      border: `1.5px dashed ${C.lightGray}`,
                      background: C.white, color: C.gray,
                      cursor: "pointer", fontSize: 12, fontFamily: "inherit",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.color = C.teal; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.lightGray; e.currentTarget.style.color = C.gray; }}
                  >
                    ＋ {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Save button */}
            <div style={{ borderTop: `1px solid ${C.lightGray}`, paddingTop: 16, marginTop: 8 }}>
              <button
                onClick={handleSave}
                style={{
                  padding: "10px 32px", borderRadius: 8, border: "none",
                  background: saved
                    ? `linear-gradient(90deg, #1A6B45, #27AE60)`
                    : `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
                  color: C.white, fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "background 0.3s",
                }}
              >
                {saved ? "✓ 保存しました" : "💾 保存する"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
