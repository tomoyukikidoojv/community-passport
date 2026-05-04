// ── Mountain silhouette (六甲山) — nav banner用（高めの不透明度） ──
export const MTN_SVG_NAV = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 220" preserveAspectRatio="none">' +
  '<path d="M0,220 L0,190 C60,178 120,165 180,154 C240,143 300,132 360,121 C410,112 455,104 500,95 C535,88 568,82 600,76 C628,71 655,66 682,61 C708,57 732,53 755,50 C775,47 795,45 815,43 C833,41 851,40 869,39 C886,38 903,38 920,38 C937,38 953,39 969,41 C986,43 1003,46 1022,51 C1045,57 1070,65 1098,77 C1128,90 1160,107 1200,128 C1240,149 1290,175 1360,198 L1440,220 Z" fill="rgba(255,255,255,0.18)"/>' +
  '</svg>'
);

// ── Color palette ──────────────────────────
export const C = {
  teal:      "#0c7a8a",
  tealMid:   "#0ea5b5",
  tealLight: "#cdf0f5",
  tealPale:  "#e8f9fb",
  gold:      "#e8b84b",
  goldLight: "#fdf6e3",
  navy:      "#0d1b4b",
  white:     "#FFFFFF",
  offWhite:  "#f8fafc",
  charcoal:  "#1e293b",
  gray:      "#64748b",
  lightGray: "#e2e8f0",
  green:     "#059669",
  greenPale: "#d1fae5",
  red:       "#dc2626",
  redPale:   "#fee2e2",
  purple:    "#7c3aed",

  // ── Glassmorphism design system ──────────
  // 芦屋川イラストを薄く透かしたグラデーション背景
  // ※ /public/ashiyagawa.jpg を置くと画像が表示されます
  bgGradient: "linear-gradient(135deg, rgba(30,10,60,0.90) 0%, rgba(13,27,75,0.90) 38%, rgba(12,66,112,0.90) 65%, rgba(11,122,107,0.90) 100%), url('/ashiyagawa.jpg') center/cover fixed",
  // ガラスカード
  glassWhite:  "rgba(255,255,255,0.93)",
  glass:       "rgba(255,255,255,0.10)",
  glassMid:    "rgba(255,255,255,0.18)",
  glassBorder: "rgba(255,255,255,0.22)",
  // ナビゲーション
  navBg:       "rgba(8,16,50,0.72)",
};

// ── Events (6 total) ───────────────────────
export const EVENTS = [
  { id: 1, emoji: "🌏", name: "Multicultural\nWelcome Meetup", nameShort: "Welcome Meetup",    date: "5月",  fullDate: "2026-05-15", time: "14:00〜16:00", place: "芦屋市民センター 大ホール",    color: "#1B4F72", applyUrl: "" },
  { id: 2, emoji: "🍽️", name: "Exchange\nDinner",              nameShort: "Exchange Dinner",   date: "6月",  fullDate: "2026-06-21", time: "18:00〜20:00", place: "芦屋市立市民センター 会議室",  color: "#2471A3", applyUrl: "" },
  { id: 3, emoji: "📖", name: "Storytelling\nNight",           nameShort: "Storytelling Night",date: "9月",  fullDate: "2026-09-12", time: "15:00〜17:00", place: "芦屋図書館 多目的室",          color: "#8E44AD", applyUrl: "" },
  { id: 4, emoji: "💬", name: "Dialogue\nSession",             nameShort: "Dialogue Session",  date: "11月", fullDate: "2026-11-07", time: "14:00〜16:00", place: "芦屋市民センター 研修室",      color: "#1A6B45", applyUrl: "" },
  { id: 5, emoji: "💡", name: "Community Ideas\nWorkshop",     nameShort: "Ideas Workshop",    date: "2月",  fullDate: "2027-02-06", time: "13:00〜16:00", place: "芦屋市立市民センター 大会議室", color: "#9B3A1B", applyUrl: "" },
  { id: 6, emoji: "🚨", name: "防災講座",                       nameShort: "防災講座",           date: "10月", fullDate: "2026-10-17", time: "10:00〜12:00", place: "芦屋市消防署",                color: "#C0392B", applyUrl: "" },
];

// ── Users ─────────────────────────────────
// 管理者画面では Firebase から動的に取得するため、ここは空
export const USERS = [];

// ── Initial attendance ─────────────────────
export const initialAttendance = {};

// ── Announcement categories ────────────────
export const NOTICE_CATS = [
  { id: "event",     label: "イベント",     color: "#2471A3" },
  { id: "important", label: "重要",         color: "#C0392B" },
  { id: "disaster",  label: "防災",         color: "#D35400" },
  { id: "community", label: "コミュニティ", color: "#1A6B45" },
];

// ── Announcements (mock) ───────────────────
export const initialAnnouncements = [
  {
    id: 1,
    date: "2026-03-14",
    category: "event",
    title: "5月 Welcome Meetup の会場が決まりました",
    body: "5月15日（土）14:00〜16:00、芦屋市民センター 大ホールにて開催します。参加ご希望の方はコミュニティパスポートを持参のうえ受付でQRコードを提示してください。飲み物・軽食をご用意しています。",
  },
  {
    id: 2,
    date: "2026-03-10",
    category: "important",
    title: "パスポートQRコードの使い方ガイドを更新しました",
    body: "イベント会場でのQRスキャン手順をわかりやすく改訂しました。受付にてスタッフへパスポート画面を提示するだけでスタンプが記録されます。不明な点は事務局までお問い合わせください。",
  },
  {
    id: 3,
    date: "2026-03-05",
    category: "disaster",
    title: "10月 防災講座の申込受付を開始します",
    body: "芦屋市防災担当と共催する防災講座を10月に予定しています。外国籍市民向けの多言語資料（英・中・スペイン・ポルトガル語）を用意します。詳細は追ってお知らせします。",
  },
  {
    id: 4,
    date: "2026-02-20",
    category: "community",
    title: "コミュニティだより 2026年春号を発行しました",
    body: "各国の春の行事紹介、昨年度の活動報告、メンバーインタビューなどを掲載しています。市役所・図書館・各コミュニティセンターで配布中。PDFはウェブサイトからもご覧いただけます。",
  },
  {
    id: 5,
    date: "2026-02-10",
    category: "event",
    title: "2月 Community Ideas Workshop 開催レポート",
    body: "2月8日に開催したワークショップには14カ国・42名にご参加いただきました。「もっと気軽に相談できる窓口がほしい」「子どもたちの交流イベントを増やしてほしい」など多くのご意見をいただきました。",
  },
];

// ── Level system ───────────────────────────
export function getLevel(count) {
  if (count === 0) return { label: "Newcomer",   color: "#7F8C8D", next: 1 };
  if (count <= 2)  return { label: "Explorer",   color: "#2471A3", next: 3 };
  if (count <= 4)  return { label: "Regular",    color: "#1A6B45", next: 5 };
  if (count <= 5)  return { label: "Active",     color: "#C9A227", next: 6 };
  return                  { label: "Ambassador", color: "#1B2A6B", next: 6 };
}
