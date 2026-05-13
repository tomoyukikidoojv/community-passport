import { useRef, useState } from "react";
import html2canvas from "html2canvas";

const B = {
  navy:     "#0d1b4b",
  navyMid:  "#0c2a7a",
  teal:     "#0c7a8a",
  tealMid:  "#0ea5b5",
  gold:     "#e8b84b",
  goldLt:   "#f7c948",
  white:    "#FFFFFF",
  offWhite: "#f0f8fa",
};

const FONT = "'Hiragino Sans','Meiryo','Yu Gothic',sans-serif";

// 540 × 720 → export 2× = 1080 × 1440 px
const W = 540;
const H = 720;

const STEPS = [
  {
    n: "01",
    ja: "「カレンダー」タブをひらく",
    en: 'Open the "Calendar" tab',
  },
  {
    n: "02",
    ja: "さんかしたいイベントをタップする",
    en: "Tap the event you want to join",
  },
  {
    n: "03",
    ja: "「さんかしたい」ボタンをおす",
    en: 'Press the "Going" button',
  },
  {
    n: "04",
    ja: "おとな・こどものにんずうをえらぶ",
    en: "Select number of adults & children",
  },
];

function SingleCard() {
  return (
    <div style={{
      width: W, height: H,
      fontFamily: FONT,
      background: `linear-gradient(160deg, ${B.navy} 0%, ${B.navyMid} 55%, ${B.teal} 100%)`,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* 背景装飾円 */}
      <div style={{
        position: "absolute", top: -70, right: -70,
        width: 240, height: 240, borderRadius: "50%",
        background: "rgba(232,184,75,0.07)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -50, left: -50,
        width: 180, height: 180, borderRadius: "50%",
        background: "rgba(14,165,181,0.12)", pointerEvents: "none",
      }} />

      {/* ─── HEADER ─── */}
      <div style={{
        padding: "26px 30px 18px",
        display: "flex", alignItems: "center", gap: 14,
      }}>
        {/* Globe circle */}
        <div style={{
          width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
          background: `linear-gradient(135deg, ${B.gold}, ${B.goldLt})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28,
          boxShadow: "0 6px 20px rgba(232,184,75,0.4)",
        }}>🌏</div>

        <div>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 2.5,
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase", marginBottom: 2,
          }}>ASHIYA CITY · 芦屋市</div>
          <div style={{
            fontSize: 20, fontWeight: 800, color: B.white, lineHeight: 1.2,
          }}>コミュニティパスポート</div>
          <div style={{
            fontSize: 11, fontWeight: 600, color: B.gold, letterSpacing: 0.5,
          }}>Community Passport</div>
        </div>
      </div>

      {/* タグライン */}
      <div style={{
        padding: "0 30px 14px",
        fontSize: 11.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.75,
      }}>
        イベントのお知らせを 読んで、イベントに 参加できる アプリです。<br />
        <span style={{ color: "rgba(255,255,255,0.42)", fontSize: 10.5 }}>
          Read event announcements and join events in Ashiya City.
        </span>
      </div>

      {/* ─── DIVIDER ─── */}
      <div style={{
        margin: "0 30px 16px",
        height: 1,
        background: "linear-gradient(90deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%)",
      }} />

      {/* ─── HOW TO JOIN EVENTS ─── */}
      <div style={{ padding: "0 30px", flex: 1 }}>
        {/* セクションタイトル */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
        }}>
          <div style={{
            background: `linear-gradient(135deg, ${B.gold}, ${B.goldLt})`,
            borderRadius: 6, padding: "4px 12px",
            color: B.navy, letterSpacing: 0.3,
            lineHeight: 1.4,
          }}>
            <div style={{ fontSize: 11, fontWeight: 800 }}>イベントへの参加のしかた</div>
            <div style={{ fontSize: 9, fontWeight: 600, opacity: 0.75 }}>How to Join Events</div>
          </div>
        </div>

        {/* ステップ */}
        {STEPS.map(({ n, ja, en }) => (
          <div key={n} style={{
            display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12,
          }}>
            {/* ナンバーサークル */}
            <div style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${B.gold}, ${B.goldLt})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: B.navy,
            }}>{n}</div>

            {/* テキスト */}
            <div style={{
              flex: 1,
              background: "rgba(255,255,255,0.09)",
              borderRadius: 10, padding: "8px 12px",
              borderLeft: `3px solid rgba(232,184,75,0.5)`,
            }}>
              <div style={{
                fontSize: 13, fontWeight: 700, color: B.white,
                lineHeight: 1.35, marginBottom: 2,
              }}>{en}</div>
              <div style={{
                fontSize: 10.5, color: "rgba(255,255,255,0.52)",
                lineHeight: 1.4,
              }}>{ja}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── FEATURE BAR ─── */}
      <div style={{
        margin: "14px 30px 0",
        height: 1,
        background: "linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.04) 100%)",
      }} />
      <div style={{
        padding: "8px 30px 0",
        fontSize: 9, fontWeight: 700,
        color: "rgba(255,255,255,0.35)",
        letterSpacing: 1.5, textTransform: "uppercase",
      }}>その他の機能 / Other Features</div>
      <div style={{
        display: "flex",
        padding: "4px 30px 0",
      }}>
        {[
          { emoji: "📢", ja: "おしらせ",  en: "Announcements" },
          { emoji: "📅", ja: "カレンダー", en: "Calendar" },
          { emoji: "🎫", ja: "スタンプ",   en: "Stamps" },
        ].map(({ emoji, ja, en }, i) => (
          <div key={i} style={{
            flex: 1, textAlign: "center",
            borderRight: i < 2 ? "1px solid rgba(255,255,255,0.1)" : "none",
            padding: "6px 4px",
          }}>
            <div style={{ fontSize: 22, marginBottom: 3 }}>{emoji}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: B.white, marginBottom: 1 }}>{ja}</div>
            <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.38)", letterSpacing: 0.3 }}>{en}</div>
          </div>
        ))}
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────
const LINE_MESSAGES = {
  ja: `📣 コミュニティパスポートにとうろくしてくださったみなさまへ

とうろくありがとうございます！

📅 イベントへのさんかについて

イベントにさんかするためには、アプリの「カレンダー」タブから さんかのいしひょうじが ひつようです。

【さんかのしかた】
① アプリをひらいて「カレンダー」をタップ
② さんかしたいイベントをえらぶ
③ 「さんかしたい」ボタンをおす
④ おとな・こどもの にんずうをえらぶ

さんかのいしひょうじをすることで、スタッフが じゅんびをしやすくなります。
ぜひよろしくおねがいします！

ご不明な点は じむきょくまでお問い合わせください。
芦屋市 多文化共生アドバイザー事務局`,

  en: `📣 To all Community Passport members,

Thank you for registering!

📅 How to join events

To participate in events, you need to register your attendance through the "Calendar" tab in the app.

【Steps to join】
① Open the app and tap "Calendar"
② Select the event you want to attend
③ Press the "Going" button
④ Choose the number of adults & children

Your RSVP helps our staff prepare for the event.
We look forward to seeing you!

For any questions, please contact our office.
Ashiya City Multicultural Coexistence Advisor Office`,
};

export default function LineCards() {
  const cardRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(null); // "ja" | "en" | null

  const copyText = (lang) => {
    navigator.clipboard.writeText(LINE_MESSAGES[lang]).then(() => {
      setCopied(lang);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const download = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const a = document.createElement("a");
      a.download = "LINE_community_passport.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{
      padding: "24px 20px 40px",
      fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif",
    }}>
      {/* ヘッダー */}
      <div style={{
        background: "#fff", borderRadius: 14,
        border: "1.5px solid #e2e8f0",
        padding: "16px 20px", marginBottom: 24,
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 16, flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0d1b4b", marginBottom: 3 }}>
            📲 LINE配信用カード
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            1080×1440px のPNGをダウンロードし、LINE公式アカウントから配信してください。
          </div>
        </div>
        <button
          onClick={download}
          disabled={exporting}
          style={{
            padding: "10px 22px",
            background: exporting ? "#e2e8f0" : "linear-gradient(90deg, #0c7a8a, #0ea5b5)",
            color: exporting ? "#94a3b8" : "#fff",
            border: "none", borderRadius: 10,
            fontSize: 13, fontWeight: 700,
            cursor: exporting ? "not-allowed" : "pointer",
            fontFamily: "inherit", whiteSpace: "nowrap",
            boxShadow: exporting ? "none" : "0 4px 12px rgba(12,122,138,0.35)",
          }}
        >
          {exporting ? "⏳ エクスポート中..." : "📥 ダウンロード（PNG）"}
        </button>
      </div>

      {/* カードプレビュー */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: "#1e293b",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          プレビュー
          <span style={{
            fontSize: 9, color: "#94a3b8",
            border: "1px solid #e2e8f0", borderRadius: 4, padding: "1px 5px",
          }}>1080×1440px でエクスポート</span>
        </div>

        <div style={{
          borderRadius: 14, overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
        }}>
          <div ref={cardRef}>
            <SingleCard />
          </div>
        </div>
      </div>

      {/* ─── LINE テキストメッセージ ─── */}
      <div style={{ marginTop: 32 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0d1b4b", marginBottom: 4 }}>
          ✉️ LINE配信用テキスト
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
          コピーしてLINE公式アカウントのメッセージ作成画面に貼り付けてください。
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { lang: "ja", label: "🇯🇵 日本語（やさしい日本語）" },
            { lang: "en", label: "🇺🇸 English" },
          ].map(({ lang, label }) => (
            <div key={lang} style={{
              background: "#fff",
              border: "1.5px solid #e2e8f0",
              borderRadius: 12, overflow: "hidden",
            }}>
              {/* ヘッダー行 */}
              <div style={{
                padding: "10px 16px",
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{label}</span>
                <button
                  onClick={() => copyText(lang)}
                  style={{
                    padding: "5px 14px",
                    background: copied === lang
                      ? "linear-gradient(90deg, #059669, #10b981)"
                      : "linear-gradient(90deg, #0c7a8a, #0ea5b5)",
                    color: "#fff", border: "none", borderRadius: 8,
                    fontSize: 12, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                    transition: "background 0.2s",
                  }}
                >
                  {copied === lang ? "✓ コピーしました！" : "📋 コピー"}
                </button>
              </div>
              {/* テキスト本文 */}
              <pre style={{
                margin: 0, padding: "14px 16px",
                fontSize: 12, color: "#334155",
                lineHeight: 1.85, whiteSpace: "pre-wrap",
                fontFamily: "'Hiragino Sans','Meiryo',sans-serif",
                background: "#fff",
              }}>
                {LINE_MESSAGES[lang]}
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* ヒント */}
      <div style={{
        marginTop: 24,
        background: "#f0fdf4", border: "1px solid #bbf7d0",
        borderRadius: 12, padding: "14px 18px",
        fontSize: 12, color: "#166534", lineHeight: 1.8,
      }}>
        <strong>💡 LINE公式アカウントでの配信手順</strong><br />
        ① LINE公式アカウントマネージャー（manager.line.biz）にログイン<br />
        ② 「メッセージを作成」→「テキスト」または「画像」でコンテンツを追加<br />
        ③ 「配信」で全員に送信できます
      </div>
    </div>
  );
}
