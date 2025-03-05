import React, { useState } from 'react';
import axios from 'axios';

function FuelLog({ vehicleId, onClose, onFuelLogged, editingLog = null, currentMileage = 0 }) {
  const [fuelData, setFuelData] = useState({
    amount_liters: editingLog?.amount_liters?.toString() || '',
    cost_per_liter: editingLog?.cost_per_liter?.toString() || '',
    mileage: editingLog?.mileage?.toString() || currentMileage.toString(),
    fuel_type: editingLog?.fuel_type || 'Diesel'
  });
  const [mileageWarning, setMileageWarning] = useState('');

  const validateMileage = (value) => {
    const mileage = parseInt(value);
    if (mileage < currentMileage && !editingLog) {
      setMileageWarning('Der Kilometerstand kann nicht niedriger als der aktuelle sein');
      return false;
    }
    if (mileage > currentMileage + 5000) {
      setMileageWarning('Warnung: Mehr als 5000km seit letztem Eintrag');
    } else {
      setMileageWarning('');
    }
    return true;
  };

  const handleMileageChange = (e) => {
    const value = e.target.value;
    validateMileage(value);
    handleChange(e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateMileage(fuelData.mileage)) {
      return;
    }
    try {
      if (editingLog) {
        // Update existierenden Eintrag
        await axios.put(`http://localhost:5000/api/vehicles/${vehicleId}/fuel-logs/${editingLog.id}`, {
          ...fuelData,
          amount_liters: parseFloat(fuelData.amount_liters),
          cost_per_liter: parseFloat(fuelData.cost_per_liter),
          mileage: parseInt(fuelData.mileage)
        });
      } else {
        // Erstelle neuen Eintrag
        await axios.post(`http://localhost:5000/api/vehicles/${vehicleId}/fuel-logs`, {
          ...fuelData,
          amount_liters: parseFloat(fuelData.amount_liters),
          cost_per_liter: parseFloat(fuelData.cost_per_liter),
          mileage: parseInt(fuelData.mileage)
        });
      }
      onFuelLogged();
      onClose();
    } catch (error) {
      console.error('Fehler beim Speichern des Tankprotokolls:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFuelData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {editingLog ? 'Tankeintrag bearbeiten' : 'Neuer Tankeintrag'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Getankte Menge (Liter)
            </label>
            <input
              type="number"
              step="0.01"
              name="amount_liters"
              value={fuelData.amount_liters}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Preis pro Liter (€)
            </label>
            <input
              type="number"
              step="0.001"
              name="cost_per_liter"
              value={fuelData.cost_per_liter}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Kilometerstand
              {!editingLog && (
                <span className="text-sm text-gray-500 ml-2">
                  (Aktuell: {currentMileage.toLocaleString()} km)
                </span>
              )}
            </label>
            <input
              type="number"
              name="mileage"
              value={fuelData.mileage}
              onChange={handleMileageChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                mileageWarning ? 'border-yellow-500' : 'border-gray-300'
              }`}
              required
            />
            {mileageWarning && (
              <p className="mt-1 text-sm text-yellow-600">{mileageWarning}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Kraftstoffart
            </label>
            <select
              name="fuel_type"
              value={fuelData.fuel_type}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="Diesel">Diesel</option>
              <option value="Benzin">Benzin</option>
              <option value="Super">Super</option>
              <option value="Super Plus">Super Plus</option>
            </select>
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
              {editingLog ? 'Aktualisieren' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FuelLog; 