import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BookingForm from './BookingForm';
import dayjs from 'dayjs';
import 'dayjs/locale/de';

dayjs.locale('de');

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [view, setView] = useState('list'); // 'list' oder 'form'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/bookings');
      console.log('Buchungen geladen:', response.data); // Debug-Log
      const formattedBookings = response.data.map(booking => ({
        ...booking,
        start_date: dayjs(booking.start_date),
        end_date: dayjs(booking.end_date)
      }));
      setBookings(formattedBookings);
      return formattedBookings;
    } catch (error) {
      console.error('Fehler beim Laden der Buchungen:', error);
      throw error;
    }
  };

  const fetchVehicles = async () => {
    try {
      console.log('Starte direkten Datenbank-Abruf der Fahrzeuge...'); // Debug Log
      
      // Direkter Datenbank-Abruf
      const response = await axios.get('http://localhost:5000/fahrzeug/getAll');
      console.log('Datenbank-Antwort:', response.data);
      
      if (!response.data) {
        console.error('Keine Daten aus der Datenbank erhalten');
        return [];
      }

      // Formatiere die Fahrzeuge aus der Datenbank
      const formattedVehicles = response.data.map(vehicle => ({
        id: vehicle.id.toString(),
        modell: vehicle.modell,
        kennzeichen: vehicle.kennzeichen
      }));

      console.log('Verarbeitete Fahrzeuge aus DB:', formattedVehicles);

      setVehicles(formattedVehicles);
      return formattedVehicles;
    } catch (error) {
      console.error('Fehler beim Datenbank-Abruf:', error);
      setError('Fehler beim Laden der Fahrzeuge aus der Datenbank');
      return [];
    }
  };

  // Initialer Datenload
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Starte initialen Datenladen...'); // Debug Log
        
        // Lade zuerst die Fahrzeuge
        const vehiclesData = await fetchVehicles();
        console.log('Fahrzeuge geladen:', vehiclesData);
        
        // Dann lade die Buchungen
        const bookingsData = await fetchBookings();
        console.log('Buchungen geladen:', bookingsData);
        
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        setError('Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Zusätzlicher useEffect für das Laden der Fahrzeuge beim Öffnen des Formulars
  useEffect(() => {
    if (view === 'form') {
      console.log('Formular geöffnet, lade Fahrzeuge neu...'); // Debug-Log
      fetchVehicles().catch(error => {
        console.error('Fehler beim Nachladen der Fahrzeuge:', error);
        alert('Fehler beim Laden der Fahrzeuge. Bitte versuchen Sie es später erneut.');
      });
    }
  }, [view]);

  const handleBookingSubmit = async (bookingData) => {
    try {
      if (selectedBooking) {
        await axios.put(`http://localhost:5000/api/bookings/${selectedBooking.id}`, bookingData);
      } else {
        await axios.post('http://localhost:5000/api/bookings', bookingData);
      }
      await fetchBookings();
      setView('list');
      setSelectedBooking(null);
    } catch (error) {
      console.error('Fehler beim Speichern der Buchung:', error);
      alert('Fehler beim Speichern der Buchung. Bitte versuchen Sie es später erneut.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Reserviert':
        return 'bg-yellow-100 text-yellow-800';
      case 'Ausgegeben':
        return 'bg-green-100 text-green-800';
      case 'Zurückgegeben':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-bold mb-2">Fehler</p>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Neu laden
          </button>
        </div>
      </div>
    );
  }

  if (view === 'form') {
    console.log('Übergebe Fahrzeuge an Formular:', vehicles); // Debug-Log
    return (
      <BookingForm
        onClose={() => setView('list')}
        onSubmit={handleBookingSubmit}
        booking={selectedBooking}
        vehicles={vehicles}
      />
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Fahrzeugbuchungen</h1>
        <button
          onClick={() => {
            setSelectedBooking(null);
            setView('form');
          }}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Neue Buchung
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fahrzeug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mitarbeiter
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Von
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bis
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {booking.vehicle_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {booking.employee_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {booking.start_date.format('DD.MM.YYYY HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {booking.end_date.format('DD.MM.YYYY HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedBooking(booking);
                      setView('form');
                    }}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm('Möchten Sie diese Buchung wirklich löschen?')) {
                        try {
                          await axios.delete(`http://localhost:5000/api/bookings/${booking.id}`);
                          await fetchBookings();
                        } catch (error) {
                          console.error('Fehler beim Löschen der Buchung:', error);
                          alert('Fehler beim Löschen der Buchung');
                        }
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    Löschen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Bookings; 