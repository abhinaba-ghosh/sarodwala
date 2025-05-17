// app/api/whatsapp/route.js
import { NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsappService';

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate request body
    if (!body.phoneNumber || !body.message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Send WhatsApp message
    const result = await sendWhatsAppMessage(body.phoneNumber, body.message);

    if (!result.success) {
      return NextResponse.json(
        { error: `Failed to send WhatsApp message: ${result.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageSid: result.messageSid
    });
  } catch (error) {
    console.error('Error in WhatsApp API:', error);
    return NextResponse.json(
      { error: 'Failed to send WhatsApp message' },
      { status: 500 }
    );
  }
}