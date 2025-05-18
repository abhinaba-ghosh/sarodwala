// app/teacher/settings/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TeacherSettings() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableDates, setAvailableDates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [bookingsByDate, setBookingsByDate] = useState({});

  // Time slot configurations
  const [defaultTimeSlots, setDefaultTimeSlots] = useState({});
  const [customTimeSlots, setCustomTimeSlots] = useState({});

  // All possible time slots
const allTimeSlots = [
  '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
  '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM'
];


  // Generate calendar for the selected month and year
  const generateCalendar = () => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    const calendarDays = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      const dayOfWeek = date.getDay();

      // Only Wednesdays (day 3) are enabled in the calendar
      const isWednesday = dayOfWeek === 3;

      calendarDays.push({
        date,
        day,
        isAvailable: isWednesday && availableDates.some(d =>
          d.getDate() === day &&
          d.getMonth() === selectedMonth &&
          d.getFullYear() === selectedYear
        )
      });
    }

    return calendarDays;
  };

  // Load teacher settings and bookings
  useEffect(() => {
    async function loadTeacherSettings() {
      setIsLoading(true);

      try {
        // Fetch teacher availability
        const response = await fetch('/api/teacher/availability');

        if (!response.ok) {
          throw new Error('Failed to load teacher settings');
        }

        const { availableDates, timeSlots } = await response.json();

        // Convert date strings to Date objects
        if (availableDates && availableDates.length > 0) {
          setAvailableDates(availableDates.map(dateStr => new Date(dateStr)));
        } else {
          // Generate default available dates (all Wednesdays in current month)
          generateDefaultAvailableDates();
        }

        if (timeSlots) {
          setCustomTimeSlots(timeSlots);
        } else {
          // Generate default time slots
          generateDefaultTimeSlots();
        }

        // Fetch all bookings
        const bookingsResponse = await fetch('/api/bookings/all');
        if (bookingsResponse.ok) {
          const bookings = await bookingsResponse.json();

          // Group bookings by date
          const bookingsByDateMap = {};
          bookings.forEach(booking => {
            if (booking.date) {
              const dateStr = booking.date.split('T')[0]; // YYYY-MM-DD format
              if (!bookingsByDateMap[dateStr]) {
                bookingsByDateMap[dateStr] = [];
              }
              bookingsByDateMap[dateStr].push(booking);
            }
          });

          setBookingsByDate(bookingsByDateMap);
        }
      } catch (error) {
        console.error('Error loading teacher settings:', error);
        // Generate default available dates and time slots
        generateDefaultAvailableDates();
        generateDefaultTimeSlots();
      } finally {
        setIsLoading(false);
      }
    }

    loadTeacherSettings();
  }, [selectedMonth, selectedYear]);

  // Function to generate default available dates
  const generateDefaultAvailableDates = () => {
    const defaultDates = [];
    const now = new Date();

    // Calculate all Wednesdays in the month
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(selectedYear, selectedMonth, day);

      // Only include Wednesdays that are in the future
      if (date.getDay() === 3 && date >= now) {
        defaultDates.push(new Date(date));
      }
    }

    setAvailableDates(defaultDates);
  };

  // Function to generate default time slots
  const generateDefaultTimeSlots = () => {
    const defaultSlots = {};

    // For each available date, set all time slots to available
    availableDates.forEach(date => {
      const dateString = date.toISOString().split('T')[0];
      defaultSlots[dateString] = allTimeSlots.reduce((obj, slot) => {
        obj[slot] = true;
        return obj;
      }, {});
    });

    setDefaultTimeSlots(defaultSlots);
  };

  // Toggle date availability
  const toggleDateAvailability = (date) => {
    const dateObj = new Date(date);

    setAvailableDates(prevDates => {
      const existingIndex = prevDates.findIndex(d =>
        d.getDate() === dateObj.getDate() &&
        d.getMonth() === dateObj.getMonth() &&
        d.getFullYear() === dateObj.getFullYear()
      );

      const newDates = [...prevDates];

      if (existingIndex >= 0) {
        // Remove date if already available
        newDates.splice(existingIndex, 1);
      } else {
        // Add date if not available
        newDates.push(dateObj);
      }

      return newDates;
    });
  };

  // Toggle time slot availability
  const toggleTimeSlot = (date, timeSlot) => {
    const dateString = date.toISOString().split('T')[0];

    // Check if this slot is already booked
    const isBooked = bookingsByDate[dateString]?.some(booking => booking.timeSlot === timeSlot);

    // Don't allow toggling booked slots
    if (isBooked) {
      return;
    }

    setCustomTimeSlots(prevSlots => {
      const newSlots = { ...prevSlots };

      if (!newSlots[dateString]) {
        // Initialize with all slots from default
        newSlots[dateString] = { ...defaultTimeSlots[dateString] };
      }

      // Toggle the selected slot
      newSlots[dateString][timeSlot] = !newSlots[dateString][timeSlot];

      return newSlots;
    });
  };

  // Function to select all time slots for a date
  const handleSelectAll = (date) => {
    const dateString = date.toISOString().split('T')[0];

    setCustomTimeSlots(prevSlots => {
      const newSlots = { ...prevSlots };

      // Get existing date slots or create new ones
      const dateSlotsConfig = { ...newSlots[dateString] } || {};

      // Set all time slots to true (enabled)
      allTimeSlots.forEach(slot => {
        // Skip slots that are already booked
        const isBooked = bookingsByDate[dateString]?.some(booking => booking.timeSlot === slot);
        if (!isBooked) {
          dateSlotsConfig[slot] = true;
        }
      });

      newSlots[dateString] = dateSlotsConfig;
      return newSlots;
    });
  };

  // Function to deselect all time slots for a date
  const handleDeselectAll = (date) => {
    const dateString = date.toISOString().split('T')[0];

    setCustomTimeSlots(prevSlots => {
      const newSlots = { ...prevSlots };

      // Get existing date slots or create new ones
      const dateSlotsConfig = { ...newSlots[dateString] } || {};

      // Set all time slots to false (disabled)
      allTimeSlots.forEach(slot => {
        // Skip slots that are already booked
        const isBooked = bookingsByDate[dateString]?.some(booking => booking.timeSlot === slot);
        if (!isBooked) {
          dateSlotsConfig[slot] = false;
        }
      });

      newSlots[dateString] = dateSlotsConfig;
      return newSlots;
    });
  };

  // Handle save button click
  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Prepare settings data
      const settings = {
        availableDates: availableDates.map(date => date.toISOString()),
        timeSlots: customTimeSlots
      };

      // Update settings in the backend
      const response = await fetch('/api/teacher/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      setSavedMessage('Settings saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSavedMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('There was an error saving your settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Get month names
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get next/previous month
  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Calendar days
  const calendarDays = generateCalendar();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              Sarodwala
            </Link>
            <div className="flex space-x-4">
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Dr. Rajeeb Chakraborty's Schedule Settings</h1>

          {/* Month Navigation */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Manage Available Dates</h2>

            <div className="flex items-center bg-white rounded-lg shadow p-2">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Previous Month"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>

              <div className="flex items-center mx-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-gray-800 text-lg">{months[selectedMonth]} {selectedYear}</span>
              </div>

              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Next Month"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Calendar View */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
              <h3 className="text-white text-lg font-semibold">Calendar View (Only Wednesdays)</h3>
              <p className="text-indigo-100 text-sm">Toggle dates to mark them as available or unavailable</p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-600"></div>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-7 gap-4 mb-4">
                  <div className="text-center font-medium text-gray-600">Sun</div>
                  <div className="text-center font-medium text-gray-600">Mon</div>
                  <div className="text-center font-medium text-gray-600">Tue</div>
                  <div className="text-center font-medium text-gray-600">Wed</div>
                  <div className="text-center font-medium text-gray-600">Thu</div>
                  <div className="text-center font-medium text-gray-600">Fri</div>
                  <div className="text-center font-medium text-gray-600">Sat</div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {/* Empty cells for days before the 1st of the month */}
                  {Array.from({ length: new Date(selectedYear, selectedMonth, 1).getDay() }).map((_, index) => (
                    <div key={`empty-${index}`} className="h-16"></div>
                  ))}

                  {/* Calendar days */}
                  {calendarDays.map((day, index) => (
                    <div
                      key={index}
                      className={`h-24 p-2 border rounded-lg ${
                        day.date.getDay() === 3
                          ? 'border-indigo-200 hover:border-indigo-400 cursor-pointer'
                          : 'bg-gray-50 opacity-50'
                      }`}
                      onClick={() => day.date.getDay() === 3 && toggleDateAvailability(day.date)}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{day.day}</span>
                        {day.date.getDay() === 3 && (
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
                            day.isAvailable ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            {day.isAvailable ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                      {day.date.getDay() === 3 && day.isAvailable && (
                        <div className="mt-1 text-xs text-green-600 font-medium">
                          Available
                        </div>
                      )}

                      {/* Display booking count if there are any */}
                      {day.date.getDay() === 3 && day.isAvailable && (() => {
                        const dateStr = day.date.toISOString().split('T')[0];
                        const bookingsCount = bookingsByDate[dateStr]?.length || 0;
                        if (bookingsCount > 0) {
                          return (
                            <div className="mt-1 text-xs bg-amber-50 text-amber-700 px-1 py-0.5 rounded text-center">
                              {bookingsCount} bookings
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Time Slot Management */}
         {/* Time Slot Management - with individual slot selection */}
<div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
    <div className="flex justify-between items-center">
      <div>
        <h3 className="text-white text-lg font-semibold">Time Slot Management</h3>
        <p className="text-indigo-100 text-sm">Configure time slots for specific dates</p>
      </div>

      {/* Keep the bulk actions, but make them less prominent */}
      <div className="flex space-x-2 text-xs">
        <button
          onClick={() => availableDates.length > 0 && handleSelectAll(availableDates[0])}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-2 py-1 rounded"
          disabled={availableDates.length === 0}
        >
          Select All
        </button>
        <button
          onClick={() => availableDates.length > 0 && handleDeselectAll(availableDates[0])}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-2 py-1 rounded"
          disabled={availableDates.length === 0}
        >
          Deselect All
        </button>
      </div>
    </div>
  </div>

  <div className="p-6">
    {isLoading ? (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    ) : availableDates.length === 0 ? (
      <div className="text-center py-8 text-gray-500">
        No available dates selected. Please select dates in the calendar above.
      </div>
    ) : (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {availableDates.map((date, dateIndex) => {
            const dateString = date.toISOString().split('T')[0];
            const dateSlotsConfig = customTimeSlots[dateString] || defaultTimeSlots[dateString] || {};
            const bookingsForDate = bookingsByDate[dateString] || [];

            // Display a helpful message about how to use this section
            const hasBookings = bookingsForDate.length > 0;

            return (
              <div key={dateIndex} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <h4 className="font-medium text-lg text-gray-800 mb-3">
                  {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h4>

                {/* If there are bookings, show a badge */}
                {hasBookings && (
                  <div className="mb-3 text-sm bg-amber-50 text-amber-800 py-1 px-2 rounded-lg inline-block">
                    {bookingsForDate.length} bookings
                  </div>
                )}

                {/* Info text about how to select slots */}
                <p className="text-sm text-gray-500 mb-3">
                  Click on individual time slots to toggle their availability. Booked slots cannot be modified.
                </p>

                {/* Bulk action buttons for THIS specific date */}
                <div className="flex space-x-2 mb-3">
                  <button
                    onClick={() => handleSelectAll(date)}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded"
                  >
                    Enable All
                  </button>
                  <button
                    onClick={() => handleDeselectAll(date)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded"
                  >
                    Disable All
                  </button>
                </div>

                {/* Time slots grid - improved layout */}
                <div className="grid grid-cols-4 gap-2">
                  {allTimeSlots.map((timeSlot, slotIndex) => {
                    // Check if this slot is booked by someone
                    const booking = bookingsForDate.find(b => b.timeSlot === timeSlot);
                    const isBooked = !!booking;

                    // Is the slot enabled by the teacher
                    const isEnabled = dateSlotsConfig[timeSlot] !== false;

                    return (
                      <button
                        key={slotIndex}
                        type="button"
                        disabled={isBooked}
                        onClick={() => !isBooked && toggleTimeSlot(date, timeSlot)}
                        className={`py-2 px-1 rounded-lg transition-all text-center relative ${
                          isBooked
                            ? 'bg-white border border-gray-100 text-gray-300 cursor-not-allowed'
                            : isEnabled
                              ? 'bg-white border border-green-200 text-gray-700 hover:border-green-300'
                              : 'bg-white border border-red-200 text-gray-700 hover:border-red-300'
                        }`}
                      >
                        <div className="text-center">
                          <span className="text-sm font-medium">{timeSlot}</span>
                          {isBooked ? (
                            <span className="block mt-0.5 text-xs">Booked</span>
                          ) : (
                            <span className="block mt-0.5 text-xs">
                              {isEnabled ? 'Available' : 'Disabled'}
                            </span>
                          )}
                          {isBooked && booking?.studentName && (
                            <span className="block text-xs text-gray-400 truncate" title={booking.studentName}>
                              {booking.studentName}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </div>
</div>

          {/* Save Button */}
          <div className="flex justify-end">
            {savedMessage && (
              <div className="mr-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {savedMessage}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
            >
              {isSaving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : "Save Settings"}
            </button>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-base">
            © {new Date().getFullYear()} Sarodwala. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}