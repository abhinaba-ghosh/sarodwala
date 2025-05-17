// app/api/teacher/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET() {
  try {
    // Hardcoded teacher ID for Dr. Rajeeb
    const teacherId = 'rajeeb';
    const teacherRef = doc(db, 'teachers', teacherId);
    const teacherSnap = await getDoc(teacherRef);

    if (!teacherSnap.exists()) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const teacher = {
      id: teacherSnap.id,
      ...teacherSnap.data()
    };

    return NextResponse.json(teacher);
  } catch (error) {
    console.error('Error in GET /api/teacher:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}