// lib/whatsappService.js
import twilio from 'twilio';

// Initialize Twilio client with environment variables
const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not found in environment variables');
  }

  return twilio(accountSid, authToken);
};

/**
 * Send a WhatsApp message
 */
export async function sendWhatsAppMessage(to, message) {
  try {
    const client = getTwilioClient();
    const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!twilioWhatsAppNumber) {
      throw new Error('TWILIO_WHATSAPP_NUMBER not found in environment variables');
    }

    // Format the phone number for WhatsApp
    const formattedPhone = formatPhoneForWhatsApp(to);

    // Send the message
    const sent = await client.messages.create({
      body: message,
      from: twilioWhatsAppNumber,
      to: formattedPhone
    });

    console.log(`WhatsApp message sent, SID: ${sent.sid}`);
    return { success: true, messageSid: sent.sid };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send booking confirmation via WhatsApp
 */
export async function sendBookingConfirmation(phoneNumber, studentName, date, timeSlot) {
  // Format the date for display
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Create the confirmation message
  const message = `Hello ${studentName}, your Sarod class with Dr. Rajeeb Chakraborty is confirmed for ${formattedDate} at ${timeSlot}. Please be ready 5 minutes before the class starts.`;

  // Send the message
  return sendWhatsAppMessage(phoneNumber, message);
}

/**
 * Format phone number for WhatsApp
 * Adds the 'whatsapp:' prefix and ensures proper formatting
 */
function formatPhoneForWhatsApp(phoneNumber) {
  // Remove any non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');

  // Make sure it has the country code (assuming India +91 if not provided)
  if (!cleaned.startsWith('91') && cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }

  // Add the WhatsApp prefix
  return `whatsapp:+${cleaned}`;
}