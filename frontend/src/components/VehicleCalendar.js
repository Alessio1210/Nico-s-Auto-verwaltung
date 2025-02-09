import React from 'react';

function VehicleCalendar({ bookings }) {
  // Diese Komponente simuliert eine Kalenderansicht.
  // Für eine richtige Kalenderintegration z. B. mit FullCalendar erweitern.
  return (
    <div>
      <h3 className="text-xl font-semibold">Fahrzeug Kalender</h3>
      {bookings && bookings.length > 0 ? (
        <ul>
          {bookings.map(booking => (
            <li key={booking.id}>
              {new Date(booking.startzeit).toLocaleDateString()} - {new Date(booking.endzeit).toLocaleDateString()} : {booking.status}
            </li>
          ))}
        </ul>
      ) : (
        <p>Keine Buchungen</p>
      )}
    </div>
  );
}

export default VehicleCalendar; 