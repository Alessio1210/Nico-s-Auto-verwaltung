import React from 'react';

function VehicleCalendar({ bookings }) {
  // Hilfsfunktion zur Formatierung des Datums
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Prüfen, ob eine Buchung genehmigt ist
  const isApproved = (booking) => {
    return booking.status === 'approved' || booking.status === 'Genehmigt';
  };

  // Sortiere Buchungen nach Startdatum
  const sortedBookings = bookings && bookings.length > 0 
    ? [...bookings].sort((a, b) => new Date(a.startzeit || a.startDateTime) - new Date(b.startzeit || b.startDateTime))
    : [];

  return (
    <div className="bg-white shadow-sm rounded-lg p-4">
      <h3 className="text-xl font-semibold mb-4">Fahrzeug Kalender</h3>
      
      {sortedBookings.length > 0 ? (
        <div className="space-y-3">
          {sortedBookings.map(booking => (
            <div 
              key={booking.id} 
              className={`p-3 rounded-lg border ${
                isApproved(booking)
                  ? 'border-green-300 bg-green-50' 
                  : booking.status === 'rejected' || booking.status === 'Abgelehnt'
                    ? 'border-red-300 bg-red-50 opacity-60'
                    : 'border-yellow-300 bg-yellow-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {formatDate(booking.startzeit || booking.startDateTime)} - {formatDate(booking.endzeit || booking.endDateTime)}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isApproved(booking)
                    ? 'bg-green-100 text-green-800'
                    : booking.status === 'rejected' || booking.status === 'Abgelehnt'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {booking.status === 'approved' ? 'Genehmigt' : 
                   booking.status === 'rejected' ? 'Abgelehnt' : 
                   booking.status === 'Genehmigt' ? 'Genehmigt' :
                   booking.status === 'Abgelehnt' ? 'Abgelehnt' : 'Ausstehend'}
                </span>
              </div>
              
              {/* Zusätzliche Informationen, falls vorhanden */}
              {booking.userName && (
                <div className="mt-2 text-sm text-gray-600">
                  Benutzer: {booking.userName}
                </div>
              )}
              
              {booking.purpose && (
                <div className="mt-1 text-sm text-gray-600">
                  Zweck: {booking.purpose}
                </div>
              )}
              
              {isApproved(booking) && (
                <div className="mt-2 text-sm font-semibold text-green-600">
                  Fahrzeug ist für diesen Zeitraum gebucht
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center py-4 text-gray-500">Keine Buchungen für dieses Fahrzeug</p>
      )}
    </div>
  );
}

export default VehicleCalendar; 