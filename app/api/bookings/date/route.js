// app/api/bookings/date/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');

  // Hardcoded teacher ID for Dr. Rajeeb
  const teacherId = 'rajeeb';

  try {
    if (!dateParam) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    console.log(`Fetching bookings for date: ${dateParam}`);

    // Parse the date
    const date = new Date(dateParam);

    // Create start/end of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    // IMPORTANT: Do not filter by status - get ALL bookings
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('teacherId', '==', teacherId),
      where('date', '>=', startOfDay),
      where('date', '<=', endOfDay)
    );

    const bookingsSnapshot = await getDocs(bookingsQuery);
    console.log(`Found ${bookingsSnapshot.size} bookings for the date`);

    const bookings = [];
    bookingsSnapshot.forEach(doc => {
      const data = doc.data();

      // Format the date appropriately
      let formattedDate = null;
      if (data.date) {
        if (typeof data.date.toDate === 'function') {
          formattedDate = data.date.toDate().toISOString();
        } else if (data.date instanceof Date) {
          formattedDate = data.date.toISOString();
        } else {
          formattedDate = new Date(data.date).toISOString();
        }
      }

      const booking = {
        id: doc.id,
        ...data,
        date: formattedDate
      };

      bookings.push(booking);
      // console.log(`Booking found: ${booking.timeSlot} - ${booking.studentName}`);
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error in GET /api/bookings/date:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}