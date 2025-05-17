// lib/initDatabase.js
import { db } from './firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export async function initializeDatabase() {
  try {
    const teacherId = 'rajeeb';
    const teacherRef = doc(db, 'teachers', teacherId);

    // Check if teacher already exists
    const teacherSnap = await getDoc(teacherRef);

    if (!teacherSnap.exists()) {
      // Generate next 4 Wednesdays for default availability
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

      // Create initial teacher document with default available dates
      await setDoc(teacherRef, {
        name: "Dr. Rajeeb Chakraborty",
        instrument: "Sarod",
        bio: "Acclaimed sarod maestro with over 30 years of performance experience across global stages. Dr. Chakraborty blends traditional techniques with innovative approaches for students of all levels.",
        profilePicture: "/images/teacher_profile.jpg",
        availableDates: defaultDates,
        timeSlots: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('Teacher document initialized successfully with default dates');
      return true;
    }

    console.log('Teacher document already exists');
    return false;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}