// app/api/bookings/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
import { sendBookingConfirmation } from '@/lib/whatsappBusinessService';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("Booking request received:", body);

    const teacherId = 'rajeeb';
    const requestedTimeSlot = body.timeSlot;

    if (!requestedTimeSlot) {
      return NextResponse.json({ error: 'Time slot is required' }, { status: 400 });
    }

    const requestedDate = new Date(body.date);
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const timeSlotQuery = query(
      collection(db, 'bookings'),
      where('teacherId', '==', teacherId),
      where('timeSlot', '==', requestedTimeSlot),
      where('date', '>=', startOfDay),
      where('date', '<=', endOfDay)
    );

    const timeSlotSnapshot = await getDocs(timeSlotQuery);

    if (!timeSlotSnapshot.empty) {
      console.log(`Time slot ${requestedTimeSlot} is already booked.`);
      return NextResponse.json({
        error: 'This time slot is already booked. Please select another time.'
      }, { status: 409 });
    }

    const bookingData = {
      teacherId,
      studentName: body.studentName,
      phoneNumber: body.phoneNumber,
      date: new Date(body.date),
      timeSlot: requestedTimeSlot,
      whatsAppOptIn: body.whatsAppOptIn || false,
      status: 'confirmed',
      createdAt: serverTimestamp(),
      whatsAppMessageSent: false
    };

    const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
    console.log(`Created booking with ID: ${bookingRef.id}`);

    let whatsappResult = { success: false };

    if (bookingData.whatsAppOptIn) {
      try {
        whatsappResult = await sendBookingConfirmation(
          bookingData.phoneNumber,
          bookingData.studentName,
          bookingData.date,
          bookingData.timeSlot
        );

        console.log("WhatsApp confirmation result:", whatsappResult);

        if (whatsappResult.success) {
          const docRef = doc(db, 'bookings', bookingRef.id);
          await updateDoc(docRef, {
            whatsAppMessageSent: true,
            whatsAppMessageTimestamp: serverTimestamp()
          });
        }
      } catch (error) {
        console.error("Error sending WhatsApp confirmation:", error);
      }
    }

    return NextResponse.json({
      id: bookingRef.id,
      ...bookingData,
      date: bookingData.date.toISOString(),
      whatsAppMessageSent: whatsappResult.success
    });

  } catch (error) {
    console.error('Error in POST /api/bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
