import React, { useState, useEffect } from 'react';
import axios from 'axios';

function GlobalDashboard() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/bookings')
      .then(response => {
        setBookings(response.data);
      })
      .catch(error => console.error('Error fetching bookings:', error));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2">Globaler Kalender / Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bookings.map(booking => (
          <div key={booking.id} className="p-4 border rounded">
            <p><strong>Buchungs-ID:</strong> {booking.id}</p>
            <p><strong>Fahrzeug-ID:</strong> {booking.vehicle_id}</p>
            <p><strong>Nutzer-ID:</strong> {booking.user_id}</p>
            <p><strong>Startzeit:</strong> {new Date(booking.startzeit).toLocaleString()}</p>
            <p><strong>Endzeit:</strong> {new Date(booking.endzeit).toLocaleString()}</p>
            <p><strong>Status:</strong> {booking.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GlobalDashboard; 