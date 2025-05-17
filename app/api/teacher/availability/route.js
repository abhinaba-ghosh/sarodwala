// app/api/teacher/availability/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function GET() {
  try {
    // Hardcoded teacher ID for Dr. Rajeeb
    const teacherId = 'rajeeb';
    const teacherRef = doc(db, 'teachers', teacherId);
    const teacherSnap = await getDoc(teacherRef);

    if (!teacherSnap.exists()) {
      return NextResponse.json({
        availableDates: [],
        timeSlots: {}
      });
    }

    const teacherData = teacherSnap.data();

    return NextResponse.json({
      availableDates: teacherData.availableDates || [],
      timeSlots: teacherData.timeSlots || {}
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

    // Update teacher settings
    await updateDoc(teacherRef, {
      availableDates: body.availableDates || [],
      timeSlots: body.timeSlots || {},
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/teacher/availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}