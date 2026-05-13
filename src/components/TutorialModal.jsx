import { useState } from "react";
import { useLang } from "../i18n/LangContext";
import { C } from "../constants";

const STEPS = [
  {
    emoji: "🎉",
    headerBg: `linear-gradient(135deg, ${C.teal}, ${C.tealMid})`,
    titleKey: "tutorial.t1",
    bodyKey: "tutorial.b1",
  },
  {
    emoji: "📢",
    headerBg: "linear-gradient(135deg, #e67e22, #f39c12)",
    titleKey: "tutorial.t2",
    bodyKey: "tutorial.b2",
  },
  {
    emoji: "📅",
    headerBg: `linear-gradient(135deg, ${C.teal}, ${C.tealMid})`,
    titleKey: "tutorial.t3",
    bodyKey: "tutorial.b3",
    rsvpMockup: true,
  },
  {
    emoji: "🎫",
    headerBg: "linear-gradient(135deg, #4a1d8e, #2c3e7a)",
    titleKey: "tutorial.t4",
    bodyKey: "tutorial.b4",
  },
];

function RsvpMockup() {
  return (
    <div style={{
      border: `1.5px solid ${C.lightGray}`,
      borderRadius: 12,
      overflow: "hidden",
      margin: "12px 0 4px",
      fontSize: 13,
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }}>
      {/* Colored header band */}
      <div style={{
        background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
        padding: "8px 12px",
        color: C.white,
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: 0.3,
      }}>
        📅 Event RSVP
      </div>

      {/* Going / Not going buttons */}
      <div style={{
        display: "flex",
        gap: 8,
        padding: "10px 12px 8px",
        background: C.offWhite,
      }}>
        <div style={{
          flex: 1,
          padding: "7px 0",
          background: C.teal,
          color: C.white,
          borderRadius: 8,
          textAlign: "center",
          fontWeight: 700,
          fontSize: 12,
          boxShadow: `0 2px 6px rgba(12,122,138,0.35)`,
        }}>
          ✓ Going
        </div>
        <div style={{
          flex: 1,
          padding: "7px 0",
          background: C.white,
          color: C.gray,
          borderRadius: 8,
          textAlign: "center",
          fontWeight: 500,
          fontSize: 12,
          border: `1px solid ${C.lightGray}`,
        }}>
          Not going
        </div>
      </div>

      {/* Counter rows */}
      <div style={{ padding: "0 12px 10px", background: C.offWhite }}>
        {[
          { label: "👨 Adults", count: 1 },
          { label: "👦 Children", count: 0 },
        ].map(({ label, count }) => (
          <div key={label} style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "5px 0",
            borderTop: `1px solid ${C.lightGray}`,
          }}>
            <span style={{ color: C.charcoal, fontWeight: 600, fontSize: 12 }}>{label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: C.white, border: `1px solid ${C.lightGray}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: C.gray,
              }}>−</div>
              <span style={{ minWidth: 18, textAlign: "center", fontWeight: 700, color: C.charcoal, fontSize: 13 }}>{count}</span>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: C.teal,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: C.white,
              }}>+</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TutorialModal({ onClose }) {
  const { t } = useLang();
  const [step, setStep] = useState(0);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
    }}>
      <div style={{
        background: C.white,
        borderRadius: 20,
        maxWidth: 440,
        width: "100%",
        overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
      }}>
        {/* Progress dots */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          padding: "14px 24px 0",
          background: C.white,
        }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background: i === step ? C.teal : C.lightGray,
                transition: "all 0.25s ease",
              }}
            />
          ))}
        </div>

        {/* Header visual area */}
        <div style={{
          background: current.headerBg,
          padding: "24px 24px 20px",
          textAlign: "center",
          marginTop: 12,
        }}>
          <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 6 }}>
            {current.emoji}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 24px 8px" }}>
          <h2 style={{
            margin: "0 0 10px",
            fontSize: 19,
            fontWeight: 800,
            color: C.charcoal,
            textAlign: "center",
            lineHeight: 1.3,
          }}>
            {t(current.titleKey)}
          </h2>
          <p style={{
            margin: "0 0 4px",
            fontSize: 14,
            color: C.gray,
            lineHeight: 1.7,
            whiteSpace: "pre-line",
            textAlign: "center",
          }}>
            {t(current.bodyKey)}
          </p>
          {current.rsvpMockup && <RsvpMockup />}
        </div>

        {/* Bottom buttons */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px 20px",
        }}>
          {/* Skip button — shown on steps 0-2, invisible placeholder on last step */}
          {!isLast ? (
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: C.gray,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                padding: "8px 4px",
                fontFamily: "inherit",
              }}
            >
              {t("tutorial.skip")}
            </button>
          ) : (
            <div style={{ width: 48 }} />
          )}

          {/* Next / Finish button */}
          <button
            onClick={handleNext}
            style={{
              background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`,
              color: C.white,
              border: "none",
              borderRadius: 10,
              padding: "10px 24px",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: `0 4px 12px rgba(12,122,138,0.35)`,
              minWidth: 120,
            }}
          >
            {isLast ? t("tutorial.finish") : t("tutorial.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
