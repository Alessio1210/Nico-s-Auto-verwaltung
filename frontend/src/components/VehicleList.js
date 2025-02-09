import React, { useState, useEffect } from 'react';
import axios from 'axios';

function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/vehicles')
      .then(response => {
        setVehicles(response.data);
      })
      .catch(error => console.error('Error fetching vehicles:', error));
  }, []);

  const filteredVehicles = vehicles.filter(vehicle => 
    vehicle.modell.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.kennzeichen.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Fahrzeugflotte</h2>
        <button 
          onClick={() => window.location.href = 'http://localhost:5000/api/vehicles/export'}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Export CSV
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Suche nach Modell oder Kennzeichen..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map(vehicle => (
          <div key={vehicle.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="relative pb-48">
              <img 
                src={vehicle.bild} 
                alt={vehicle.modell}
                className="absolute h-full w-full object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900">{vehicle.modell}</h3>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-gray-600">{vehicle.kennzeichen}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  vehicle.status === 'verfügbar' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {vehicle.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VehicleList; 