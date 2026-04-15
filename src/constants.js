// ── Color palette ──────────────────────────
export const C = {
  teal:      "#1B4F72",
  tealMid:   "#2471A3",
  tealLight: "#D6EAF8",
  tealPale:  "#EBF5FB",
  gold:      "#C9A227",
  goldLight: "#FEF9E7",
  navy:      "#1B2A6B",
  white:     "#FFFFFF",
  offWhite:  "#F7F9FC",
  charcoal:  "#2C3E50",
  gray:      "#7F8C8D",
  lightGray: "#E4EAF0",
  green:     "#1A6B45",
  greenPale: "#EAFAF1",
  red:       "#C0392B",
  redPale:   "#FDEDEC",
  purple:    "#6C3483",
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

// ── Users (mock) ───────────────────────────
export const USERS = [
  { id: 1, name: "山田 花子",     nameEn: "Hanako Yamada",  no: "2026-0042", flag: "🇯🇵", since: "2026年4月" },
  { id: 2, name: "マリア ロペス", nameEn: "Maria Lopez",    no: "2026-0043", flag: "🇧🇷", since: "2026年4月" },
  { id: 3, name: "チェン ウェイ", nameEn: "Wei Chen",       no: "2026-0044", flag: "🇨🇳", since: "2026年5月" },
  { id: 4, name: "サラ ジョーンズ", nameEn: "Sara Jones",   no: "2026-0045", flag: "🇺🇸", since: "2026年4月" },
  { id: 5, name: "カリム アリ",   nameEn: "Karim Ali",      no: "2026-0046", flag: "🇪🇬", since: "2026年6月" },
];

// ── Initial attendance ─────────────────────
export const initialAttendance = {
  1: new Set([1, 2]),
  2: new Set([1, 6]),
  3: new Set([1, 2, 3, 4, 5, 6]),
  4: new Set([1]),
  5: new Set([1, 2]),
};

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
