// lib/whatsappBusinessService.js
import axios from 'axios';

/**
 * Send a message via WhatsApp Business API
 * Note: Requires proper setup of a Meta WhatsApp Business account and API credentials
 */
export async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    // These will need to be updated with the teacher's credentials
    const WHATSAPP_BUSINESS_PHONE_NUMBER_ID = process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID;
    const WHATSAPP_BUSINESS_API_TOKEN = process.env.WHATSAPP_BUSINESS_API_TOKEN;

    if (!WHATSAPP_BUSINESS_PHONE_NUMBER_ID || !WHATSAPP_BUSINESS_API_TOKEN) {
      console.log('WhatsApp Business API credentials not configured');
      return { success: false, message: 'WhatsApp Business API not configured' };
    }

    // Format the phone number (remove non-digits and ensure it has country code)
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone; // Add India country code if missing
    }

    // Make the API call to WhatsApp Business API
    const response = await axios({
      method: 'POST',
      url: `https://graph.facebook.com/v18.0/${WHATSAPP_BUSINESS_PHONE_NUMBER_ID}/messages`,
      headers: {
        'Authorization': `Bearer ${WHATSAPP_BUSINESS_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: message
        }
      }
    });

    console.log('WhatsApp Business API response:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.response?.data || error.message);
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

  //Send the message
  return sendWhatsAppMessage(phoneNumber, message);

//  // Log what would be sent
//   console.log('MOCK: WhatsApp confirmation message:', message);

//   // Always return success for now
//   return { success: true };
}