import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import de from 'date-fns/locale/de';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import BookingForm from './BookingForm';

const locales = {
  'de': de,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    fetchBookings();
    fetchVehicles();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/bookings');
      const formattedBookings = response.data.map(booking => ({
        ...booking,
        start: new Date(booking.start_date),
        end: new Date(booking.end_date),
        title: `${booking.vehicle_name} - ${booking.employee_name}`
      }));
      setBookings(formattedBookings);
    } catch (error) {
      console.error('Fehler beim Laden der Buchungen:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/vehicles');
      setVehicles(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Fahrzeuge:', error);
    }
  };

  const handleSelectSlot = ({ start }) => {
    setSelectedDate(start);
    setSelectedBooking(null);
    setShowBookingForm(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedBooking(event);
    setShowBookingForm(true);
  };

  const handleBookingSubmit = async (bookingData) => {
    try {
      if (selectedBooking) {
        // Buchung aktualisieren
        await axios.put(`http://localhost:5000/api/bookings/${selectedBooking.id}`, bookingData);
      } else {
        // Neue Buchung erstellen
        await axios.post('http://localhost:5000/api/bookings', bookingData);
      }
      fetchBookings();
      setShowBookingForm(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Fehler beim Speichern der Buchung:', error);
    }
  };

  const eventStyleGetter = (event) => {
    let style = {
      backgroundColor: '#3174ad',
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    };

    switch (event.status) {
      case 'Reserviert':
        style.backgroundColor = '#fbbf24'; // Gelb
        break;
      case 'Ausgegeben':
        style.backgroundColor = '#34d399'; // Grün
        break;
      case 'Zurückgegeben':
        style.backgroundColor = '#9ca3af'; // Grau
        break;
      default:
        break;
    }

    return {
      style
    };
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Fahrzeugbuchungen</h1>
        <button
          onClick={() => {
            setSelectedBooking(null);
            setShowBookingForm(true);
          }}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Neue Buchung
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4" style={{ height: '700px' }}>
        <Calendar
          localizer={localizer}
          events={bookings}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          eventPropGetter={eventStyleGetter}
          messages={{
            next: "Vor",
            previous: "Zurück",
            today: "Heute",
            month: "Monat",
            week: "Woche",
            day: "Tag",
            agenda: "Agenda",
            date: "Datum",
            time: "Zeit",
            event: "Termin",
            noEventsInRange: "Keine Buchungen in diesem Zeitraum"
          }}
          culture="de"
        />
      </div>

      {showBookingForm && (
        <BookingForm
          onClose={() => setShowBookingForm(false)}
          onSubmit={handleBookingSubmit}
          booking={selectedBooking}
          vehicles={vehicles}
          initialDate={selectedDate}
        />
      )}
    </div>
  );
}

export default Bookings; 