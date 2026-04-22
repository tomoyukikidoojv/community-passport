import { doc, setDoc, getDoc } from "firebase/firestore";
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
