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
      // Create initial teacher document
      await setDoc(teacherRef, {
        name: "Dr. Rajeeb Chakraborty",
        instrument: "Sarod",
        bio: "Acclaimed sarod maestro with over 30 years of performance experience across global stages. Dr. Chakraborty blends traditional techniques with innovative approaches for students of all levels.",
        profilePicture: "/images/teacher_profile.jpg",
        availableDates: [], // Will be populated by settings page
        timeSlots: {},      // Will be populated by settings page
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('Teacher document initialized successfully');
      return true;
    }

    console.log('Teacher document already exists');
    return false;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}