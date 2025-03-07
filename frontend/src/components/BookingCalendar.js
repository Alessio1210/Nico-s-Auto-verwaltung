import React, { useState, useEffect } from 'react';

function BookingCalendar({ vehicleId }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Lade alle Buchungen für das Fahrzeug
  useEffect(() => {
    setLoading(true);
    
    try {
      // Lade alle Anfragen aus dem localStorage
      const allRequests = JSON.parse(localStorage.getItem('vehicleRequests') || '[]');
      
      // Filtere nach genehmigten Anfragen für dieses Fahrzeug
      const vehicleBookings = allRequests.filter(req => 
        req.vehicleId.toString() === vehicleId.toString() && 
        (req.status === 'approved' || req.status === 'pending')
      );
      
      setBookings(vehicleBookings);
    } catch (error) {
      console.error('Fehler beim Laden der Buchungen:', error);
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  // Hilfsfunktion zum Erhalten des Monatsnamens
  const getMonthName = (month) => {
    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    return monthNames[month];
  };

  // Hilfsfunktion zum Erhalten der Anzahl der Tage in einem Monat
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Hilfsfunktion zum Erhalten des Wochentags für den ersten Tag des Monats
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay() || 7; // Wandelt 0 (Sonntag) in 7 um für europäisches Format (Montag = 1)
  };

  // Berechne die Anzahl der Tage im aktuellen Monat
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  // Berechne den Wochentag des ersten Tags im Monat (1-7, wobei 1 = Montag)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Zum nächsten Monat wechseln
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Zum vorherigen Monat wechseln
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // Prüfe, ob ein bestimmter Tag gebucht ist
  const hasBookingsForDay = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    return bookings.filter(booking => {
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);
      return date >= startDate && date <= endDate;
    });
  };

  // Rendere den Kalender
  const renderCalendar = () => {
    const days = [];
    const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    
    // Rendere Wochentage
    const weekdayElements = weekdays.map((day, index) => (
      <div key={`weekday-${index}`} className="text-center font-semibold py-2">
        {day}
      </div>
    ));
    
    // Füge leere Einträge für Tage vor dem ersten Tag des Monats hinzu
    for (let i = 1; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="p-2 border border-gray-200 bg-gray-50"></div>
      );
    }
    
    // Füge die Tage des Monats hinzu
    for (let day = 1; day <= daysInMonth; day++) {
      const dayBookings = hasBookingsForDay(day);
      const isBooked = dayBookings.length > 0;
      
      days.push(
        <div 
          key={`day-${day}`} 
          className={`p-2 border border-gray-200 min-h-[60px] ${
            isBooked ? 'bg-blue-50' : ''
          }`}
        >
          <div className="flex justify-between">
            <span className="font-medium">{day}</span>
            {isBooked && (
              <span className="text-xs px-1 rounded bg-blue-100 text-blue-800">
                {dayBookings.length}
              </span>
            )}
          </div>
          {isBooked && (
            <div className="mt-1 text-xs">
              {dayBookings.map((booking, idx) => (
                <div 
                  key={idx}
                  className={`py-1 px-1 mb-1 rounded ${
                    booking.status === 'approved' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {booking.userName.split(' ')[0]}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={goToPrevMonth}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            &larr;
          </button>
          <h3 className="text-lg font-semibold">
            {getMonthName(currentMonth)} {currentYear}
          </h3>
          <button 
            onClick={goToNextMonth}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            &rarr;
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {weekdayElements}
          {days}
        </div>
      </div>
    );
  };

  // Rendere die Liste der Buchungen
  const renderBookingsList = () => {
    if (bookings.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          Keine Buchungen für dieses Fahrzeug gefunden
        </div>
      );
    }
    
    // Sortiere Buchungen nach Startdatum
    const sortedBookings = [...bookings].sort((a, b) => 
      new Date(a.startDate) - new Date(b.startDate)
    );
    
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Alle Buchungen</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 text-left">Zeitraum</th>
                <th className="py-2 px-4 text-left">Benutzer</th>
                <th className="py-2 px-4 text-left">Zweck</th>
                <th className="py-2 px-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedBookings.map((booking, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-2 px-4">
                    {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4">
                    {booking.userName}
                  </td>
                  <td className="py-2 px-4">
                    {booking.purpose}
                  </td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                      booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status === 'approved' ? 'Genehmigt' :
                       booking.status === 'rejected' ? 'Abgelehnt' : 'Ausstehend'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {renderCalendar()}
      {renderBookingsList()}
    </div>
  );
}

export default BookingCalendar; 