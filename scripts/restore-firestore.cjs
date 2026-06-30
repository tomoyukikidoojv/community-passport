// Firestore 復元スクリプト
// 使い方:
//   1. GitHub Actions → Backup Firestore → 該当 run → Artifacts からzipをダウンロード
//   2. 展開して .json.gz を gunzip で解凍 → backup-*.json を得る
//      例: gunzip backup-2026-06-30T03-00-00.json.gz
//   3. このスクリプトを実行:
//      FIREBASE_SERVICE_ACCOUNT="$(cat serviceAccountKey.json)" \
//        node scripts/restore-firestore.cjs backup-2026-06-30T03-00-00.json
//
// ⚠️ 注意: 既存のドキュメントは上書きされます。部分復元したい場合は
//   COLLECTIONS 変数で対象コレクションを絞ってください。

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// 復元対象コレクション（絞りたい場合はここを編集）
const COLLECTIONS = [
  "users",
  "announcements",
  "attendance",
  "rsvp",
  "applications",
  "config",
];

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) {
  console.error("ERROR: FIREBASE_SERVICE_ACCOUNT 環境変数が設定されていません");
  console.error("  export FIREBASE_SERVICE_ACCOUNT=\"$(cat serviceAccountKey.json)\"");
  process.exit(1);
}

const backupFile = process.argv[2];
if (!backupFile) {
  console.error("ERROR: バックアップファイルを引数で指定してください");
  console.error("  node scripts/restore-firestore.cjs backup-YYYY-MM-DDTHH-MM-SS.json");
  process.exit(1);
}

const serviceAccount = JSON.parse(raw);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "community-passport-616ae",
});
const db = admin.firestore();

// バックアップ時に変換した Timestamp を元に戻す
function deserializeValue(val) {
  if (val === null || val === undefined) return val;
  if (typeof val === "object" && val._type === "Timestamp") {
    return new admin.firestore.Timestamp(val._seconds, val._nanoseconds);
  }
  if (Array.isArray(val)) return val.map(deserializeValue);
  if (typeof val === "object") {
    const out = {};
    for (const [k, v] of Object.entries(val)) out[k] = deserializeValue(v);
    return out;
  }
  return val;
}

async function restore() {
  const filePath = path.resolve(backupFile);
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: ファイルが見つかりません: ${filePath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let totalDocs = 0;

  for (const colName of COLLECTIONS) {
    if (!data[colName]) {
      console.log(`  ⏭  ${colName}: バックアップに存在しないのでスキップ`);
      continue;
    }

    const entries = Object.entries(data[colName]);
    if (entries.length === 0) {
      console.log(`  ⏭  ${colName}: 0 docs`);
      continue;
    }

    // Firestore は1バッチ最大500件
    const BATCH_SIZE = 400;
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = db.batch();
      entries.slice(i, i + BATCH_SIZE).forEach(([docId, docData]) => {
        const ref = db.collection(colName).doc(docId);
        batch.set(ref, deserializeValue(docData));
      });
      await batch.commit();
    }

    console.log(`  ✅ ${colName}: ${entries.length} docs 復元`);
    totalDocs += entries.length;
  }

  console.log(`\n✅ 復元完了: ${totalDocs} docs`);
}

restore().catch(err => {
  console.error("復元失敗:", err);
  process.exit(1);
});
