// app/api/bookings/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { sendBookingConfirmation } from '@/lib/whatsappService';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("Booking request received:", body);

    // Always use our single teacher's ID
    const teacherId = 'rajeeb';

    // Extract the timeSlot from the request body
    const requestedTimeSlot = body.timeSlot;
    console.log("Requested time slot:", requestedTimeSlot);

    if (!requestedTimeSlot) {
      return NextResponse.json({
        error: 'Time slot is required'
      }, { status: 400 });
    }

    // Format requested date for querying
    const requestedDate = new Date(body.date);
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Checking bookings between ${startOfDay.toISOString()} and ${endOfDay.toISOString()} for time slot ${requestedTimeSlot}`);

    // Check if this time slot is already booked - use two approaches for extra safety

    // 1. Query by exact time slot string
    const timeSlotQuery = query(
      collection(db, 'bookings'),
      where('teacherId', '==', teacherId),
      where('timeSlot', '==', requestedTimeSlot),
      where('date', '>=', startOfDay),
      where('date', '<=', endOfDay)
    );

    const timeSlotSnapshot = await getDocs(timeSlotQuery);

    // 2. Query all bookings for the day and check manually
    const dayQuery = query(
      collection(db, 'bookings'),
      where('teacherId', '==', teacherId),
      where('date', '>=', startOfDay),
      where('date', '<=', endOfDay)
    );

    const daySnapshot = await getDocs(dayQuery);

    // Check for any booking with matching time slot
    let conflictingBooking = null;
    daySnapshot.forEach(doc => {
      const booking = doc.data();
      if (booking.timeSlot === requestedTimeSlot) {
        conflictingBooking = { id: doc.id, ...booking };
      }
    });

    if (!timeSlotSnapshot.empty || conflictingBooking) {
      console.log(`Time slot ${requestedTimeSlot} is already booked. Rejecting booking.`);
      return NextResponse.json({
        error: 'This time slot is already booked. Please select another time.'
      }, { status: 409 });
    }

    // Create the booking in Firestore
    const bookingData = {
      teacherId,
      studentName: body.studentName,
      phoneNumber: body.phoneNumber,
      date: new Date(body.date),
      timeSlot: requestedTimeSlot,
      whatsAppOptIn: body.whatsAppOptIn || false,
      status: 'confirmed',
      createdAt: serverTimestamp()
    };

    const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
    console.log(`Created booking with ID: ${bookingRef.id}`);

    // Send WhatsApp confirmation if opted in
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
      } catch (error) {
        console.error("Error sending WhatsApp confirmation:", error);
        // Continue even if WhatsApp fails
      }
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