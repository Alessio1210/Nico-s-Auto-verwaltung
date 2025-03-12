import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CalendarIcon, 
  TruckIcon, 
  ClockIcon, 
  UserIcon, 
  CurrencyEuroIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

function GlobalDashboard({ data, user }) {
  // State für die Dashboard-Daten, die automatisch mit den übergebenen Daten oder Dummy-Daten befüllt werden
  const [dashboardData, setDashboardData] = useState({
    bookingCount: 47,
    activeBookings: 12,
    vehicleCount: 18,
    availableVehicles: 6,
    maintenanceCount: 5,
    userCount: 32,
    totalDistance: 57842,
    // Dummy Daten für das Balkendiagramm (Buchungen pro Tag)
    bookingsPerDay: [
      { day: 'Mo', count: 8 },
      { day: 'Di', count: 12 },
      { day: 'Mi', count: 7 },
      { day: 'Do', count: 15 },
      { day: 'Fr', count: 18 },
      { day: 'Sa', count: 3 },
      { day: 'So', count: 1 },
    ],
    // Dummy Daten für die neuesten Buchungen
    recentBookings: [
      { id: 1, user: 'Max Mustermann', vehicle: 'BMW M1', startTime: '2025-03-07T08:00:00', endTime: '2025-03-07T17:00:00', status: 'akzeptiert' },
      { id: 2, user: 'Anna Schmidt', vehicle: 'VW Polo', startTime: '2025-03-08T09:30:00', endTime: '2025-03-08T18:30:00', status: 'angefragt' },
      { id: 3, user: 'Tim Meyer', vehicle: 'Mercedes GLE', startTime: '2025-03-09T07:45:00', endTime: '2025-03-09T16:45:00', status: 'akzeptiert' },
      { id: 4, user: 'Laura Müller', vehicle: 'Audi RS5', startTime: '2025-03-10T10:15:00', endTime: '2025-03-10T19:15:00', status: 'abgelehnt' },
    ],
    // Dummy Daten für anstehende Wartungen
    upcomingMaintenance: [
      { id: 1, vehicle: 'VW Polo', date: '2025-03-15', type: 'Ölwechsel' },
      { id: 2, vehicle: 'BMW M1', date: '2025-03-18', type: 'Inspektion' },
      { id: 3, vehicle: 'Mercedes GLE', date: '2025-03-25', type: 'TÜV' },
    ],
    // Dummy Daten für Fahrzeugauslastung
    vehicleUsage: [
      { vehicle: 'VW Polo', usage: 87 },
      { vehicle: 'BMW M1', usage: 65 },
      { vehicle: 'Mercedes GLE', usage: 78 },
      { vehicle: 'Porsche GT3', usage: 43 },
      { vehicle: 'Audi RS5', usage: 92 },
    ]
  });

  // Effekt zum Verarbeiten der übergebenen Daten
  useEffect(() => {
    if (data) {
      const processedData = {...dashboardData};
      
      // Verarbeitung der übergebenen Daten und Aktualisierung des States
      if (data.vehicles && Array.isArray(data.vehicles)) {
        processedData.vehicleCount = data.vehicles.length;
        
        // Korrigierte Logik: Ein Fahrzeug ist verfügbar, wenn es keine aktive Buchung hat
        // oder wenn es explizit als 'Verfügbar' markiert ist
        if (data.bookings && Array.isArray(data.bookings)) {
          // Aktive Buchungen filtern (akzeptiert oder angefragt)
          const activeBookings = data.bookings.filter(booking => 
            booking.status === 'akzeptiert' || booking.status === 'angefragt'
          );
          
          processedData.activeBookings = activeBookings.length;
          
          // IDs der Fahrzeuge in aktiven Buchungen
          const bookedVehicleIds = activeBookings.map(booking => booking.vehicleId);
          
          // Fahrzeuge sind verfügbar, wenn ihre ID nicht in den gebuchten Fahrzeugen ist
          // oder wenn sie explizit als 'Verfügbar' markiert sind
          const availableVehiclesCount = data.vehicles.filter(vehicle => 
            !bookedVehicleIds.includes(vehicle.id) && 
            (vehicle.status === 'Verfügbar' || vehicle.status === 'verfügbar' || !vehicle.status)
          ).length;
          
          processedData.availableVehicles = activeBookings.length === 0 
            ? data.vehicles.length 
            : availableVehiclesCount;
        } else {
          // Wenn keine Buchungsdaten vorhanden sind, gehen wir davon aus, dass alle Fahrzeuge verfügbar sind
          processedData.availableVehicles = data.vehicles.length;
        }
        
        // Fahrzeugauslastung berechnen, falls Daten vorhanden
        if (data.bookings && Array.isArray(data.bookings)) {
          const vehicleUsage = data.vehicles.map(vehicle => {
            // Finde alle Buchungen für dieses Fahrzeug
            const bookingsForVehicle = data.bookings.filter(b => b.vehicleId === vehicle.id);
            
            // Berechne Auslastung basierend auf der Anzahl der Buchungen
            // im Verhältnis zu allen Buchungen oder direkt als Prozentsatz der Nutzungszeit
            let usagePercentage = 0;
            
            if (bookingsForVehicle.length > 0) {
              // Auslastung basierend auf der Zeit, die das Fahrzeug gebucht war
              let totalHoursBooked = 0;
              const currentDate = new Date();
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(currentDate.getDate() - 30);
              const totalHoursInMonth = 30 * 24; // 30 Tage * 24 Stunden
              
              bookingsForVehicle.forEach(booking => {
                const startTime = new Date(booking.startTime);
                const endTime = new Date(booking.endTime);
                
                // Nur Buchungen der letzten 30 Tage berücksichtigen
                if (endTime >= thirtyDaysAgo) {
                  // Stundendifferenz zwischen Start und Ende berechnen
                  const hoursDiff = (endTime - startTime) / (1000 * 60 * 60);
                  totalHoursBooked += hoursDiff;
                }
              });
              
              // Auslastung = gebuchte Stunden / Gesamtstunden im Monat
              usagePercentage = Math.min(Math.round((totalHoursBooked / totalHoursInMonth) * 100), 100);
            }
            
            return {
              vehicle: vehicle.model || vehicle.marke || 'Unbekannt',
              usage: usagePercentage
            };
          });
          
          // Sortieren nach Auslastung (absteigend) und auf 5 Einträge begrenzen
          processedData.vehicleUsage = vehicleUsage
            .sort((a, b) => b.usage - a.usage)
            .slice(0, 5);
        }
      }
      
      if (data.bookings && Array.isArray(data.bookings)) {
        processedData.bookingCount = data.bookings.length;
        processedData.activeBookings = data.bookings.filter(b => 
          b.status === 'akzeptiert' || b.status === 'angefragt'
        ).length;
        
        // Neueste Buchungen filtern und sortieren
        processedData.recentBookings = data.bookings
          .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
          .slice(0, 5);
          
        // Berechnung der Buchungen pro Tag
        const now = new Date();
        const daysOfWeek = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
        const bookingsPerDay = Array(7).fill(0).map((_, index) => {
          const day = new Date();
          day.setDate(now.getDate() - now.getDay() + index);
          
          const count = data.bookings.filter(booking => {
            const bookingDate = new Date(booking.startTime);
            return (
              bookingDate.getDate() === day.getDate() &&
              bookingDate.getMonth() === day.getMonth() &&
              bookingDate.getFullYear() === day.getFullYear()
            );
          }).length;
          
          return { day: daysOfWeek[index], count };
        });
        
        processedData.bookingsPerDay = bookingsPerDay;
      }
      
      if (data.users && Array.isArray(data.users)) {
        processedData.userCount = data.users.length;
      }
      
      if (data.maintenanceRecords && Array.isArray(data.maintenanceRecords)) {
        processedData.maintenanceCount = data.maintenanceRecords.length;
        
        // Anstehende Wartungen sortieren
        processedData.upcomingMaintenance = data.maintenanceRecords
          .filter(m => new Date(m.date) > new Date())
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 5);
      }
      
      if (data.statistics && typeof data.statistics === 'object') {
        if (data.statistics.totalDistance) {
          processedData.totalDistance = data.statistics.totalDistance;
        }
      }
      
      setDashboardData(processedData);
    }
  }, [data]);

  // Hilfsfunktion zur Formatierung von Datum/Zeit
  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Hilfsfunktion zur Bestimmung der Statusfarbe
  const getStatusColor = (status) => {
    switch(status) {
      case 'akzeptiert':
        return 'bg-green-100 text-green-800';
      case 'angefragt':
        return 'bg-yellow-100 text-yellow-800';
      case 'abgelehnt':
        return 'bg-red-100 text-red-800';
      case 'abgeschlossen':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Berechnung des maximalen Werts für das Balkendiagramm
  const maxBookingCount = Math.max(...dashboardData.bookingsPerDay.map(day => day.count));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
          <p className="text-sm text-gray-500">Willkommen, {user ? user.name : 'Administrator'}</p>
        </div>
        <div className="text-sm text-gray-500">
          Letztes Update: {new Date().toLocaleDateString('de-DE')} {new Date().toLocaleTimeString('de-DE')}
        </div>
      </div>

      {/* Kachelbereich für Schnellübersicht */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500 mb-1">Fahrzeuge gesamt</p>
            <p className="text-2xl font-bold">{dashboardData.vehicleCount}</p>
            <p className="text-sm text-green-600">{dashboardData.availableVehicles} verfügbar</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-lg">
            <TruckIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500 mb-1">Buchungen</p>
            <p className="text-2xl font-bold">{dashboardData.bookingCount}</p>
            <p className="text-sm text-blue-600">{dashboardData.activeBookings} aktiv</p>
          </div>
          <div className="bg-indigo-100 p-3 rounded-lg">
            <CalendarIcon className="h-8 w-8 text-indigo-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500 mb-1">Gesamte Strecke</p>
            <p className="text-2xl font-bold">{dashboardData.totalDistance.toLocaleString()} km</p>
            <p className="text-sm text-gray-500">Alle Fahrzeuge</p>
          </div>
          <div className="bg-green-100 p-3 rounded-lg">
            <ChartBarIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500 mb-1">Benutzer</p>
            <p className="text-2xl font-bold">{dashboardData.userCount}</p>
            <p className="text-sm text-gray-500">Registrierte Nutzer</p>
          </div>
          <div className="bg-purple-100 p-3 rounded-lg">
            <UserIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Hauptbereich mit Charts und Listen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Buchungen pro Tag (Balkendiagramm) */}
        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Buchungen pro Tag</h3>
          <div className="relative h-64">
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between h-56">
              {dashboardData.bookingsPerDay.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center w-full">
                  <div 
                    className="w-12 bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                    style={{ height: `${maxBookingCount > 0 ? (day.count / maxBookingCount) * 100 : 0}%` }}
                  ></div>
                  <div className="mt-2 text-xs text-gray-500">{day.day}</div>
                </div>
              ))}
            </div>
            {/* Y-Achse */}
            <div className="absolute top-0 left-0 bottom-0 flex flex-col justify-between">
              <span className="text-xs text-gray-500">{maxBookingCount}</span>
              <span className="text-xs text-gray-500">{Math.round(maxBookingCount / 2)}</span>
              <span className="text-xs text-gray-500">0</span>
            </div>
          </div>
        </div>

        {/* Fahrzeugauslastung */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Fahrzeugauslastung</h3>
          <div className="space-y-4">
            {dashboardData.vehicleUsage.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.vehicle}</span>
                  <span>{item.usage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      item.usage > 80 ? 'bg-red-500' : 
                      item.usage > 50 ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`} 
                    style={{ width: `${item.usage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unterer Bereich mit Listen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Neueste Buchungen */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Neueste Buchungen</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Benutzer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fahrzeug</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zeit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dashboardData.recentBookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{booking.userName || booking.user}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{booking.vehicleName || booking.vehicle}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {formatDateTime(booking.startTime)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-right">
            <button 
              onClick={() => alert('Funktion noch nicht implementiert')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Alle anzeigen →
            </button>
          </div>
        </div>

        {/* Anstehende Wartungen */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Anstehende Wartungen</h3>
          {dashboardData.upcomingMaintenance.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.upcomingMaintenance.map(maintenance => (
                <div key={maintenance.id} className="flex items-start p-3 border rounded hover:bg-gray-50">
                  <div className="flex-shrink-0 mr-4">
                    <WrenchScrewdriverIcon className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{maintenance.vehicleName || maintenance.vehicle}</p>
                    <p className="text-sm text-gray-500">{maintenance.type}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(maintenance.date).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p>Keine anstehenden Wartungen</p>
            </div>
          )}
          <div className="mt-4 text-right">
            <button
              onClick={() => alert('Funktion noch nicht implementiert')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Wartungsplan →
            </button>
          </div>
        </div>
      </div>

      {/* Admin Action Buttons */}
      <div className="flex flex-wrap justify-end gap-4 mt-6">
        <button
          onClick={() => alert('Funktion noch nicht implementiert')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
        >
          <CalendarIcon className="h-5 w-5 mr-2" />
          Buchungen verwalten
        </button>
        
        <button
          onClick={() => alert('Funktion noch nicht implementiert')}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center"
        >
          <TruckIcon className="h-5 w-5 mr-2" />
          Fahrzeug hinzufügen
        </button>
        
        <button
          onClick={() => alert('Funktion noch nicht implementiert')}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center"
        >
          <UserIcon className="h-5 w-5 mr-2" />
          Benutzer verwalten
        </button>
      </div>
    </div>
  );
}

export default GlobalDashboard; 