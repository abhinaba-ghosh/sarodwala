// lib/mockData.js
// Mock teacher data
export const mockTeachers = [
  {
    id: '1',
    username: 'guruji',
    name: 'Guruji',
    instrument: 'Sarod',
    bio: 'Master of Sarod with 20+ years of teaching experience.',
    profilePicture: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: '2',
    username: 'rajeev',
    name: 'Rajeev Kumar',
    instrument: 'Tabla',
    bio: 'Tabla virtuoso trained in the Punjab gharana.',
    profilePicture: 'https://randomuser.me/api/portraits/men/68.jpg'
  }
];

// Generate time slots for a given date
export const generateMockTimeSlots = (date) => {
  const slots = [];
  const startHour = 9; // 9 AM
  const endHour = 19;  // 7 PM

  for (let hour = startHour; hour < endHour; hour++) {
    // Add slots at :00 and :30
    slots.push({
      id: `${hour}:00`,
      time: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
      available: Math.random() > 0.3 // 70% chance of being available
    });

    slots.push({
      id: `${hour}:30`,
      time: `${hour > 12 ? hour - 12 : hour}:30 ${hour >= 12 ? 'PM' : 'AM'}`,
      available: Math.random() > 0.3
    });
  }

  return slots;
};

// Mock bookings
export const mockBookings = [
  {
    id: '1',
    teacherId: '1',
    studentName: 'Riya Sen',
    phoneNumber: '+919876543210',
    date: new Date(2025, 3, 27, 10, 0), // April 27, 2025, 10:00 AM
    whatsAppOptIn: true,
    calendarSync: true,
    status: 'confirmed'
  },
  {
    id: '2',
    teacherId: '1',
    studentName: 'Arjun Das',
    phoneNumber: '+919012345678',
    date: new Date(2025, 3, 27, 11, 15), // April 27, 2025, 11:15 AM
    whatsAppOptIn: true,
    calendarSync: false,
    status: 'confirmed'
  },
  {
    id: '3',
    teacherId: '1',
    studentName: 'Priya Ghosh',
    phoneNumber: '+919834567890',
    date: new Date(2025, 3, 27, 15, 30), // April 27, 2025, 3:30 PM
    whatsAppOptIn: true,
    calendarSync: true,
    status: 'confirmed'
  }
];

// Find a teacher by username
export const findTeacherByUsername = (username) => {
  return mockTeachers.find(teacher => teacher.username === username);
};

// Get bookings for a teacher
export const getTeacherBookings = (teacherId) => {
  return mockBookings.filter(booking => booking.teacherId === teacherId);
};

// Get bookings for a specific date
export const getBookingsForDate = (teacherId, date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return mockBookings.filter(booking =>
    booking.teacherId === teacherId &&
    booking.date >= startOfDay &&
    booking.date <= endOfDay
  );
};