// app/api/teacher/availability/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

export async function GET(request) {
  try {
    // Get date parameter from request if provided
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    // Hardcoded teacher ID for Dr. Rajeeb
    const teacherId = 'rajeeb';
    const teacherRef = doc(db, 'teachers', teacherId);
    const teacherSnap = await getDoc(teacherRef);

    let availableDates = [];
    let timeSlots = {};

    if (teacherSnap.exists()) {
      const teacherData = teacherSnap.data();
      availableDates = teacherData.availableDates || [];
      timeSlots = teacherData.timeSlots || {};
    } else {
      // Generate default available dates if teacher doc doesn't exist
      console.log('Teacher document not found, generating default dates');

      // Generate next 4 Wednesdays
      const defaultDates = [];
      let today = new Date();

      // Find next Wednesday
      const dayOfWeek = today.getDay();
      const daysUntilWednesday = (3 - dayOfWeek + 7) % 7;
      const nextWednesday = new Date(today);
      nextWednesday.setDate(today.getDate() + daysUntilWednesday);

      // Generate 4 Wednesdays
      for (let i = 0; i < 4; i++) {
        const wednesdayDate = new Date(nextWednesday);
        wednesdayDate.setDate(nextWednesday.getDate() + (i * 7));
        defaultDates.push(wednesdayDate.toISOString());
      }

      availableDates = defaultDates;
    }

    // Get booked slots for the specific date if provided
    let bookedSlots = {};

    if (dateParam) {
      const date = new Date(dateParam);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      try {
        // Query bookings for this teacher on this date
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('teacherId', '==', teacherId),
          where('date', '>=', startOfDay),
          where('date', '<=', endOfDay)
        );

        const bookingsSnapshot = await getDocs(bookingsQuery);

        // Create a map of booked time slots
        bookingsSnapshot.forEach(doc => {
          const booking = doc.data();
          const bookingTime = booking.timeSlot;

          if (bookingTime) {
            bookedSlots[bookingTime] = true;
          }
        });
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    }

    return NextResponse.json({
      availableDates,
      timeSlots,
      bookedSlots
    });
  } catch (error) {
    console.error('Error in GET /api/teacher/availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    // Hardcoded teacher ID for Dr. Rajeeb
    const teacherId = 'rajeeb';
    const teacherRef = doc(db, 'teachers', teacherId);

    const body = await request.json();

    // Check if the teacher exists
    const teacherDoc = await getDoc(teacherRef);

    if (!teacherDoc.exists()) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Update teacher settings
    await updateDoc(teacherRef, {
      availableDates: body.availableDates || [],
      timeSlots: body.timeSlots || {},
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/teacher/availability:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}