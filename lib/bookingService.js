// lib/bookingService.js
import { db } from './firebase';
import { collection, addDoc, doc, getDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

/**
 * Create a new booking
 */
export async function createBooking(bookingData) {
  try {
    // Add the booking to Firestore
    const result = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      status: 'confirmed',
      createdAt: serverTimestamp()
    });

    return {
      id: result.id,
      ...bookingData
    };
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

/**
 * Get bookings for a specific teacher
 */
export async function getTeacherBookings(teacherId, date = null) {
  try {
    let bookingsQuery;

    if (date) {
      // Convert date to Firebase timestamp if provided
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      bookingsQuery = query(
        collection(db, 'bookings'),
        where('teacherId', '==', teacherId),
        where('date', '>=', startOfDay),
        where('date', '<=', endOfDay),
        orderBy('date', 'asc')
      );
    } else {
      // Get all bookings for this teacher
      bookingsQuery = query(
        collection(db, 'bookings'),
        where('teacherId', '==', teacherId),
        orderBy('date', 'asc')
      );
    }

    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookings = [];

    bookingsSnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
        // Convert Firebase timestamp to JS Date
        date: doc.data().date?.toDate()
      });
    });

    return bookings;
  } catch (error) {
    console.error('Error getting teacher bookings:', error);
    throw error;
  }
}

/**
 * Check if a time slot is available
 */
export async function checkTimeSlotAvailability(teacherId, date, timeSlot) {
  try {
    // First convert the date and time to a Date object
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const bookingDateTime = new Date(date);
    bookingDateTime.setHours(hours, minutes, 0, 0);

    // Check if there's already a booking at this time
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('teacherId', '==', teacherId),
      where('date', '==', bookingDateTime),
      where('status', '==', 'confirmed')
    );

    const bookingsSnapshot = await getDocs(bookingsQuery);

    // If there are any bookings, the slot is not available
    return bookingsSnapshot.empty;
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    throw error;
  }
}