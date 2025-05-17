// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const twilio = require('twilio');

admin.initializeApp();

// Initialize Twilio
const accountSid = functions.config().twilio.account_sid;
const authToken = functions.config().twilio.auth_token;
const client = twilio(accountSid, authToken);
const twilioWhatsAppNumber = functions.config().twilio.whatsapp_number;

/**
 * Send a WhatsApp confirmation message when a new booking is created
 */
exports.onNewBooking = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snapshot, context) => {
    try {
      const bookingData = snapshot.data();

      // Only send WhatsApp message if user opted in
      if (!bookingData.whatsAppOptIn) {
        console.log('User did not opt in for WhatsApp messages');
        return null;
      }

      // Format the phone number for WhatsApp
      const formattedPhone = formatPhoneForWhatsApp(bookingData.phoneNumber);

      // Format the date for display
      const bookingDate = bookingData.date.toDate();
      const formattedDate = bookingDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Create the message
      const message = await client.messages.create({
        body: `Hello ${bookingData.studentName}, your Sarod class with Dr. Rajeeb Chakraborty is confirmed for ${formattedDate} at ${bookingData.timeSlot}. Please be ready 5 minutes before the class starts.`,
        from: twilioWhatsAppNumber,
        to: formattedPhone
      });

      console.log(`WhatsApp confirmation sent to ${formattedPhone}, SID: ${message.sid}`);

      // Update the booking with the message SID
      await snapshot.ref.update({
        whatsAppMessageSent: true,
        whatsAppMessageSid: message.sid,
        whatsAppMessageTimestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      return null;
    } catch (error) {
      console.error('Error sending WhatsApp confirmation:', error);
      return null;
    }
  });

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