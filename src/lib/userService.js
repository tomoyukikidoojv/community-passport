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
