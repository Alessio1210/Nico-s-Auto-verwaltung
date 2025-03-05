import React, { useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { TextField } from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/de';

dayjs.locale('de');

function BookingForm({ onClose, onSubmit, booking, vehicles = [], initialDate }) {
  console.log('Verfügbare Fahrzeuge:', vehicles);

  const [formData, setFormData] = useState({
    vehicle_id: booking?.vehicle_id || '',
    employee_name: booking?.employee_name || '',
    department: booking?.department || '',
    purpose: booking?.purpose || '',
    start_date: booking?.start_date ? dayjs(booking.start_date) : dayjs(),
    end_date: booking?.end_date ? dayjs(booking.end_date) : dayjs().add(1, 'hour'),
    status: booking?.status || 'Reserviert',
    notes: booking?.notes || '',
    start_mileage: booking?.start_mileage || '',
    start_fuel_level: booking?.start_fuel_level || '',
    key_number: booking?.key_number || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      start_date: formData.start_date.toISOString(),
      end_date: formData.end_date.toISOString()
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">
          {booking ? 'Buchung bearbeiten' : 'Neue Buchung'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fahrzeug
              </label>
              <select
                name="vehicle_id"
                value={formData.vehicle_id}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                required
              >
                <option value="">Fahrzeug auswählen</option>
                {vehicles && vehicles.length > 0 ? (
                  vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.modell} ({vehicle.kennzeichen})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>Keine Fahrzeuge verfügbar</option>
                )}
              </select>
              {vehicles && vehicles.length === 0 && (
                <p className="mt-1 text-sm text-red-600">
                  Keine Fahrzeuge gefunden. Bitte stellen Sie sicher, dass Fahrzeuge im System registriert sind.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mitarbeiter
              </label>
              <input
                type="text"
                name="employee_name"
                value={formData.employee_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Abteilung/Kostenstelle
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Verwendungszweck
              </label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                rows="3"
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>

            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start
                </label>
                <DateTimePicker
                  value={formData.start_date}
                  onChange={(newValue) => setFormData({ ...formData, start_date: newValue })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ende
                </label>
                <DateTimePicker
                  value={formData.end_date}
                  onChange={(newValue) => setFormData({ ...formData, end_date: newValue })}
                  className="w-full"
                />
              </div>
            </LocalizationProvider>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              >
                <option value="Reserviert">Reserviert</option>
                <option value="Ausgegeben">Ausgegeben</option>
                <option value="Zurückgegeben">Zurückgegeben</option>
              </select>
            </div>

            {formData.status === 'Ausgegeben' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Kilometerstand bei Ausgabe
                  </label>
                  <input
                    type="number"
                    name="start_mileage"
                    value={formData.start_mileage}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tankstand bei Ausgabe (%)
                  </label>
                  <input
                    type="number"
                    name="start_fuel_level"
                    value={formData.start_fuel_level}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Schlüsselnummer
                  </label>
                  <input
                    type="text"
                    name="key_number"
                    value={formData.key_number}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notizen
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {booking ? 'Aktualisieren' : 'Buchung erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingForm; 