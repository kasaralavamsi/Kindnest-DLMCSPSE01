const twilio = require("twilio");

/**
 * Send a 6-digit OTP to the given phone number via Twilio SMS.
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID  – from https://console.twilio.com
 *   TWILIO_AUTH_TOKEN   – from https://console.twilio.com
 *   TWILIO_PHONE_NUMBER – your Twilio phone number (e.g. +15551234567)
 *
 * Free Twilio trial: https://www.twilio.com/try-twilio
 * (Trial accounts can only send to verified numbers)
 */
async function sendSmsOtp(toPhone, otp) {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  await client.messages.create({
    body: `Your KindNest login code is ${otp}. It expires in 5 minutes. Do not share this code.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: toPhone
  });
}

module.exports = { sendSmsOtp };
