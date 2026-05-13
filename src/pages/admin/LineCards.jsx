import { useRef, useState } from "react";
import html2canvas from "html2canvas";

// ── カラー（html2canvasはCSS変数非対応のため直書き） ──────────
const B = {
  navy:    "#0d1b4b",
  navyMid: "#0c2a7a",
  teal:    "#0c7a8a",
  tealMid: "#0ea5b5",
  gold:    "#e8b84b",
  goldLt:  "#f7c948",
  white:   "#FFFFFF",
  purple:  "#2c1654",
  purpleMid: "#4a1d8e",
};

const FONT = "'Hiragino Sans','Meiryo','Yu Gothic',sans-serif";
const S = 540; // DOMレンダリングサイズ (export: 2× = 1080×1080px)

// ─────────────────────────────────────────────────────────────
// Card 1: パスポートとは？
// ─────────────────────────────────────────────────────────────
function Card1() {
  return (
    <div style={{
      width: S, height: S, fontFamily: FONT, color: B.white,
      background: `linear-gradient(150deg, ${B.navy} 0%, ${B.navyMid} 45%, ${B.teal} 100%)`,
      display: "flex", flexDirection: "column",
      overflow: "hidden", position: "relative",
    }}>
      {/* 背景装飾円 */}
      <div style={{
        position: "absolute", top: -80, right: -80,
        width: 280, height: 280, borderRadius: "50%",
        background: "rgba(232,184,75,0.08)",
      }} />
      <div style={{
        position: "absolute", bottom: -60, left: -60,
        width: 200, height: 200, borderRadius: "50%",
        background: "rgba(14,165,181,0.15)",
      }} />

      {/* ヘッダー */}
      <div style={{ padding: "28px 32px 0", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 3, height: 16, borderRadius: 2,
          background: `linear-gradient(${B.gold}, ${B.goldLt})`,
        }} />
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 3,
          color: "rgba(255,255,255,0.45)",
          textTransform: "uppercase",
        }}>Ashiya City — Multicultural Coexistence</div>
      </div>

      {/* アイコン＋タイトル */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "0 32px", textAlign: "center",
      }}>
        <div style={{
          width: 96, height: 96, borderRadius: "50%",
          background: `linear-gradient(135deg, ${B.gold}, ${B.goldLt})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 48, marginBottom: 18,
          boxShadow: "0 10px 36px rgba(232,184,75,0.45)",
        }}>🌏</div>

        <div style={{
          fontSize: 12, fontWeight: 700, letterSpacing: 3,
          color: B.gold, marginBottom: 6,
        }}>COMMUNITY PASSPORT</div>

        <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.25, marginBottom: 14 }}>
          コミュニティ<br/>パスポート
        </div>

        <div style={{
          fontSize: 13, color: "rgba(255,255,255,0.72)",
          lineHeight: 1.8, maxWidth: 380,
        }}>
          芦屋市に すむ外国籍のかたが、<br/>
          イベントに さんかしたり<br/>
          コミュニティと つながるための アプリです
        </div>
      </div>

      {/* 機能タイル */}
      <div style={{
        display: "flex",
        borderTop: "1px solid rgba(255,255,255,0.12)",
        margin: "0 32px",
      }}>
        {[
          { emoji: "📢", text: "おしらせ",   sub: "Announcements" },
          { emoji: "📅", text: "イベント",   sub: "Events" },
          { emoji: "🎫", text: "スタンプ",   sub: "Stamps" },
        ].map(({ emoji, text, sub }, i) => (
          <div key={i} style={{
            flex: 1, padding: "14px 6px", textAlign: "center",
            borderRight: i < 2 ? "1px solid rgba(255,255,255,0.12)" : "none",
          }}>
            <div style={{ fontSize: 26, marginBottom: 4 }}>{emoji}</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{text}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.38)", letterSpacing: 0.5 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* フッター */}
      <div style={{
        padding: "12px 32px 16px",
        fontSize: 9, color: "rgba(255,255,255,0.22)", letterSpacing: 2,
      }}>ASHIYA CITY  ·  芦屋市</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Card 2: イベントへのさんかのしかた
// ─────────────────────────────────────────────────────────────
function Card2() {
  const steps = [
    { n: "01", title: "「おしらせ」タブをひらく",         sub: "イベントのおしらせをみつけてタップ" },
    { n: "02", title: "「このイベントにもうしこむ」をタップ", sub: "カードのしたにボタンがでてきます" },
    { n: "03", title: "「さんかしたい」をおす",            sub: "カレンダーページにいどうします" },
    { n: "04", title: "おとな・こどもの にんずうをえらぶ", sub: "＋ボタンでにんずうをふやします" },
  ];

  return (
    <div style={{
      width: S, height: S, fontFamily: FONT, color: B.white,
      background: `linear-gradient(150deg, ${B.navyMid} 0%, ${B.teal} 100%)`,
      display: "flex", flexDirection: "column",
      padding: "32px", overflow: "hidden", position: "relative",
    }}>
      {/* 背景装飾 */}
      <div style={{
        position: "absolute", top: -40, right: -40,
        width: 180, height: 180, borderRadius: "50%",
        background: "rgba(255,255,255,0.06)",
      }} />

      {/* HOWTOバッジ */}
      <div style={{
        alignSelf: "flex-start",
        background: "rgba(232,184,75,0.2)",
        border: "1px solid rgba(232,184,75,0.5)",
        borderRadius: 20, padding: "4px 14px",
        fontSize: 10, fontWeight: 800,
        color: B.gold, letterSpacing: 2, marginBottom: 14,
      }}>HOW TO</div>

      {/* タイトル */}
      <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.3, marginBottom: 4 }}>
        イベントへの<br/>さんかのしかた
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>
        かんたん 4ステップ
      </div>

      {/* ステップリスト */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
        {steps.map(({ n, title, sub }) => (
          <div key={n} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${B.gold}, ${B.goldLt})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: B.navy,
            }}>{n}</div>
            <div style={{
              flex: 1,
              background: "rgba(255,255,255,0.10)",
              borderRadius: 10, padding: "8px 12px",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>{title}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* フッターバナー */}
      <div style={{
        marginTop: 20,
        background: "rgba(255,255,255,0.10)",
        borderRadius: 10, padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: `linear-gradient(135deg, ${B.gold}, ${B.goldLt})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, flexShrink: 0,
        }}>📱</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
          コミュニティパスポートに とうろくすると<br/>すぐにつかえます！
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Card 3: スタンプをあつめよう
// ─────────────────────────────────────────────────────────────
function Card3() {
  const stampData = [
    { filled: true,  emoji: "🌏", label: "Welcome" },
    { filled: true,  emoji: "🍽️", label: "Dinner" },
    { filled: true,  emoji: "📖", label: "Story" },
    { filled: false, emoji: "",  label: "" },
    { filled: false, emoji: "",  label: "" },
    { filled: false, emoji: "",  label: "" },
  ];

  const levels = [
    { label: "Newcomer",   active: true  },
    { label: "Explorer",   active: false },
    { label: "Regular",    active: false },
    { label: "Active",     active: false },
    { label: "Ambassador", active: false },
  ];

  return (
    <div style={{
      width: S, height: S, fontFamily: FONT, color: B.white,
      background: `linear-gradient(150deg, ${B.purple} 0%, ${B.purpleMid} 45%, ${B.navy} 100%)`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "32px", textAlign: "center",
      overflow: "hidden", position: "relative",
    }}>
      {/* 背景装飾 */}
      <div style={{
        position: "absolute", top: -60, right: -60,
        width: 200, height: 200, borderRadius: "50%",
        background: "rgba(232,184,75,0.08)",
      }} />
      <div style={{
        position: "absolute", bottom: -50, left: -50,
        width: 160, height: 160, borderRadius: "50%",
        background: "rgba(14,165,181,0.1)",
      }} />

      {/* アイコン */}
      <div style={{
        width: 82, height: 82, borderRadius: 18,
        background: `linear-gradient(135deg, ${B.gold}, ${B.goldLt})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 40, marginBottom: 18,
        boxShadow: "0 10px 36px rgba(232,184,75,0.4)",
      }}>🎫</div>

      <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
        スタンプをあつめよう
      </div>

      <div style={{
        fontSize: 12, color: "rgba(255,255,255,0.65)",
        lineHeight: 1.8, marginBottom: 24, maxWidth: 380,
      }}>
        イベントにさんかするたびに スタンプがもらえます<br/>
        「パスポート」タブでかくにんしましょう！
      </div>

      {/* スタンプグリッド */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {stampData.map((s, i) => (
          <div key={i} style={{
            width: 62, height: 62, borderRadius: 12,
            background: s.filled
              ? `linear-gradient(135deg, ${B.gold}, ${B.goldLt})`
              : "rgba(255,255,255,0.08)",
            border: s.filled ? "none" : "2px dashed rgba(255,255,255,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: s.filled ? 28 : 18,
            color: s.filled ? B.navy : "rgba(255,255,255,0.18)",
            boxShadow: s.filled ? "0 4px 16px rgba(232,184,75,0.35)" : "none",
          }}>{s.filled ? s.emoji : "?"}</div>
        ))}
      </div>

      {/* レベルバッジ列 */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 24 }}>
        {levels.map(({ label, active }) => (
          <div key={label} style={{
            padding: "4px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700,
            background: active ? "rgba(232,184,75,0.25)" : "rgba(255,255,255,0.07)",
            border: `1px solid ${active ? "rgba(232,184,75,0.6)" : "rgba(255,255,255,0.12)"}`,
            color: active ? B.gold : "rgba(255,255,255,0.35)",
          }}>{label}</div>
        ))}
      </div>

      <div style={{
        fontSize: 9, color: "rgba(255,255,255,0.22)", letterSpacing: 2,
      }}>ASHIYA COMMUNITY PASSPORT</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// メインコンポーネント
// ─────────────────────────────────────────────────────────────
const CARDS = [
  { id: "c1", label: "①パスポートとは",     filename: "01_passport_overview",  Component: Card1 },
  { id: "c2", label: "②イベント参加のしかた", filename: "02_event_howto",        Component: Card2 },
  { id: "c3", label: "③スタンプをあつめよう", filename: "03_stamps",             Component: Card3 },
];

export default function LineCards() {
  const cardRefs = useRef({});
  const [exporting, setExporting] = useState(null); // card id being exported

  const downloadOne = async (id, filename) => {
    const el = cardRefs.current[id];
    if (!el) return;
    setExporting(id);
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const a = document.createElement("a");
      a.download = `LINE_${filename}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    } finally {
      setExporting(null);
    }
  };

  const downloadAll = async () => {
    for (const card of CARDS) {
      await downloadOne(card.id, card.filename);
      await new Promise(r => setTimeout(r, 400));
    }
  };

  return (
    <div style={{ padding: "24px 20px 40px", fontFamily: "'Segoe UI','Hiragino Sans','Meiryo',sans-serif" }}>
      {/* ヘッダー */}
      <div style={{
        background: "#fff", borderRadius: 14,
        border: "1.5px solid #e2e8f0",
        padding: "18px 20px", marginBottom: 24,
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: 16, flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0d1b4b", marginBottom: 4 }}>
            📲 LINE配信用カード
          </div>
          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
            各カードを<strong>PNG（1080×1080px）</strong>でダウンロードし、LINE公式アカウントから配信してください。<br/>
            LINE公式アカウントマネージャー → 「メッセージを作成」→「画像」からアップロードできます。
          </div>
        </div>
        <button
          onClick={downloadAll}
          disabled={!!exporting}
          style={{
            padding: "10px 20px",
            background: exporting
              ? "#e2e8f0"
              : "linear-gradient(90deg, #0c7a8a, #0ea5b5)",
            color: exporting ? "#94a3b8" : "#fff",
            border: "none", borderRadius: 10,
            fontSize: 13, fontWeight: 700,
            cursor: exporting ? "not-allowed" : "pointer",
            fontFamily: "inherit", whiteSpace: "nowrap",
            boxShadow: exporting ? "none" : "0 4px 12px rgba(12,122,138,0.35)",
          }}
        >
          {exporting ? "⏳ エクスポート中..." : "📥 全部ダウンロード（3枚）"}
        </button>
      </div>

      {/* カード一覧 */}
      <div style={{
        display: "flex", gap: 28, flexWrap: "wrap",
        alignItems: "flex-start",
      }}>
        {CARDS.map(({ id, label, filename, Component }) => {
          const isExp = exporting === id;
          return (
            <div key={id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* ラベル */}
              <div style={{
                fontSize: 12, fontWeight: 700, color: "#1e293b",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {label}
                <span style={{
                  fontSize: 9, color: "#94a3b8",
                  border: "1px solid #e2e8f0", borderRadius: 4, padding: "1px 5px",
                }}>1080×1080px</span>
              </div>

              {/* カードプレビュー（スクロールで確認） */}
              <div style={{
                width: S, borderRadius: 14, overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
                outline: isExp ? "3px solid #0c7a8a" : "none",
                transition: "outline 0.2s",
              }}>
                <div ref={el => cardRefs.current[id] = el}>
                  <Component />
                </div>
              </div>

              {/* ダウンロードボタン */}
              <button
                onClick={() => downloadOne(id, filename)}
                disabled={!!exporting}
                style={{
                  padding: "9px 0",
                  background: isExp
                    ? "#e2e8f0"
                    : "linear-gradient(90deg, #0c7a8a, #0ea5b5)",
                  color: isExp ? "#94a3b8" : "#fff",
                  border: "none", borderRadius: 10, width: "100%",
                  fontSize: 12, fontWeight: 700,
                  cursor: exporting ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  boxShadow: isExp ? "none" : "0 3px 10px rgba(12,122,138,0.3)",
                }}
              >
                {isExp ? "⏳ エクスポート中..." : "📥 ダウンロード"}
              </button>
            </div>
          );
        })}
      </div>

      {/* 使い方ヒント */}
      <div style={{
        marginTop: 32,
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
        borderRadius: 12, padding: "14px 18px",
        fontSize: 12, color: "#166534", lineHeight: 1.8,
      }}>
        <strong>💡 LINE公式アカウントでの配信手順</strong><br/>
        ① LINE公式アカウントマネージャー（<code style={{ background: "#dcfce7", padding: "0 4px", borderRadius: 4 }}>https://manager.line.biz/</code>）にログイン<br/>
        ② 「メッセージを作成」→「画像」を選んでダウンロードした PNG をアップロード<br/>
        ③ 3枚をまとめて配信するときは「吹き出しを追加」で複数枚を1回のメッセージに含められます<br/>
        ④ 「絞り込み配信」で特定グループに送ることもできます
      </div>
    </div>
  );
}
