// app/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function BookingPage() {
  const [teacher, setTeacher] = useState({
    name: "Dr. Rajeeb Chakraborty",
    instrument: "Sarod",
    bio: "Acclaimed sarod maestro with over 30 years of performance experience across global stages. Dr. Chakraborty blends traditional techniques with innovative approaches for students of all levels.",
    profilePicture: "/images/teacher_profile.jpg"
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [wednesdayOptions, setWednesdayOptions] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [customTimeSlots, setCustomTimeSlots] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    whatsAppOptIn: true,
    calendarSync: false,
    gmailId: ''
  });
  const [loading, setIsLoading] = useState(true);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get next Wednesday
  function getNextWednesday() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilWednesday = (3 - dayOfWeek + 7) % 7;

    // If today is Wednesday and it's before cutoff time, use today
    if (dayOfWeek === 3 && today.getHours() < 17) { // Before 5 PM
      return today;
    }

    const nextWednesday = new Date(today);
    nextWednesday.setDate(today.getDate() + daysUntilWednesday);
    return nextWednesday;
  }

  // Load teacher info
  useEffect(() => {
    async function loadTeacher() {
      try {
        const response = await fetch('/api/teacher');

        if (!response.ok) {
          throw new Error('Failed to load teacher information');
        }

        const teacherData = await response.json();
        setTeacher(teacherData);
      } catch (error) {
        console.error('Error loading teacher:', error);
        // Fallback to default teacher info (already set in state)
      }
    }

    loadTeacher();
  }, []);

  // Load available dates
  useEffect(() => {
    async function loadAvailability() {
      try {
        const response = await fetch('/api/teacher/availability');

        if (!response.ok) {
          throw new Error('Failed to load teacher availability');
        }

        const { availableDates, timeSlots } = await response.json();

        // Convert date strings to Date objects
        let parsedDates = [];
        if (availableDates && availableDates.length > 0) {
          parsedDates = availableDates.map(dateStr => new Date(dateStr));

          // Filter out past dates
          const futureDates = parsedDates.filter(date => date >= new Date());

          if (futureDates.length > 0) {
            setWednesdayOptions(futureDates.sort((a, b) => a - b));
            setSelectedDate(futureDates[0]);
            setCustomTimeSlots(timeSlots || {});
            return;
          }
        }

        // Fallback to default Wednesdays if no dates or all dates are in the past
        const defaultWednesdays = generateDefaultWednesdays();
        setWednesdayOptions(defaultWednesdays);
        setSelectedDate(defaultWednesdays[0]);
      } catch (error) {
        console.error('Error loading availability:', error);
        // Fallback to default Wednesdays
        const defaultWednesdays = generateDefaultWednesdays();
        setWednesdayOptions(defaultWednesdays);
        setSelectedDate(defaultWednesdays[0]);
      }
    }

    loadAvailability();

    function generateDefaultWednesdays() {
      const defaultDates = [];
      let currentDate = getNextWednesday();

      for (let i = 0; i < 4; i++) {
        const wednesday = new Date(currentDate);
        wednesday.setDate(currentDate.getDate() + (i * 7));
        defaultDates.push(wednesday);
      }

      return defaultDates;
    }
  }, []);

  // Load time slots for selected date
  useEffect(() => {
    if (!selectedDate) return;

    async function loadTimeSlots() {
      setIsLoading(true);

      try {
        // All possible time slots
        const allTimeSlots = [
          '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
          '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM',
          '10:30 PM', '11:00 PM'
        ];

        // Get teacher's configured time slots for this date
        const dateString = selectedDate.toISOString().split('T')[0];
        const dateSlotsConfig = customTimeSlots[dateString];

        // Filter slots based on teacher configuration
        let availableSlots;

        if (dateSlotsConfig) {
          // Use teacher's configured slots
          availableSlots = Object.keys(dateSlotsConfig)
            .filter(slot => dateSlotsConfig[slot])
            .map(slot => ({
              id: slot.replace(/\s/g, '').toLowerCase(),
              time: slot,
              available: true
            }));
        } else {
          // Default: all slots available
          availableSlots = allTimeSlots.map(slot => ({
            id: slot.replace(/\s/g, '').toLowerCase(),
            time: slot,
            available: true
          }));
        }

        // Check for existing bookings
        const formattedDate = selectedDate.toISOString().split('T')[0];
        const response = await fetch(`/api/bookings/date?date=${formattedDate}`);

        if (response.ok) {
          const existingBookings = await response.json();

          // Mark slots as unavailable if already booked
          if (existingBookings.length > 0) {
            existingBookings.forEach(booking => {
              const bookingTime = new Date(booking.date);
              const hours = bookingTime.getHours();
              const minutes = bookingTime.getMinutes();

              // Format time as "H:MM PM"
              const formattedHours = hours > 12 ? hours - 12 : hours;
              const formattedTime = `${formattedHours}:${minutes === 0 ? '00' : minutes} PM`;

              // Find and mark slot as unavailable
              const slotIndex = availableSlots.findIndex(slot => slot.time === formattedTime);
              if (slotIndex !== -1) {
                availableSlots[slotIndex].available = false;
              }
            });
          }
        }

        setTimeSlots(availableSlots);
      } catch (error) {
        console.error('Error loading time slots:', error);
        // Fallback to default time slots
        const defaultSlots = [
          '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
          '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM',
          '10:30 PM', '11:00 PM'
        ].map(slot => ({
          id: slot.replace(/\s/g, '').toLowerCase(),
          time: slot,
          available: true
        }));

        setTimeSlots(defaultSlots);
      } finally {
        setIsLoading(false);
      }
    }

    loadTimeSlots();
  }, [selectedDate, customTimeSlots]);

  // Format date for display
  const formatDate = (date) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null); // Reset time slot selection
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.name || !formData.phoneNumber || !selectedTimeSlot) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate Gmail ID if calendar sync is checked
    if (formData.calendarSync && !formData.gmailId) {
      alert("Please provide your Gmail ID for calendar sync");
      return;
    }

    setIsLoading(true);

    try {
      // Create booking data
      const selectedSlot = timeSlots.find(slot => slot.id === selectedTimeSlot);
      const timeComponents = selectedSlot.time.replace(' PM', '').split(':');
      const hours = parseInt(timeComponents[0], 10) + 12; // Convert to 24-hour format
      const minutes = parseInt(timeComponents[1], 10);

      // Set the exact time on the selected date
      const bookingDate = new Date(selectedDate);
      bookingDate.setHours(hours, minutes, 0, 0);

      const bookingData = {
        studentName: formData.name,
        phoneNumber: formData.phoneNumber,
        date: bookingDate.toISOString(),
        timeSlot: selectedSlot.time,
        whatsAppOptIn: formData.whatsAppOptIn,
        calendarSync: formData.calendarSync,
        gmailId: formData.calendarSync ? formData.gmailId : null
      };

      // Save booking to backend
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      // Show success message
      setBookingSuccess(true);
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('There was an error booking your class. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Booking confirmation screen
  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold text-indigo-600">Sarodwala</div>
              <Link
                href="/teacher/dashboard"
                className="flex items-center py-2 px-4 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Class Summary
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
              <p className="text-gray-600 mb-6 text-lg">
                Your Sarod class with {teacher.name} is booked for {formatDate(selectedDate)} at {timeSlots.find(slot => slot.id === selectedTimeSlot)?.time}.
              </p>

              {formData.whatsAppOptIn && (
                <p className="text-base text-gray-500 mb-6">
                  We'll send you a reminder 2 hours before the class.
                </p>
              )}

              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => setBookingSuccess(false)}
                  className="w-full py-3 px-4 bg-indigo-600 text-white text-lg font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Book Another Class
                </button>
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <p className="text-center text-gray-500 text-base">
              © {new Date().getFullYear()} Sarodwala. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-indigo-600">Sarodwala</div>
            <Link
              href="/teacher/dashboard"
              className="flex items-center py-2 px-4 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Class Summary
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Teacher Profile with Updated Content */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-32"></div>
            <div className="px-6 py-4 flex flex-col items-center -mt-20">
              {imageError ? (
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-400">{teacher.name.charAt(0)}</span>
                </div>
              ) : (
                <img
                  src={teacher.profilePicture}
                  alt={teacher.name}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                  onError={handleImageError}
                />
              )}

              <h1 className="text-2xl font-bold mt-4 text-gray-800">{teacher.name}</h1>
              <p className="text-indigo-600 font-medium text-lg">{teacher.instrument} Maestro</p>

              {/* Added teacher bio */}
              <p className="text-gray-600 mt-2 text-center max-w-lg">{teacher.bio}</p>
            </div>
          </div>

          {/* Booking Form with Creative Text */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-2xl font-bold text-center mb-3 text-gray-800">Immersive Sarod Classes</h2>
            <p className="text-center text-gray-600 mb-6">Experience the rich tradition of Hindustani classical music with personalized guidance from Dr. Chakraborty</p>

            <form onSubmit={handleSubmit}>
              {/* Date Selection - Only Available Wednesdays */}
              <div className="mb-8">
                <label className="block text-gray-700 text-base font-medium mb-3">
                  Select Your Wednesday Session
                </label>
                {wednesdayOptions.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No available dates. Please check back later.
                  </div>
                ) : (
                  <div className="flex overflow-x-auto pb-2 -mx-1 scrollbar-hide">
                    {wednesdayOptions.map((date, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleDateSelect(date)}
                        className={`flex-shrink-0 mx-1 p-2 rounded-lg text-center min-w-[70px] ${
                          selectedDate && selectedDate.toDateString() === date.toDateString()
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <div className="font-bold text-lg">{date.getDate()}</div>
                        <div className="text-sm">{formatDate(date).split(',')[0]}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Time Slots */}
              <div className="mb-8">
                <label className="block text-gray-700 text-base font-medium mb-3">
                  Select Your Preferred Time
                </label>
                {loading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-3 border-b-3 border-indigo-600"></div>
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No available time slots for this date.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedTimeSlot(slot.id)}
                        className={`p-3 rounded-lg text-center ${
                          selectedTimeSlot === slot.id
                            ? 'bg-indigo-600 text-white'
                            : slot.available
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <span className="text-base">{slot.time}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="mb-5">
                <label className="block text-gray-700 text-base font-medium mb-2" htmlFor="name">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="mb-6">
                <label className="block text-gray-700 text-base font-medium mb-2" htmlFor="phoneNumber">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="+91 98765 43210"
                  required
                />
              </div>

              {/* Options */}
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="whatsAppOptIn"
                    name="whatsAppOptIn"
                    checked={formData.whatsAppOptIn}
                    onChange={handleChange}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="whatsAppOptIn" className="ml-2 block text-base text-gray-700">
                    Receive confirmation via WhatsApp
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="calendarSync"
                    name="calendarSync"
                    checked={formData.calendarSync}
                    onChange={handleChange}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="calendarSync" className="ml-2 block text-base text-gray-700">
                    Add to my Google Calendar
                  </label>
                </div>

                {/* Gmail ID field - only show when calendar sync is checked */}
                {formData.calendarSync && (
                  <div className="mt-3 ml-7">
                    <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="gmailId">
                      Gmail ID
                    </label>
                    <input
                      type="email"
                      id="gmailId"
                      name="gmailId"
                      value={formData.gmailId}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-lg text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="your.email@gmail.com"
                    />
                  </div>
                )}
              </div>

              {/* Submit Button with Creative Text */}
              <button
                type="submit"
                disabled={loading || !selectedTimeSlot || wednesdayOptions.length === 0}
                className="w-full py-3 px-4 bg-indigo-600 text-white text-lg font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Booking...
                  </span>
                ) : (
                  "Begin Your Musical Journey"
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-base">
            © {new Date().getFullYear()} Sarodwala. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}