const twilio = require('twilio');

/**
 * Lazily initialize and return Twilio client and configured phone number.
 * Returns null if credentials are missing.
 */
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER; // E.164 format, e.g. +1234567890
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || phoneNumber; // prefer explicit WhatsApp number

  if (!accountSid || !authToken || !phoneNumber) {
    console.error('❌ Missing Twilio credentials in env:', {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasPhoneNumber: !!phoneNumber,
      hasWhatsappNumber: !!process.env.TWILIO_WHATSAPP_NUMBER,
    });
    return null;
  }

  try {
    const client = twilio(accountSid, authToken);
    return { client, phoneNumber, whatsappNumber };
  } catch (err) {
    console.error('❌ Failed to initialize Twilio client:', err && err.message);
    return null;
  }
}

module.exports = { getTwilioClient };
