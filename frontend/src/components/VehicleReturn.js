import React, { useState } from 'react';
import axios from 'axios';

function VehicleReturn({ booking, onClose, onReturn }) {
  const [returnData, setReturnData] = useState({
    end_mileage: '',
    end_fuel_level: '',
    damages: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setReturnData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/bookings/${booking.id}/return`, returnData);
      onReturn();
      onClose();
    } catch (error) {
      console.error('Fehler bei der Fahrzeugrückgabe:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Fahrzeugrückgabe</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Kilometerstand bei Rückgabe
            </label>
            <input
              type="number"
              name="end_mileage"
              value={returnData.end_mileage}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              min={booking.start_mileage}
            />
            {booking.start_mileage && (
              <p className="text-sm text-gray-500 mt-1">
                Kilometerstand bei Ausgabe: {booking.start_mileage}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tankstand bei Rückgabe (%)
            </label>
            <input
              type="number"
              name="end_fuel_level"
              value={returnData.end_fuel_level}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              min="0"
              max="100"
            />
            {booking.start_fuel_level && (
              <p className="text-sm text-gray-500 mt-1">
                Tankstand bei Ausgabe: {booking.start_fuel_level}%
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Neue Schäden
            </label>
            <textarea
              name="damages"
              value={returnData.damages}
              onChange={handleChange}
              rows="3"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Beschreiben Sie eventuelle neue Schäden..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Bemerkungen
            </label>
            <textarea
              name="notes"
              value={returnData.notes}
              onChange={handleChange}
              rows="3"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Zusätzliche Bemerkungen zur Rückgabe..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Fahrzeug zurücknehmen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VehicleReturn; 