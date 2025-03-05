import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import axios from 'axios';

function BookingCalendar({ vehicleId }) {
  const [bookings, setBookings] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    // Lade Buchungen
    axios.get(`http://localhost:5000/api/vehicles/${vehicleId}/bookings`)
      .then(response => {
        const formattedBookings = response.data.map(booking => ({
          id: booking.id,
          title: `Gebucht von ${booking.user_name}`,
          start: booking.startzeit,
          end: booking.endzeit,
          backgroundColor: getStatusColor(booking.status),
          extendedProps: {
            zweck: booking.zweck,
            status: booking.status
          }
        }));
        setBookings(formattedBookings);
      })
      .catch(error => console.error('Error:', error));

    // Überprüfe Bildschirmgröße
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [vehicleId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Angefragt': return '#fbbf24'; // Gelb
      case 'Bestätigt': return '#34d399'; // Grün
      case 'Abgelehnt': return '#ef4444'; // Rot
      default: return '#94a3b8'; // Grau
    }
  };

  const handleDateSelect = (selectInfo) => {
    // Hier später: Buchungsdialog öffnen
  };

  const handleEventClick = (clickInfo) => {
    // Hier später: Buchungsdetails anzeigen
  };

  return (
    <div className="h-full">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView={isMobile ? 'listWeek' : 'timeGridWeek'}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: isMobile ? 'listWeek,dayGridMonth' : 'timeGridWeek,dayGridMonth'
        }}
        events={bookings}
        selectable={true}
        select={handleDateSelect}
        eventClick={handleEventClick}
        height="auto"
        locale="de"
        firstDay={1}
        allDaySlot={false}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        slotDuration="00:30:00"
        expandRows={true}
        stickyHeaderDates={true}
        dayMaxEvents={true}
        views={{
          timeGridWeek: {
            titleFormat: { year: 'numeric', month: 'long', day: 'numeric' }
          },
          dayGridMonth: {
            titleFormat: { year: 'numeric', month: 'long' }
          },
          listWeek: {
            titleFormat: { year: 'numeric', month: 'long', day: 'numeric' }
          }
        }}
      />
    </div>
  );
}

export default BookingCalendar; 