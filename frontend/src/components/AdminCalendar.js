import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, ViewListIcon, ViewGridIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

// Farben für verschiedene Fahrzeuge
const vehicleColors = [
  '#4f46e5', // indigo
  '#10b981', // emerald
  '#ef4444', // red
  '#f97316', // orange
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#f59e0b', // amber
  '#64748b', // slate
  '#84cc16'  // lime
];

// Hash-Funktion, um konsistente Farben für ein Fahrzeug zu bekommen
const getVehicleColor = (vehicleId) => {
  const id = parseInt(vehicleId);
  return vehicleColors[id % vehicleColors.length];
};

function AdminCalendar({ vehicles: propVehicles }) {
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month'); // 'day', 'week', 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState('all'); // 'all', 'booked', 'available'
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSearchTerm, setTempSearchTerm] = useState('');
  const [showAllVehicles, setShowAllVehicles] = useState(false);
  
  // Referenz zum Suchfeld, um den Fokus zu behalten
  const searchInputRef = useRef(null);

  // Lade alle Fahrzeuge und Buchungen
  useEffect(() => {
    setLoading(true);
    
    try {
      // Nutze Fahrzeuge aus Props (falls vorhanden) oder aus dem localStorage
      if (propVehicles && propVehicles.length > 0) {
        console.log('Nutze Fahrzeuge aus Props:', propVehicles);
        setVehicles(propVehicles);
      } else {
        // Lade alle Fahrzeuge aus dem localStorage als Fallback
        const savedVehicles = localStorage.getItem('vehicles');
        const vehiclesList = savedVehicles ? JSON.parse(savedVehicles) : [];
        console.log('Nutze Fahrzeuge aus localStorage:', vehiclesList);
        setVehicles(vehiclesList);
      }
      
      // Lade alle Anfragen aus dem localStorage
      const savedRequests = localStorage.getItem('vehicleRequests');
      const allBookings = savedRequests ? JSON.parse(savedRequests) : [];
      
      // Sortiere nach Startdatum
      allBookings.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
      
      setBookings(allBookings);
      console.log('Alle Buchungen geladen:', allBookings);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    } finally {
      setLoading(false);
    }
  }, [propVehicles]);

  // Hilfsfunktionen für Datumsberechnungen
  const getMonthName = (date) => {
    return date.toLocaleString('de-DE', { month: 'long' });
  };
  
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay() || 7; // Wandelt 0 (Sonntag) in 7 um für europäisches Format
  };
  
  const getDaysInWeek = (date) => {
    const day = date.getDay() || 7; // Konvertiere Sonntag (0) zu 7
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - day + 1); // Montag der aktuellen Woche
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      days.push(currentDay);
    }
    
    return days;
  };

  // Navigation
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(currentDate.getDate() - 1);
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };
  
  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(currentDate.getDate() + 1);
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Formatierung für die Anzeige
  const formatDate = (date) => {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Buchungen nach Datum filtern
  const getBookingsForDate = (date) => {
    return bookings.filter(booking => {
      const startDate = new Date(booking.startDateTime);
      const endDate = new Date(booking.endDateTime);
      
      // Setze die Zeiten auf Mitternacht für Datumsvergleich
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      
      const startDay = new Date(startDate);
      startDay.setHours(0, 0, 0, 0);
      
      const endDay = new Date(endDate);
      endDay.setHours(0, 0, 0, 0);
      
      return checkDate >= startDay && checkDate <= endDay;
    });
  };

  // Buchungsdetails anzeigen
  const showBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetails(true);
  };
  
  const hideBookingDetails = () => {
    setSelectedBooking(null);
    setShowDetails(false);
  };

  // Render der Tagesansicht
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dateToShow = new Date(currentDate);
    const todayBookings = getBookingsForDate(dateToShow);
    const filteredVehicles = getFilteredVehicles();
    
    // Funktion, um zu prüfen, ob ein Fahrzeug an diesem Tag gebucht ist
    const isVehicleBookedOnDate = (vehicleId) => {
      return todayBookings.some(booking => booking.vehicleId === vehicleId.toString());
    };
    
    return (
      <div className="overflow-auto max-h-[calc(100vh-300px)]">
        <div className="grid grid-cols-[80px_1fr] border-b">
          <div className="text-center py-2 font-semibold">
            Uhrzeit
          </div>
          <div className="text-center py-2 font-semibold">
            {formatDate(dateToShow)}
          </div>
        </div>
        
        {hours.map(hour => {
          const hourText = `${hour.toString().padStart(2, '0')}:00`;
          const hourBookings = todayBookings.filter(booking => {
            const startTime = new Date(booking.startDateTime);
            const endTime = new Date(booking.endDateTime);
            const currentHourStart = new Date(dateToShow);
            currentHourStart.setHours(hour, 0, 0, 0);
            const currentHourEnd = new Date(dateToShow);
            currentHourEnd.setHours(hour, 59, 59, 999);
            
            return (
              (startTime >= currentHourStart && startTime <= currentHourEnd) || 
              (endTime >= currentHourStart && endTime <= currentHourEnd) ||
              (startTime <= currentHourStart && endTime >= currentHourEnd)
            );
          });
          
          // Für Stunden 8-18 Uhr, zeige Fahrzeuge ohne Buchungen an, wenn Option aktiviert
          const showEmptyVehicles = showAllVehicles && hour >= 8 && hour <= 18;
          // Fahrzeuge, die in dieser Stunde keine Buchung haben
          const unbookedVehicles = showEmptyVehicles ? 
            filteredVehicles.filter(vehicle => 
              !hourBookings.some(booking => booking.vehicleId === vehicle.id.toString())
            ) : [];
          
          return (
            <div key={hour} className="grid grid-cols-[80px_1fr] border-b min-h-[60px] hover:bg-gray-50">
              <div className="text-right pr-2 py-2 text-sm border-r">
                {hourText}
              </div>
              <div className="p-1 relative">
                {hourBookings.map((booking, idx) => (
                  <div 
                    key={`${booking.id}-${idx}`}
                    className="mb-1 p-1 rounded cursor-pointer hover:shadow-md transition-shadow"
                    style={{ 
                      backgroundColor: `${getVehicleColor(booking.vehicleId)}15`,
                      borderLeft: `4px solid ${getVehicleColor(booking.vehicleId)}`
                    }}
                    onClick={() => showBookingDetails(booking)}
                  >
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold">
                        {booking.vehicleModel || 'Fahrzeug'}
                      </span>
                      <span className="text-gray-500">
                        {formatTime(booking.startDateTime)}-{formatTime(booking.endDateTime)}
                      </span>
                    </div>
                    <div className="text-xs truncate">
                      {booking.userName}: {booking.purpose}
                    </div>
                  </div>
                ))}
                
                {/* Fahrzeuge ohne Buchungen */}
                {showEmptyVehicles && unbookedVehicles.map((vehicle) => (
                  <div 
                    key={`empty-${vehicle.id}-${hour}`}
                    className="mb-1 p-1 rounded border border-dashed"
                    style={{ 
                      borderColor: getVehicleColor(vehicle.id),
                      backgroundColor: `${getVehicleColor(vehicle.id)}05`,
                    }}
                  >
                    <div className="text-xs font-semibold text-gray-500">
                      {vehicle.modell} - Verfügbar
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render der Wochenansicht
  const renderWeekView = () => {
    const weekDays = getDaysInWeek(currentDate);
    const weekdayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const filteredVehicles = getFilteredVehicles();
    
    return (
      <div className="overflow-auto max-h-[calc(100vh-300px)]">
        <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b">
          <div className="p-2"></div>
          {weekDays.map((day, idx) => (
            <div 
              key={idx}
              className={`text-center p-2 font-semibold ${
                day.toDateString() === new Date().toDateString() ? 'bg-blue-50' : ''
              }`}
            >
              <div>{weekdayNames[idx]}</div>
              <div>{day.getDate()}</div>
            </div>
          ))}
        </div>
        
        {Array.from({ length: 12 }, (_, i) => i + 8).map(hour => {
          const hourText = `${hour.toString().padStart(2, '0')}:00`;
          
          return (
            <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] border-b hover:bg-gray-50 min-h-[60px]">
              <div className="text-right pr-2 py-2 text-sm border-r">
                {hourText}
              </div>
              
              {weekDays.map((day, dayIdx) => {
                const currentDate = new Date(day);
                currentDate.setHours(hour, 0, 0, 0);
                
                const hourBookings = bookings.filter(booking => {
                  const startTime = new Date(booking.startDateTime);
                  const endTime = new Date(booking.endDateTime);
                  const currentHourStart = new Date(currentDate);
                  const currentHourEnd = new Date(currentDate);
                  currentHourEnd.setHours(hour, 59, 59, 999);
                  
                  return (
                    (startTime >= currentHourStart && startTime <= currentHourEnd) || 
                    (endTime >= currentHourStart && endTime <= currentHourEnd) ||
                    (startTime <= currentHourStart && endTime >= currentHourEnd)
                  );
                });
                
                // Zeige Fahrzeuge ohne Buchungen an, wenn Option aktiviert ist
                // Ausgenommen sind Wochenenden
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const showEmptyVehicles = showAllVehicles && !isWeekend;
                
                // Fahrzeuge, die in dieser Stunde keine Buchung haben
                const unbookedVehicles = showEmptyVehicles ? 
                  filteredVehicles.filter(vehicle => 
                    !hourBookings.some(booking => booking.vehicleId === vehicle.id.toString())
                  ) : [];
                
                return (
                  <div 
                    key={dayIdx} 
                    className={`p-1 border-r ${
                      day.toDateString() === new Date().toDateString() ? 'bg-blue-50' : ''
                    }`}
                  >
                    {hourBookings.map((booking, idx) => (
                      <div 
                        key={`${booking.id}-${idx}`}
                        className="mb-1 p-1 rounded cursor-pointer hover:shadow-md transition-shadow"
                        style={{ 
                          backgroundColor: `${getVehicleColor(booking.vehicleId)}15`,
                          borderLeft: `4px solid ${getVehicleColor(booking.vehicleId)}`
                        }}
                        onClick={() => showBookingDetails(booking)}
                      >
                        <div className="text-xs font-semibold truncate">
                          {booking.vehicleModel || 'Fahrzeug'}
                        </div>
                        <div className="text-xs truncate">
                          {booking.userName}
                        </div>
                      </div>
                    ))}
                    
                    {/* Anzeige der verfügbaren Fahrzeuge */}
                    {showEmptyVehicles && unbookedVehicles.length > 0 && (
                      <div 
                        className="mt-1 text-center text-xs text-gray-500 bg-gray-50 rounded p-1"
                        title={unbookedVehicles.map(v => v.modell).join(', ')}
                      >
                        {unbookedVehicles.length} verfügbar
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // Render der Monatsansicht
  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const weekdayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const filteredVehicles = getFilteredVehicles();
    
    const days = [];
    
    // Leere Zellen für Tage vor dem ersten Tag des Monats
    for (let i = 1; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 border bg-gray-50 min-h-[100px]"></div>);
    }
    
    // Tage des Monats
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayBookings = getBookingsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      // Fahrzeuge, die an diesem Tag keine Buchung haben
      const bookedVehicleIds = dayBookings.map(booking => booking.vehicleId);
      const unbookedVehicles = showAllVehicles ? 
        filteredVehicles.filter(vehicle => 
          !bookedVehicleIds.includes(vehicle.id.toString())
        ) : [];
      
      days.push(
        <div 
          key={`day-${day}`} 
          className={`p-2 border ${isToday ? 'bg-blue-50 border-blue-300' : isWeekend ? 'bg-gray-50' : ''} min-h-[100px] overflow-y-auto`}
        >
          <div className="font-semibold">{day}</div>
          {dayBookings.map((booking, idx) => (
            <div 
              key={`${booking.id}-${idx}`}
              className="mb-1 p-1 rounded cursor-pointer hover:shadow-md transition-shadow"
              style={{ 
                backgroundColor: `${getVehicleColor(booking.vehicleId)}15`,
                borderLeft: `4px solid ${getVehicleColor(booking.vehicleId)}`
              }}
              onClick={() => showBookingDetails(booking)}
            >
              <div className="text-xs font-semibold truncate">
                {booking.vehicleModel || 'Fahrzeug'}
              </div>
              <div className="text-xs truncate">
                {booking.userName}: {booking.purpose?.substring(0, 15)}
                {booking.purpose?.length > 15 ? '...' : ''}
              </div>
            </div>
          ))}
          
          {/* Fahrzeuge ohne Buchungen */}
          {showAllVehicles && !isWeekend && unbookedVehicles.length > 0 && (
            <div className="mt-1 p-1 bg-gray-50 rounded text-xs text-gray-500">
              {unbookedVehicles.length} Fahrzeuge verfügbar
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="overflow-auto max-h-[calc(100vh-300px)]">
        <div className="grid grid-cols-7 gap-0">
          {/* Wochentage */}
          {weekdayNames.map((day, idx) => (
            <div key={idx} className="text-center p-2 font-semibold border-t border-x">
              {day}
            </div>
          ))}
          
          {/* Kalendertage */}
          {days}
        </div>
      </div>
    );
  };

  // Haupttitel für die Kalenderansicht
  const getCalendarTitle = () => {
    if (view === 'day') {
      return formatDate(currentDate);
    } else if (view === 'week') {
      const weekDays = getDaysInWeek(currentDate);
      const firstDay = weekDays[0];
      const lastDay = weekDays[6];
      
      return `${formatDate(firstDay)} - ${formatDate(lastDay)}`;
    } else {
      return `${getMonthName(currentDate)} ${currentDate.getFullYear()}`;
    }
  };

  // Bookings Details Modal
  const renderBookingDetails = () => {
    if (!selectedBooking) return null;
    
    const vehicle = vehicles.find(v => v.id === selectedBooking.vehicleId) || {
      modell: selectedBooking.vehicleModel,
      kennzeichen: selectedBooking.vehicleLicensePlate || selectedBooking.licensePlate
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-0 max-h-[90vh] overflow-y-auto">
          <div className="p-4 bg-gray-50 flex justify-between items-center border-b">
            <h3 className="text-lg font-semibold">Buchungsdetails</h3>
            <button 
              onClick={hideBookingDetails}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Fahrzeug</h4>
                <p className="font-medium">
                  {vehicle.modell} ({vehicle.kennzeichen})
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedBooking.status === 'approved' ? 'bg-green-100 text-green-800' : 
                  selectedBooking.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedBooking.status === 'approved' ? 'Genehmigt' :
                   selectedBooking.status === 'rejected' ? 'Abgelehnt' : 'Ausstehend'}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Zeitraum</h4>
                <p className="font-medium">
                  Von: {new Date(selectedBooking.startDateTime).toLocaleString('de-DE')}
                </p>
                <p className="font-medium">
                  Bis: {new Date(selectedBooking.endDateTime).toLocaleString('de-DE')}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Benutzer</h4>
                <p className="font-medium">{selectedBooking.userName}</p>
                <p className="text-sm text-gray-600">{selectedBooking.userDepartment}</p>
              </div>

              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Verwendungszweck</h4>
                <p>{selectedBooking.purpose}</p>
              </div>

              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Zielort</h4>
                <p>{selectedBooking.destination || 'Nicht angegeben'}</p>
              </div>

              {selectedBooking.notes && (
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Notizen</h4>
                  <p>{selectedBooking.notes}</p>
                </div>
              )}

              {selectedBooking.responseNote && (
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Anmerkung vom Administrator
                  </h4>
                  <p className="italic">{selectedBooking.responseNote}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 border-t flex justify-end">
            <button
              onClick={hideBookingDetails}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Ermittle, welche Fahrzeug-IDs in den aktuellen Buchungen enthalten sind
  const getBookedVehicleIds = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return bookings
      .filter(booking => {
        const endDate = new Date(booking.endDateTime);
        endDate.setHours(0, 0, 0, 0);
        return endDate >= today;
      })
      .map(booking => booking.vehicleId);
  };

  // Filtere Fahrzeuge basierend auf dem aktuellen Filter und der Suche
  const getFilteredVehicles = () => {
    const bookedVehicleIds = getBookedVehicleIds();
    let filtered = vehicles;
    
    // Erst nach Buchungsstatus filtern
    switch (vehicleFilter) {
      case 'booked':
        filtered = vehicles.filter(vehicle => bookedVehicleIds.includes(vehicle.id.toString()));
        break;
      case 'available':
        filtered = vehicles.filter(vehicle => !bookedVehicleIds.includes(vehicle.id.toString()));
        break;
      default:
        filtered = vehicles;
    }
    
    // Dann nach Suchbegriff filtern, falls vorhanden
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        vehicle => 
          vehicle.modell?.toLowerCase().includes(search) ||
          vehicle.kennzeichen?.toLowerCase().includes(search) ||
          vehicle.typ?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  };

  // Fahrzeugfarben-Legende mit Filteroptionen
  const renderVehicleLegend = () => {
    const filteredVehicles = getFilteredVehicles();
    
    return (
      <div className="mb-4">
        <div className="mb-2 flex justify-between items-center">
          <h3 className="text-sm font-semibold">Fahrzeuge ({filteredVehicles.length} von {vehicles.length})</h3>
          
          <div className="relative">
            <button 
              onClick={() => setShowFilterOptions(!showFilterOptions)}
              className="px-3 py-1 bg-white border rounded-md text-sm flex items-center"
            >
              {vehicleFilter === 'all' ? 'Alle Fahrzeuge' : 
               vehicleFilter === 'booked' ? 'Gebuchte Fahrzeuge' : 
               'Verfügbare Fahrzeuge'}
              <ChevronDownIcon className="h-4 w-4 ml-1" />
            </button>
            
            {showFilterOptions && (
              <div className="absolute right-0 mt-1 py-1 bg-white shadow-lg rounded-md z-10 w-48 border">
                <button 
                  className={`w-full text-left px-4 py-2 text-sm ${vehicleFilter === 'all' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                  onClick={() => {
                    setVehicleFilter('all');
                    setShowFilterOptions(false);
                  }}
                >
                  Alle Fahrzeuge
                </button>
                <button 
                  className={`w-full text-left px-4 py-2 text-sm ${vehicleFilter === 'booked' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                  onClick={() => {
                    setVehicleFilter('booked');
                    setShowFilterOptions(false);
                  }}
                >
                  Gebuchte Fahrzeuge
                </button>
                <button 
                  className={`w-full text-left px-4 py-2 text-sm ${vehicleFilter === 'available' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                  onClick={() => {
                    setVehicleFilter('available');
                    setShowFilterOptions(false);
                  }}
                >
                  Verfügbare Fahrzeuge
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {filteredVehicles.map((vehicle, idx) => {
            const isBooked = getBookedVehicleIds().includes(vehicle.id.toString());
            
            return (
              <div 
                key={idx}
                className="flex items-center px-2 py-1 rounded text-xs"
                style={{ 
                  backgroundColor: `${getVehicleColor(vehicle.id)}15`,
                }}
              >
                <div 
                  className="w-3 h-3 rounded-full mr-1"
                  style={{ backgroundColor: getVehicleColor(vehicle.id) }}
                ></div>
                <span>
                  {vehicle.modell} ({vehicle.kennzeichen})
                  {isBooked && <span className="ml-1 text-xs text-gray-500">•</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Komplett neu implementierte Suchfunktion
  const SearchForm = () => {
    const [inputValue, setInputValue] = useState(searchTerm);
    const inputRef = useRef(null);

    // Formular-Submit-Handler - wird nur aufgerufen, wenn Enter gedrückt oder der Button geklickt wird
    const handleSubmit = (e) => {
      e.preventDefault(); // Verhindert Seiten-Reload
      setSearchTerm(inputValue); // Nur hier wird der tatsächliche Suchbegriff gesetzt
    };

    // Reset-Funktion für die Suche
    const resetSearch = () => {
      setInputValue('');
      setSearchTerm('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    return (
      <form onSubmit={handleSubmit} className="relative w-full md:w-72 mb-4 md:mb-0">
        <div className="flex">
          <div className="relative flex-grow">
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Fahrzeug suchen..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-4 py-2 border rounded-l-md pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
            {inputValue && (
              <button
                type="button"
                onClick={resetSearch}
                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                title="Suche zurücksetzen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
            title="Suche starten"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Lade Kalender...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Fahrzeugkalender</h1>
      
      {/* Suchleiste und Einstellungen - hier SearchForm statt SearchBar verwenden */}
      <div className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <SearchForm />
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={showAllVehicles}
              onChange={() => setShowAllVehicles(!showAllVehicles)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            Alle Fahrzeuge anzeigen (auch ohne Buchungen)
          </label>
        </div>
      </div>
      
      {/* Kontrollleiste */}
      <div className="flex flex-col md:flex-row justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <button
            onClick={goToPrevious}
            className="p-2 border rounded mr-2 hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={goToToday}
            className="px-4 py-2 border rounded mr-2 hover:bg-gray-100"
          >
            Heute
          </button>
          
          <button
            onClick={goToNext}
            className="p-2 border rounded mr-4 hover:bg-gray-100"
          >
            <ArrowRightIcon className="h-5 w-5" />
          </button>
          
          <h2 className="text-xl font-semibold">
            {getCalendarTitle()}
          </h2>
        </div>
        
        <div className="flex">
          <button
            onClick={() => setView('day')}
            className={`px-4 py-2 border-t border-b border-l rounded-l ${
              view === 'day' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'hover:bg-gray-100'
            }`}
          >
            Tag
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-4 py-2 border ${
              view === 'week' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'hover:bg-gray-100'
            }`}
          >
            Woche
          </button>
          <button
            onClick={() => setView('month')}
            className={`px-4 py-2 border-t border-b border-r rounded-r ${
              view === 'month' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'hover:bg-gray-100'
            }`}
          >
            Monat
          </button>
        </div>
      </div>
      
      {/* Fahrzeugfarben-Legende */}
      {renderVehicleLegend()}
      
      {/* Kalenderansicht */}
      <div className="bg-white rounded-lg shadow overflow-hidden border">
        {vehicles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Keine Fahrzeuge verfügbar. Bitte fügen Sie zuerst Fahrzeuge hinzu.
          </div>
        ) : (
          <>
            {view === 'day' && renderDayView()}
            {view === 'week' && renderWeekView()}
            {view === 'month' && renderMonthView()}
          </>
        )}
      </div>
      
      {/* Buchungsdetails Modal */}
      {showDetails && renderBookingDetails()}
    </div>
  );
}

export default AdminCalendar; 