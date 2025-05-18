// lib/whatsappBusinessService.js
import axios from 'axios';

/**
 * Send a WhatsApp template message via Meta Cloud API
 */
export async function sendWhatsAppMessage(phoneNumber, studentName, date, timeSlot) {
  const WHATSAPP_BUSINESS_PHONE_NUMBER_ID = process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID;
  const WHATSAPP_BUSINESS_API_TOKEN = process.env.WHATSAPP_BUSINESS_API_TOKEN;

  if (!WHATSAPP_BUSINESS_PHONE_NUMBER_ID || !WHATSAPP_BUSINESS_API_TOKEN) {
    console.log('WhatsApp Business API credentials not configured');
    return { success: false, message: 'WhatsApp Business API not configured' };
  }

  // Format phone number (ensure country code)
  let formattedPhone = phoneNumber.replace(/\D/g, '');
  if (formattedPhone.length === 10) {
    formattedPhone = '91' + formattedPhone;
  }

  // Format date to match template sample
  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Template configuration
  const templateName = 'booking_confirmation'; // Replace with your approved name
  const languageCode = 'en'; // Or 'en_US' if that's what you selected

  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: studentName },
        { type: 'text', text: formattedDate },
        { type: 'text', text: timeSlot }
      ]
    }
  ];

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${WHATSAPP_BUSINESS_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components
        }
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_BUSINESS_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ WhatsApp Business API response:', response.data);
    return { success: true, data: response.data };

  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error('❌ Error sending WhatsApp message:', errData);
    return { success: false, error: errData };
  }
}

/**
 * Convenience wrapper for bookings
 */
export async function sendBookingConfirmation(phoneNumber, studentName, date, timeSlot) {
  return sendWhatsAppMessage(phoneNumber, studentName, date, timeSlot);
}
