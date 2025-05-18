// app/teacher/dashboard/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TeacherDashboard() {
  const [selectedDate, setSelectedDate] = useState(getNextWednesday());
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalHours: 0,
    totalRevenue: 0
  });
  const [cancelingBookingId, setCancelingBookingId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [selectedBookingName, setSelectedBookingName] = useState('');

  // Get next Wednesday
  function getNextWednesday() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilWednesday = (3 - dayOfWeek + 7) % 7;

    const nextWednesday = new Date(today);
    nextWednesday.setDate(today.getDate() + daysUntilWednesday);
    return nextWednesday;
  }

  // Format date for display
  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Format time to display from date object
  const formatTime = (date) => {
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    return date.toLocaleTimeString('en-US', options);
  };

  // Function to navigate to previous Wednesday
  const goToPreviousWednesday = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 7);
    setSelectedDate(prevDate);
  };

  // Function to navigate to next Wednesday
  const goToNextWednesday = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 7);
    setSelectedDate(nextDate);
  };

  // Function to handle booking cancellation
  const handleCancelBooking = (bookingId, studentName) => {
    setSelectedBookingId(bookingId);
    setSelectedBookingName(studentName);
    setShowConfirmModal(true);
  };

  // Function to confirm cancellation
  const confirmCancellation = async () => {
    if (!selectedBookingId) return;

    try {
      setCancelingBookingId(selectedBookingId);
      setShowConfirmModal(false);

      const response = await fetch(`/api/bookings/${selectedBookingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      // Refresh the bookings list
      const updatedBookings = bookings.filter(booking => booking.id !== selectedBookingId);
      setBookings(updatedBookings);

      // Update statistics
      setStats({
        totalStudents: updatedBookings.length,
        totalHours: updatedBookings.length * 0.5, // Each class is 30 minutes
        totalRevenue: updatedBookings.length * 500 // ₹500 per class
      });

      // Show success message
      alert('Booking cancelled successfully. The time slot is now available for booking.');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Error cancelling booking. Please try again.');
    } finally {
      setCancelingBookingId(null);
      setSelectedBookingId(null);
    }
  };

  // Fetch bookings for the selected date
  useEffect(() => {
    async function fetchBookings() {
      setIsLoading(true);

      try {
        // Format date for API query
        const dateParam = selectedDate.toISOString().split('T')[0];

        const response = await fetch(`/api/bookings/date?date=${dateParam}`);

        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }

        const bookingsData = await response.json();

        // Add formatted time to bookings
        const formattedBookings = bookingsData.map(booking => ({
          ...booking,
          timeFormatted: booking.timeSlot || formatTime(new Date(booking.date))
        }));

        setBookings(formattedBookings);

        // Calculate statistics
        setStats({
          totalStudents: formattedBookings.length,
          totalHours: formattedBookings.length * 0.5, // Each class is 30 minutes
          totalRevenue: formattedBookings.length * 500 // ₹500 per class
        });
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setBookings([]);
        setStats({
          totalStudents: 0,
          totalHours: 0,
          totalRevenue: 0
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchBookings();
  }, [selectedDate]);

  // Function to export schedule as CSV
  const exportAsCSV = () => {
    if (bookings.length === 0) return;

    const headers = ["Time", "Student Name", "Phone Number"];
    const dataRows = bookings.map(booking => [
      booking.timeFormatted,
      booking.studentName,
      booking.phoneNumber
    ]);

    const csvContent = [
      headers.join(","),
      ...dataRows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const formattedDate = selectedDate.toISOString().split('T')[0];
    link.download = `schedule_${formattedDate}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              Sarodwala
            </Link>
            <Link
              href="/teacher/settings"
              className="flex items-center py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">Dr. Rajeeb Chakraborty's Schedule</h1>

            <div className="flex items-center bg-white rounded-lg shadow p-2">
              <button
                onClick={goToPreviousWednesday}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Previous Wednesday"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>

              <div className="flex items-center mx-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-gray-800">{formatDate(selectedDate)}</span>
              </div>

              <button
                onClick={goToNextWednesday}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Next Wednesday"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-transform hover:transform hover:scale-105">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="rounded-full bg-indigo-100 p-3 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700">Total Students</h3>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-transform hover:transform hover:scale-105">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="rounded-full bg-blue-100 p-3 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700">Teaching Hours</h3>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalHours.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-transform hover:transform hover:scale-105">
              <div className="p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="rounded-full bg-green-100 p-3 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">Daily Summary</h3>
                      <p className="text-xl font-bold text-gray-900">{bookings.length} classes today</p>
                    </div>
                  </div>
                  <button
                    onClick={exportAsCSV}
                    className="flex items-center py-2 px-3 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                    disabled={bookings.length === 0}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="font-medium">CSV</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Schedule */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 py-4 px-6">
              <h2 className="text-lg font-semibold text-white">Wednesday Schedule (5:00 PM - 10:30 PM)</h2>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-600"></div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xl font-medium">No classes scheduled for this Wednesday</p>
              </div>
            ) : (
              <div>
                {bookings.map((booking, index) => (
                  <div
                    key={booking.id || index}
                    className={`p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors ${
                      index !== bookings.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-6">
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-lg bg-indigo-100 flex flex-col items-center justify-center text-center">
                          <span className="text-2xl font-bold text-indigo-700">
                            {booking.timeFormatted?.split(' ')[0]}
                          </span>
                          <span className="text-sm font-medium text-indigo-600">
                            {booking.timeFormatted?.split(' ')[1] || 'PM'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">{booking.studentName}</h3>
                        <p className="text-gray-600 mt-1 font-medium">{booking.phoneNumber}</p>
                        {booking.gmailId && (
                          <p className="text-gray-500 mt-1 text-sm">
                            <span className="inline-flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                              </svg>
                              {booking.gmailId}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 md:mt-0 md:ml-6 flex items-center space-x-3">
                      <span className="inline-flex px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
                        {booking.status || "Upcoming"}
                      </span>

                      <button
                        onClick={() => handleCancelBooking(booking.id, booking.studentName)}
                        disabled={cancelingBookingId === booking.id}
                        className={`flex items-center px-3 py-1 ${
                          cancelingBookingId === booking.id
                            ? 'bg-gray-100 text-gray-400'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        } rounded-lg transition-colors`}
                      >
                        {cancelingBookingId === booking.id ? (
                          <>
                            <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Sarodwala. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 m-4 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Cancel Booking</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel the booking for <span className="font-medium">{selectedBookingName}</span>?
            </p>
            <p className="text-gray-500 text-sm mb-6">
              This will free up the time slot for other students to book.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                No, Keep It
              </button>
              <button
                onClick={confirmCancellation}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Yes, Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}