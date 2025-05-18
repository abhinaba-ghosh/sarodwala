// app/api/bookings/[id]/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';

export async function DELETE(request, { params }) {
  try {
    const bookingId = params.id;

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Get the booking document
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Delete the booking
    await deleteDoc(bookingRef);

    console.log(`Deleted booking with ID: ${bookingId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/bookings/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}