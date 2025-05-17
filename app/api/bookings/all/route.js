// app/api/bookings/all/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function GET() {
  try {
    // Hardcoded teacher ID
    const teacherId = 'rajeeb';

    // Fetch ALL bookings for this teacher
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('teacherId', '==', teacherId)
    );

    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookings = [];

    bookingsSnapshot.forEach(doc => {
      const data = doc.data();

      // Format the date field
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

      bookings.push({
        id: doc.id,
        ...data,
        date: formattedDate
      });
    });

    console.log(`Found ${bookings.length} total bookings`);
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error in GET /api/bookings/all:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}