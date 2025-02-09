import React, { useState, useEffect } from 'react';
import axios from 'axios';

function BookingForm() {
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({
    vehicleId: '',
    startzeit: '',
    endzeit: '',
    zweck: '',
    autoGroesse: ''
  });

  useEffect(() => {
    axios.get('http://localhost:5000/api/vehicles')
      .then(response => {
        setVehicles(response.data);
      })
      .catch(error => console.error('Error fetching vehicles:', error));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/bookings', {
      vehicle_id: formData.vehicleId,
      startzeit: formData.startzeit,
      endzeit: formData.endzeit,
      zweck: formData.zweck,
      auto_groesse: formData.autoGroesse,
      status: 'Angefragt'
    })
    .then(response => {
      alert('Buchungsanfrage erfolgreich gesendet!');
      setFormData({
        vehicleId: '',
        startzeit: '',
        endzeit: '',
        zweck: '',
        autoGroesse: ''
      });
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Fehler beim Senden der Anfrage');
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Fahrzeug buchen</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-lg">
        <div className="space-y-4">
          <label className="block">
            <span className="text-gray-700 font-medium">Fahrzeug</span>
            <select
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Fahrzeug auswählen</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.modell} - {vehicle.kennzeichen}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-gray-700 font-medium">Startzeit</span>
              <input
                type="datetime-local"
                name="startzeit"
                value={formData.startzeit}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                required
              />
            </label>

            <label className="block">
              <span className="text-gray-700 font-medium">Endzeit</span>
              <input
                type="datetime-local"
                name="endzeit"
                value={formData.endzeit}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                required
              />
            </label>
          </div>

          <label className="block">
            <span className="text-gray-700 font-medium">Zweck der Fahrt</span>
            <textarea
              name="zweck"
              value={formData.zweck}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Beschreiben Sie kurz den Zweck der Fahrt..."
            />
          </label>

          <label className="block">
            <span className="text-gray-700 font-medium">Gewünschte Fahrzeuggröße</span>
            <select
              name="autoGroesse"
              value={formData.autoGroesse}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Bitte wählen...</option>
              <option value="Klein">Klein</option>
              <option value="Mittel">Mittel</option>
              <option value="Groß">Groß</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Buchung anfragen
        </button>
      </form>
    </div>
  );
}

export default BookingForm; 