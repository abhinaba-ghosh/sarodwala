// app/page.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function BookingPage() {
  const [teacher, setTeacher] = useState({
    name: "Dr. Rajeeb Chakraborty",
    instrument: "Sarod",
    bio: "Acclaimed sarod maestro with over 30 years of performance experience across global stages. Dr. Chakraborty blends traditional techniques with innovative approaches for students of all levels.",
    profilePicture: "/images/teacher_profile.jpg",
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [wednesdayOptions, setWednesdayOptions] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [customTimeSlots, setCustomTimeSlots] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    whatsAppOptIn: true,
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
    if (dayOfWeek === 3 && today.getHours() < 17) {
      // Before 5 PM
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
        const response = await fetch("/api/teacher");

        if (!response.ok) {
          throw new Error("Failed to load teacher information");
        }

        const teacherData = await response.json();
        setTeacher(teacherData);
      } catch (error) {
        console.error("Error loading teacher:", error);
        // Fallback to default teacher info (already set in state)
      }
    }

    loadTeacher();
  }, []);

  // Load available dates and initial time slots
  useEffect(() => {
    let isMounted = true; // To prevent state updates after unmount

    async function loadAvailability() {
      try {
        const response = await fetch("/api/teacher/availability");

        if (!response.ok) {
          throw new Error("Failed to load teacher availability");
        }

        // Load available dates
        const data = await response.json();

        if (!isMounted) return; // Safety check

        // Generate default dates in case we don't have any
        const defaultWednesdays = generateDefaultWednesdays();

        // If we have dates from the API, use those
        if (data.availableDates && data.availableDates.length > 0) {
          const parsedDates = data.availableDates.map(
            (dateStr) => new Date(dateStr)
          );
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Filter for future dates
          const futureDates = parsedDates.filter((date) => date >= today);

          if (futureDates.length > 0) {
            const sortedDates = futureDates.sort((a, b) => a - b);
            setWednesdayOptions(sortedDates);
            setSelectedDate(sortedDates[0]);
            setCustomTimeSlots(data.timeSlots || {});

            // End loading state - IMPORTANT
            setIsLoading(false);
            return;
          }
        }

        // If no valid dates from API, use default dates
        setWednesdayOptions(defaultWednesdays);
        setSelectedDate(defaultWednesdays[0]);
        setCustomTimeSlots({});
        setIsLoading(false); // End loading state
      } catch (error) {
        console.error("Error loading availability:", error);

        if (!isMounted) return;

        // Fallback to default Wednesdays
        const defaultWednesdays = generateDefaultWednesdays();
        setWednesdayOptions(defaultWednesdays);
        setSelectedDate(defaultWednesdays[0]);
        setIsLoading(false); // End loading state
      }
    }

    function generateDefaultWednesdays() {
      const defaultDates = [];
      let currentDate = getNextWednesday();

      for (let i = 0; i < 4; i++) {
        const wednesday = new Date(currentDate);
        wednesday.setDate(currentDate.getDate() + i * 7);
        defaultDates.push(wednesday);
      }

      return defaultDates;
    }

    // Start loading
    setIsLoading(true);
    loadAvailability();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []);

  // Function to load time slots for a specific date
  const loadTimeSlots = async () => {
    if (!selectedDate) return;

    setIsLoading(true);
    console.log("Loading time slots for date:", selectedDate.toISOString());

    try {
      // Get all bookings (without date filtering)
      const response = await fetch("/api/bookings/all");

      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const allBookings = await response.json();

      // Filter bookings for the selected date by comparing date parts only
      const selectedDateStr = selectedDate.toDateString(); // Gets format like "Wed May 21 2025"

      // Filter bookings that match the selected date (ignoring time part)
      const bookingsForDate = allBookings.filter((booking) => {
        if (!booking.date) return false;

        // Create a Date object from the booking date
        const bookingDate = new Date(booking.date);

        // Compare only the date parts
        return bookingDate.toDateString() === selectedDateStr;
      });

      console.log(
        `Found ${bookingsForDate.length} bookings for ${selectedDateStr}`
      );

      // Extract booked time slots
      const bookedSlots = new Set();
      bookingsForDate.forEach((booking) => {
        if (booking.timeSlot) {
          console.log(`Found booked time slot: ${booking.timeSlot}`);
          bookedSlots.add(booking.timeSlot);
        }
      });

      console.log("Booked slots:", [...bookedSlots]);

      // All possible time slots
      const allTimeSlots = [
        "5:00 PM",
        "5:30 PM",
        "6:00 PM",
        "6:30 PM",
        "7:00 PM",
        "7:30 PM",
        "8:00 PM",
        "8:30 PM",
        "9:00 PM",
        "9:30 PM",
        "10:00 PM",
        "10:30 PM",
      ];

      // Include all slots but mark some as booked
      const timeSlots = allTimeSlots.map((slot) => ({
        id: slot.replace(/\s/g, "").toLowerCase(),
        time: slot,
        available: !bookedSlots.has(slot),
      }));

      console.log("All time slots with availability:", timeSlots);
      setTimeSlots(timeSlots);

      // If the selected slot is no longer available, clear the selection
      if (selectedTimeSlot) {
        const selectedSlot = timeSlots.find(
          (slot) => slot.id === selectedTimeSlot
        );
        if (!selectedSlot || !selectedSlot.available) {
          setSelectedTimeSlot(null);
        }
      }
    } catch (error) {
      console.error("Error loading time slots:", error);
      setTimeSlots([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load time slots when selected date changes
  useEffect(() => {
    if (selectedDate) {
      loadTimeSlots();
    }
  }, [selectedDate]);

  useEffect(() => {
    // This effect runs when the component mounts
    // Clear any previous form data and selection state
    setFormData({
      name: "",
      phoneNumber: "",
      whatsAppOptIn: true, // Default to true
      calendarSync: false,
    });
    setSelectedTimeSlot(null);

    // Also reset booking success state if they navigate back after booking
    setBookingSuccess(false);

    // No need for a cleanup function since we're just initializing state
  }, []);

  // Format date for display
  const formatDate = (date) => {
    const options = { weekday: "short", month: "short", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
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
      [name]: type === "checkbox" ? checked : value,
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

    // Double-check that the selected time slot is still available
    await loadTimeSlots(); // Refresh time slots

    const selectedSlot = timeSlots.find((slot) => slot.id === selectedTimeSlot);
    if (!selectedSlot || !selectedSlot.available) {
      alert(
        "This time slot is no longer available. Please select another time."
      );
      setSelectedTimeSlot(null);
      return;
    }

    setIsLoading(true);

    try {
      // Create booking data
      const timeComponents = selectedSlot.time.replace(" PM", "").split(":");
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
      };

      console.log("Submitting booking:", bookingData);

      // Save booking to backend
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          alert(
            "This time slot is already booked. Please select another time."
          );
          await loadTimeSlots(); // Reload the time slots
          setSelectedTimeSlot(null);
          return;
        }
        throw new Error(errorData.error || "Error creating booking");
      }

      // Booking successful
      setBookingSuccess(true);
    } catch (error) {
      console.error("Error creating booking:", error);
      alert(
        error.message ||
          "There was an error booking your class. Please try again."
      );
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
              <div className="text-2xl font-bold text-indigo-600">
                Sarodwala
              </div>
              <Link
                href="/teacher/dashboard"
                className="flex items-center py-2 px-4 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
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
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Booking Confirmed!
              </h2>
              <p className="text-gray-600 mb-6 text-lg">
                Your Sarod class with {teacher.name} is booked for{" "}
                {formatDate(selectedDate)} at{" "}
                {timeSlots.find((slot) => slot.id === selectedTimeSlot)?.time}.
              </p>

              {formData.whatsAppOptIn && (
                <p className="text-base text-gray-500 mb-6">
                  We'll send you a confirmation on WhatsApp.
                </p>
              )}

              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    setBookingSuccess(false);
                    setSelectedTimeSlot(null);
                    setFormData({
                      name: "",
                      phoneNumber: "",
                      whatsAppOptIn: true,
                      calendarSync: false,
                    });
                    window.location.href = window.location.pathname;
                  }}
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Class Summary
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Teacher Profile */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-32"></div>
            <div className="px-6 py-4 flex flex-col items-center -mt-20">
              {imageError ? (
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-400">
                    {teacher.name.charAt(0)}
                  </span>
                </div>
              ) : (
                <img
                  src={teacher.profilePicture}
                  alt={teacher.name}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                  onError={handleImageError}
                />
              )}

              <h1 className="text-2xl font-bold mt-4 text-gray-800">
                {teacher.name}
              </h1>
              <p className="text-indigo-600 font-medium text-lg">
                {teacher.instrument} Maestro
              </p>

              <p className="text-gray-600 mt-2 text-center max-w-lg">
                {teacher.bio}
              </p>
            </div>
          </div>

          {/* Booking Form */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-2xl font-bold text-center mb-3 text-gray-800">
              Immersive Sarod Classes
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Experience the rich tradition of Hindustani classical music with
              personalized guidance from Dr. Chakraborty
            </p>

            <form onSubmit={handleSubmit}>
              {/* Date Selection - Only Available Wednesdays */}
              {/* <div className="mb-8">
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
              </div> */}

              {/* Date Selection - Showing next 5 available Wednesdays with month */}
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
                    {wednesdayOptions.slice(0, 5).map((date, index) => {
                      const day = date.getDate();
                      const month = date.toLocaleString("default", {
                        month: "short",
                      });

                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleDateSelect(date)}
                          className={`flex-shrink-0 mx-1 p-2 rounded-lg text-center min-w-[80px] ${
                            selectedDate &&
                            selectedDate.toDateString() === date.toDateString()
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <div className="font-bold text-xl">{day}</div>
                          <div className="text-sm font-medium">{month}</div>
                          <div className="text-xs">Wed</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Time Slots */}
              {/* Time Slots */}
              {/* <div className="mb-8">
  <label className="block text-gray-700 text-base font-medium mb-3">
    Select Your Preferred Time
  </label>
  {loading ? (
    <div className="flex justify-center py-6">
      <div className="animate-spin rounded-full h-8 w-8 border-t-3 border-b-3 border-indigo-600"></div>
    </div>
  ) : timeSlots.length === 0 ? (
    <div className="text-center py-4 text-gray-500">
      No time slots available for this date.
    </div>
  ) : (
    <div className="grid grid-cols-3 gap-3">
      {timeSlots.map((slot) => (
        <button
          key={slot.id}
          type="button"
          disabled={!slot.available}
          onClick={() => slot.available ? setSelectedTimeSlot(slot.id) : null}
          className={`p-3 rounded-lg text-center relative ${
            selectedTimeSlot === slot.id
              ? 'bg-indigo-600 text-white'
              : slot.available
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-red-50 text-red-300 cursor-not-allowed'
          }`}
        >
          <span className="text-base">{slot.time}</span>
          {!slot.available && (
            <div className="absolute bottom-1 left-0 right-0 text-xs font-medium">
              Booked
            </div>
          )}
        </button>
      ))}
    </div>
  )}
</div> */}

              {/* <div className="space-y-2 max-w-xl mx-auto">
  {timeSlots.map((slot) => (
    <div
      key={slot.id}
      className="flex items-center space-x-3"
    >
      <div className="flex-none w-20 text-right text-sm text-gray-500">
        {slot.time}
      </div>
      <div className={`relative flex-1 h-10 rounded-md ${
        slot.available
          ? selectedTimeSlot === slot.id
            ? 'bg-indigo-100 cursor-pointer'
            : 'bg-gray-100 hover:bg-indigo-50 cursor-pointer'
          : 'bg-gray-100'
      }`}
        onClick={() => slot.available ? setSelectedTimeSlot(slot.id) : null}
      >
        {slot.available ? (
          <div className="absolute inset-0 flex items-center justify-center">
            {selectedTimeSlot === slot.id ? (
              <span className="bg-indigo-600 text-white px-3 py-0.5 rounded-full text-xs">Selected</span>
            ) : (
              <span className="text-xs font-medium text-gray-500">Available</span>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center space-x-1 text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs font-medium">Reserved</span>
            </div>
          </div>
        )}
      </div>
    </div>
  ))}
</div> */}

              {/* <div className="grid grid-cols-3 gap-3">
  {timeSlots.map((slot) => (
    <div
      key={slot.id}
      className={`relative rounded-lg overflow-hidden transition-all duration-200 ${
        slot.available
          ? selectedTimeSlot === slot.id
            ? 'ring-2 ring-indigo-500 shadow-md'
            : 'hover:shadow-md'
          : ''
      }`}
    >
      <div
        onClick={() => slot.available ? setSelectedTimeSlot(slot.id) : null}
        className={`p-4 text-center ${
          !slot.available ? 'bg-gray-100' : 'bg-white'
        }`}
      >
        <div className={`text-lg ${
          slot.available
            ? selectedTimeSlot === slot.id
              ? 'text-indigo-600 font-semibold'
              : 'text-gray-700'
            : 'text-gray-400'
        }`}>
          {slot.time}
        </div>
      </div>

      {!slot.available && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-500 bg-opacity-10">
          <div className="bg-white px-2 py-1 rounded-full shadow-sm text-xs font-medium text-gray-500 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Booked
          </div>
        </div>
      )}
    </div>
  ))}
</div> */}

              {/* <div className="grid grid-cols-3 gap-4">
  {timeSlots.map((slot) => (
    <button
      key={slot.id}
      disabled={!slot.available}
      onClick={() => setSelectedTimeSlot(slot.id)}
      className={`p-4 rounded-lg transition-all ${
        selectedTimeSlot === slot.id
          ? 'bg-indigo-600 text-white shadow-md'
          : slot.available
            ? 'bg-white border border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-600'
            : 'bg-white border border-gray-100 text-gray-300 cursor-not-allowed'
      }`}
    >
      <div className="text-center">
        <span className="text-lg font-medium">{slot.time}</span>

        {!slot.available && (
          <span className="block mt-1 text-xs">
            Booked
          </span>
        )}

        {selectedTimeSlot === slot.id && (
          <span className="block mt-1 text-xs">
            Selected
          </span>
        )}
      </div>
    </button>
  ))}
</div> */}

              {/* Time Slots - Minimalist Design with Status Colors (Smaller Size) */}
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
                    No time slots available for this date.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.id}
                        disabled={!slot.available}
                        onClick={() => setSelectedTimeSlot(slot.id)}
                        className={`py-2 px-1 rounded-lg transition-all ${
                          selectedTimeSlot === slot.id
                            ? "bg-indigo-600 text-white shadow-md"
                            : slot.available
                            ? "bg-white border border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-600"
                            : "bg-white border border-gray-100 text-gray-300 cursor-not-allowed"
                        }`}
                      >
                        <div className="text-center">
                          <span className="text-sm font-medium">
                            {slot.time}
                          </span>

                          {!slot.available && (
                            <span className="block mt-1 text-xs">Booked</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Name Field with Improved Readability */}
              <div className="mb-5">
                <label
                  className="block text-gray-800 text-base font-medium mb-2"
                  htmlFor="name"
                >
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 font-medium bg-white"
                  required
                  placeholder="Enter your full name"
                />
              </div>

              {/* Phone Number Field with Improved Readability */}
              <div className="mb-6">
                <label
                  className="block text-gray-800 text-base font-medium mb-2"
                  htmlFor="phoneNumber"
                >
                  Phone Number (Whatsapp)
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 font-medium bg-white"
                  placeholder="9380738909"
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
                  <label
                    htmlFor="whatsAppOptIn"
                    className="ml-2 block text-base text-gray-700"
                  >
                    Receive confirmation via WhatsApp
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="calendarSync"
                    name="calendarSync"
                    disabled={true}
                    className="h-5 w-5 text-gray-400 focus:ring-gray-300 border-gray-300 rounded cursor-not-allowed"
                  />
                  <label
                    htmlFor="calendarSync"
                    className="ml-2 flex items-center text-base text-gray-500"
                  >
                    Add to my Google Calendar
                    <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">
                      Coming Soon
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  loading || !selectedTimeSlot || wednesdayOptions.length === 0
                }
                className="w-full py-3 px-4 bg-indigo-600 text-white text-lg font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Booking...
                  </span>
                ) : (
                  "Book"
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
