 // app/api/bookings/route.js (simpler version)
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendBookingConfirmation } from '@/lib/whatsappService';

export async function POST(request) {
  try {
    const body = await request.json();

    // Always use our single teacher's ID
    const teacherId = 'rajeeb';

    // Create the booking in Firestore
    const bookingData = {
      teacherId,
      studentName: body.studentName,
      phoneNumber: body.phoneNumber,
      date: new Date(body.date),
      timeSlot: body.timeSlot,
      whatsAppOptIn: body.whatsAppOptIn || false,
      calendarSync: body.calendarSync || false,
      gmailId: body.calendarSync ? body.gmailId : null,
      status: 'confirmed',
      createdAt: serverTimestamp()
    };

    const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);

    // Send WhatsApp confirmation if opted in
    let whatsappResult = { success: false };

    if (bookingData.whatsAppOptIn) {
      whatsappResult = await sendBookingConfirmation(
        bookingData.phoneNumber,
        bookingData.studentName,
        bookingData.date,
        bookingData.timeSlot
      );
    }

    return NextResponse.json({
      id: bookingRef.id,
      ...bookingData,
      date: bookingData.date.toISOString(), // Convert Date to string for JSON response
      whatsAppMessageSent: whatsappResult.success
    });
  } catch (error) {
    console.error('Error in POST /api/bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}