import { doc, setDoc, getDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

// Sanitize email for use as Firestore document ID
const emailToId = (email) => email.toLowerCase().trim().replace(/\./g, ",");

/** 登録時・ログイン時にユーザーデータをクラウドに保存 */
export async function saveUserToCloud(user) {
  if (!user?.email) return false;
  try {
    const ref = doc(db, "users", emailToId(user.email));
    await setDoc(ref, user, { merge: true });
    return true;
  } catch (err) {
    console.error("saveUserToCloud error:", err);
    return false;
  }
}

// ── Attendance (スタンプ) Cloud Sync ──────────────────────────

/** スタンプをクラウドに保存 */
export async function saveAttendanceToCloud(userId, stamps) {
  if (!userId) return false;
  try {
    const ref = doc(db, "attendance", String(userId));
    await setDoc(ref, { stamps: [...stamps] });
    return true;
  } catch (err) {
    console.error("saveAttendanceToCloud error:", err);
    return false;
  }
}

/** 利用者用: 自分のスタンプをFirebaseから取得 */
export async function fetchUserAttendance(userId) {
  if (!userId) return null;
  try {
    const ref = doc(db, "attendance", String(userId));
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return new Set(snap.data().stamps || []);
  } catch (err) {
    console.error("fetchUserAttendance error:", err);
    return null;
  }
}

/** 管理者用: 全ユーザーのスタンプを取得 */
export async function fetchAllAttendance() {
  try {
    const snap = await getDocs(collection(db, "attendance"));
    const result = {};
    snap.docs.forEach(d => {
      result[Number(d.id)] = new Set(d.data().stamps || []);
    });
    return result;
  } catch (err) {
    console.error("fetchAllAttendance error:", err);
    return {};
  }
}

/** 管理者用: Firebase の全ユーザーを取得 */
export async function fetchAllUsers() {
  try {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map(d => d.data());
  } catch (err) {
    console.error("fetchAllUsers error:", err);
    return [];
  }
}

// ── Announcements Cloud Sync ──────────────────────────

/** お知らせ一覧をクラウドから取得 (空ならnull) */
export async function fetchAnnouncements() {
  try {
    const snap = await getDocs(collection(db, "announcements"));
    if (snap.empty) return null;
    return snap.docs.map(d => d.data()).sort((a, b) => (b.id || 0) - (a.id || 0));
  } catch (err) {
    console.error("fetchAnnouncements error:", err);
    return null;
  }
}

/** お知らせをクラウドに保存（新規 or 更新） */
export async function saveAnnouncementToCloud(item) {
  try {
    const ref = doc(db, "announcements", String(item.id));
    await setDoc(ref, item);
    return true;
  } catch (err) {
    console.error("saveAnnouncementToCloud error:", err);
    return false;
  }
}

/** お知らせをクラウドから削除 */
export async function deleteAnnouncementFromCloud(id) {
  try {
    const ref = doc(db, "announcements", String(id));
    await deleteDoc(ref);
    return true;
  } catch (err) {
    console.error("deleteAnnouncementFromCloud error:", err);
    return false;
  }
}

// ── Events Cloud Sync ──────────────────────────────────

/** イベント一覧をFirebaseから取得（なければnull） */
export async function fetchEventsFromCloud() {
  try {
    const ref = doc(db, "config", "events");
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data().events;
    if (!data || data.length === 0) return null;
    return data;
  } catch (err) {
    console.error("fetchEventsFromCloud error:", err);
    return null;
  }
}

/** イベント一覧をFirebaseに保存 */
export async function saveEventsToCloud(events) {
  try {
    const ref = doc(db, "config", "events");
    await setDoc(ref, { events });
    return true;
  } catch (err) {
    console.error("saveEventsToCloud error:", err);
    return false;
  }
}

// ── Forms Cloud Sync ─────────────────────────────────

/** アンケートフォーム設定をFirebaseから取得 */
export async function fetchFormsFromCloud() {
  try {
    const ref = doc(db, "config", "forms");
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data().forms || null;
  } catch (err) {
    console.error("fetchFormsFromCloud error:", err);
    return null;
  }
}

/** アンケートフォーム設定をFirebaseに保存 */
export async function saveFormsToCloud(forms) {
  try {
    const ref = doc(db, "config", "forms");
    await setDoc(ref, { forms });
    return true;
  } catch (err) {
    console.error("saveFormsToCloud error:", err);
    return false;
  }
}

// ── Applications Cloud Sync ────────────────────────

/** 申し込みデータをFirebaseに保存 */
export async function saveApplicationToCloud(app) {
  try {
    const key = `${app.eventId}_${app.userId}`;
    const ref = doc(db, "applications", key);
    await setDoc(ref, app);
    return true;
  } catch (err) {
    console.error("saveApplicationToCloud error:", err);
    return false;
  }
}

/** 全申し込みデータをFirebaseから取得 */
export async function fetchAllApplicationsFromCloud() {
  try {
    const snap = await getDocs(collection(db, "applications"));
    return snap.docs.map(d => d.data());
  } catch (err) {
    console.error("fetchAllApplicationsFromCloud error:", err);
    return [];
  }
}

// ── RSVP Cloud Sync ──────────────────────────────
// 構造: rsvp/{userId} → { entries: { eventId: "going"|"not_going" } }
// ユーザーごと1文書 = 読み取り1回で済む（コレクション全スキャン不要）

/** 利用者自身のRSVPをFirebaseに保存（ユーザー単位で1文書） */
export async function saveUserRsvpToCloud(userId, rsvpEntries) {
  // rsvpEntries: { [eventId]: "going" | "not_going" }
  if (!userId) return false;
  try {
    const ref = doc(db, "rsvp", String(userId));
    await setDoc(ref, { entries: rsvpEntries });
    return true;
  } catch (err) {
    console.error("saveUserRsvpToCloud error:", err);
    return false;
  }
}

/** 利用者自身のRSVPをFirebaseから取得（1文書読み取り） */
export async function fetchUserRsvpFromCloud(userId) {
  if (!userId) return {};
  try {
    const ref = doc(db, "rsvp", String(userId));
    const snap = await getDoc(ref);
    if (!snap.exists()) return {};
    const entries = snap.data().entries || {};
    // CalendarPageが使う形式 { "userId_eventId": status } に変換
    const result = {};
    Object.entries(entries).forEach(([eventId, status]) => {
      result[`${userId}_${eventId}`] = status;
    });
    return result;
  } catch (err) {
    console.error("fetchUserRsvpFromCloud error:", err);
    return {};
  }
}

/** 管理者用: 全ユーザーのRSVPを取得（ユーザー数分の読み取り） */
export async function fetchAllRsvpFromCloud() {
  try {
    const snap = await getDocs(collection(db, "rsvp"));
    const result = {};
    snap.docs.forEach(d => {
      const userId = d.id;
      const entries = d.data().entries || {};
      Object.entries(entries).forEach(([eventId, status]) => {
        result[`${userId}_${eventId}`] = status;
      });
    });
    return result;
  } catch (err) {
    console.error("fetchAllRsvpFromCloud error:", err);
    return {};
  }
}

/** 別デバイスからのログイン: メール＋パスワードでユーザーを取得 */
export async function fetchUserByCredentials(email, password) {
  if (!email || !password) return "not_found";
  try {
    const ref = doc(db, "users", emailToId(email));
    const snap = await getDoc(ref);
    if (!snap.exists()) return "not_found";
    const user = snap.data();
    if (user.password !== password) return "wrong_password";
    return user;
  } catch (err) {
    console.error("fetchUserByCredentials error:", err);
    return "error";
  }
}
