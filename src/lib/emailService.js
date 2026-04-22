/**
 * EmailJS service — password reset + contact form
 *
 * ── 問い合わせテンプレートの作成手順 ──────────────────────
 * EmailJS → Email Templates → Create New Template
 *
 *   Subject: 【問い合わせ】{{from_name}} さんより
 *   To Email: (管理者のGmailアドレスを直接入力)
 *   Body:
 *     差出人: {{from_name}}
 *     メール: {{from_email}}
 *
 *     【内容】
 *     {{message}}
 *
 * → Template ID を CONTACT_TEMPLATE_ID に入力してください
 * ────────────────────────────────────────────────────────
 */

export const EMAILJS_CONFIG = {
  serviceId:          "service_l47l7q9",
  templateId:         "template_h9awnkn",   // パスワードリセット用
  contactTemplateId:  "template_93g6j6l",    // 問い合わせ用
  publicKey:          "gT4kz_tRktp84OT_u",
};

export const EMAIL_CONFIGURED =
  EMAILJS_CONFIG.serviceId && EMAILJS_CONFIG.templateId && EMAILJS_CONFIG.publicKey;

export const CONTACT_CONFIGURED =
  EMAILJS_CONFIG.serviceId && EMAILJS_CONFIG.contactTemplateId && EMAILJS_CONFIG.publicKey;

/** パスワードリセットメール送信 */
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
    console.error("EmailJS reset error:", err);
    return "error";
  }
}

/** 問い合わせフォーム送信（管理者へ） */
export async function sendContactEmail(fromName, fromEmail, message) {
  if (!CONTACT_CONFIGURED) return "not_configured";
  try {
    const emailjs = await import("@emailjs/browser");
    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.contactTemplateId,
      { from_name: fromName, from_email: fromEmail, message },
      { publicKey: EMAILJS_CONFIG.publicKey }
    );
    return "sent";
  } catch (err) {
    console.error("EmailJS contact error:", err);
    return "error";
  }
}
