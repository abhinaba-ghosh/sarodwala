// lib/teacherService.js
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Get teacher profile by ID
 */
export async function getTeacherById(teacherId) {
  try {
    const teacherRef = doc(db, 'teachers', teacherId);
    const teacherSnap = await getDoc(teacherRef);

    if (teacherSnap.exists()) {
      return { id: teacherSnap.id, ...teacherSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting teacher:', error);
    throw error;
  }
}

/**
 * Set teacher availability settings
 */
export async function updateTeacherSettings(teacherId, settings) {
  try {
    const teacherRef = doc(db, 'teachers', teacherId);

    // First check if the teacher exists
    const teacherSnap = await getDoc(teacherRef);

    if (teacherSnap.exists()) {
      // Update existing teacher
      await updateDoc(teacherRef, {
        availableDates: settings.availableDates,
        timeSlots: settings.timeSlots,
        updatedAt: serverTimestamp()
      });
    } else {
      // Create new teacher
      await setDoc(teacherRef, {
        ...settings,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating teacher settings:', error);
    throw error;
  }
}

/**
 * Get teacher's available dates and time slots
 */
export async function getTeacherAvailability(teacherId) {
  try {
    const teacherRef = doc(db, 'teachers', teacherId);
    const teacherSnap = await getDoc(teacherRef);

    if (teacherSnap.exists()) {
      const data = teacherSnap.data();
      return {
        availableDates: data.availableDates || [],
        timeSlots: data.timeSlots || {}
      };
    } else {
      return {
        availableDates: [],
        timeSlots: {}
      };
    }
  } catch (error) {
    console.error('Error getting teacher availability:', error);
    throw error;
  }
}