// app/api/bookings/date/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export async function GET(request) {
  // Hardcoded teacher ID for Dr. Rajeeb
  const teacherId = 'rajeeb';
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');

  try {
    let bookingsQuery;

    if (dateParam) {
      // Convert date string to start and end of day
      const date = new Date(dateParam);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Query bookings for the specified date
      bookingsQuery = query(
        collection(db, 'bookings'),
        where('teacherId', '==', teacherId),
        where('date', '>=', startOfDay),
        where('date', '<=', endOfDay),
        orderBy('date', 'asc')
      );
    } else {
      // Query all bookings for this teacher
      bookingsQuery = query(
        collection(db, 'bookings'),
        where('teacherId', '==', teacherId),
        orderBy('date', 'asc')
      );
    }

    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookings = [];

    bookingsSnapshot.forEach((doc) => {
      const data = doc.data();
      bookings.push({
        id: doc.id,
        ...data,
        date: data.date.toDate().toISOString() // Convert Firestore timestamp to ISO string
      });
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error in GET /api/bookings/date:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}