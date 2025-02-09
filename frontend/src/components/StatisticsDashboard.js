import React, { useState, useEffect } from 'react';
import axios from 'axios';

function StatisticsDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/statistics')
      .then(response => {
        setStats(response.data);
      })
      .catch(error => console.error('Error fetching statistics:', error));
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Statistiken</h2>
      
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Buchungen pro Fahrzeug</h3>
            <div className="space-y-2">
              {Object.entries(stats.bookings_per_vehicle).map(([vehicleId, count]) => (
                <div key={vehicleId} className="flex justify-between items-center">
                  <span>Fahrzeug {vehicleId}</span>
                  <span className="font-semibold">{count} Buchungen</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Durchschnittliche Buchungsdauer</h3>
            <div className="space-y-2">
              {Object.entries(stats.average_booking_duration_hours).map(([vehicleId, duration]) => (
                <div key={vehicleId} className="flex justify-between items-center">
                  <span>Fahrzeug {vehicleId}</span>
                  <span className="font-semibold">{duration.toFixed(1)} Stunden</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Statistiken...</p>
        </div>
      )}
    </div>
  );
}

export default StatisticsDashboard; 