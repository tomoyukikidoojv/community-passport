/**
 * EmailJS password reset service
 *
 * ── セットアップ手順 ─────────────────────────────────────
 * 1. https://www.emailjs.com/ でアカウント作成（無料）
 * 2. Email Services → "Add New Service" → Gmail などを連携
 * 3. Email Templates → "Create New Template" → 下記内容で作成:
 *
 *    Subject: コミュニティパスポート - パスワードのご確認
 *    Body:
 *      {{name}} さん、こんにちは。
 *
 *      パスワード再設定のリクエストがありました。
 *      あなたのパスワードは: {{password}}
 *
 *      ご不明な点はスタッフまでお問い合わせください。
 *
 * 4. Account → General → Public Key をコピー
 * 5. 下記の3つの値を入力してください:
 * ────────────────────────────────────────────────────────
 */

export const EMAILJS_CONFIG = {
  serviceId:  "",   // 例: "service_xxxxxxx"
  templateId: "",   // 例: "template_xxxxxxx"
  publicKey:  "",   // 例: "xxxxxxxxxxxxxxxxxxxx"
};

export const EMAIL_CONFIGURED =
  EMAILJS_CONFIG.serviceId && EMAILJS_CONFIG.templateId && EMAILJS_CONFIG.publicKey;

/**
 * パスワードリセットメールを送信する
 * @param {string} toEmail  - 送信先メールアドレス
 * @param {string} name     - ユーザー名
 * @param {string} password - 現在のパスワード
 * @returns {Promise<"sent"|"not_configured"|"error">}
 */
export async function sendPasswordResetEmail(toEmail, name, password) {
  if (!EMAIL_CONFIGURED) return "not_configured";

  try {
    const emailjs = await import("@emailjs/browser");
    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      { to_email: toEmail, name, password },
      { publicKey: EMAILJS_CONFIG.publicKey }
    );
    return "sent";
  } catch (err) {
    console.error("EmailJS error:", err);
    return "error";
  }
}
