// Firestore 全コレクションをJSONにエクスポートするバックアップスクリプト
// GitHub Actions から実行される。FIREBASE_SERVICE_ACCOUNT 環境変数が必要。
//
// 復元方法:
//   1. Actions → Backup Firestore → 該当 run の Artifacts から zip をダウンロード
//   2. 展開 → backup-YYYY-MM-DDTHH-MM-SS.json.gz を gunzip
//   3. Firebase Console または firebase-admin スクリプトでドキュメントを書き戻す

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) {
  console.error("ERROR: FIREBASE_SERVICE_ACCOUNT secret is not set");
  process.exit(1);
}

const serviceAccount = JSON.parse(raw);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "community-passport-616ae",
});

const db = admin.firestore();

// バックアップ対象コレクション
const COLLECTIONS = [
  "users",
  "announcements",
  "attendance",
  "rsvp",
  "applications",
  "config",
];

// Firestore の Timestamp など特殊型を JSON シリアライズ可能な形に変換
function serializeValue(val) {
  if (val === null || val === undefined) return val;
  if (val instanceof admin.firestore.Timestamp) return { _type: "Timestamp", _seconds: val.seconds, _nanoseconds: val.nanoseconds };
  if (Array.isArray(val)) return val.map(serializeValue);
  if (typeof val === "object") {
    const out = {};
    for (const [k, v] of Object.entries(val)) out[k] = serializeValue(v);
    return out;
  }
  return val;
}

async function backup() {
  const result = {};
  let totalDocs = 0;

  for (const colName of COLLECTIONS) {
    const snap = await db.collection(colName).get();
    result[colName] = {};
    snap.docs.forEach(doc => {
      result[colName][doc.id] = serializeValue(doc.data());
    });
    console.log(`  ✅ ${colName}: ${snap.size} docs`);
    totalDocs += snap.size;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `backup-${timestamp}.json`;
  const outDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const json = JSON.stringify(result, null, 2);
  const gzPath = path.join(outDir, filename + ".gz");
  fs.writeFileSync(gzPath, zlib.gzipSync(Buffer.from(json, "utf8")));

  const sizeKb = (fs.statSync(gzPath).size / 1024).toFixed(1);
  console.log(`\n✅ Backup complete: ${filename}.gz (${sizeKb} KB, ${totalDocs} docs total)`);

  // 壊れていないか検証
  zlib.gunzipSync(fs.readFileSync(gzPath));
  console.log("✅ gzip integrity verified");
}

backup().catch(err => {
  console.error("Backup failed:", err);
  process.exit(1);
});
