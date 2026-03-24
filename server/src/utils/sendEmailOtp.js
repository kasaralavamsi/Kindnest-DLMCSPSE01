const nodemailer = require("nodemailer");

/**
 * Send a 6-digit OTP to the given email address via Gmail.
 *
 * Required env vars:
 *   SMTP_EMAIL    – your Gmail address (e.g. kindnest.app@gmail.com)
 *   SMTP_PASSWORD – Gmail App Password (NOT your regular password)
 *                   Generate at: https://myaccount.google.com/apppasswords
 */
async function sendEmailOtp(toEmail, otp) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD   // Gmail App Password
    }
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2e7d32; margin-bottom: 4px;">KindNest</h2>
      <p style="color: #555; font-size: 14px; margin-top: 0;">Your one-time login code</p>
      <div style="background: #f5f5f5; border-radius: 6px; text-align: center; padding: 24px; margin: 24px 0;">
        <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #1b5e20;">${otp}</span>
      </div>
      <p style="color: #666; font-size: 13px;">This code expires in <strong>5 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px; text-align: center;">KindNest – Connecting Communities</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"KindNest" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: `${otp} – Your KindNest login code`,
    text: `Your KindNest OTP is ${otp}. It expires in 5 minutes. Do not share it with anyone.`,
    html
  });
}

module.exports = { sendEmailOtp };
