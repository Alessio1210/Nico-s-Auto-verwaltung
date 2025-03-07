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

function GlobalDashboard() {
  // Dummy Daten für das Dashboard
  const [dashboardData, setDashboardData] = useState({
    bookingCount: 47,
    activeBookings: 12,
    vehicleCount: 18,
    availableVehicles: 11,
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

  // Effekt zum Laden echter Daten (momentan deaktiviert, verwendet Dummy-Daten)
  useEffect(() => {
    // Hier später die tatsächlichen API-Aufrufe implementieren, wenn die Funktionalität fertig ist
    // Jetzt verwenden wir die Dummy-Daten aus dem State
  }, []);

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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Berechnung des maximalen Werts für das Balkendiagramm
  const maxBookingCount = Math.max(...dashboardData.bookingsPerDay.map(day => day.count));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
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
                    style={{ height: `${(day.count / maxBookingCount) * 100}%` }}
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
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{booking.user}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{booking.vehicle}</td>
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
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Alle anzeigen →
            </button>
          </div>
        </div>

        {/* Anstehende Wartungen */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Anstehende Wartungen</h3>
          <div className="space-y-4">
            {dashboardData.upcomingMaintenance.map(maintenance => (
              <div key={maintenance.id} className="flex items-start p-3 border rounded hover:bg-gray-50">
                <div className="flex-shrink-0 mr-4">
                  <WrenchScrewdriverIcon className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{maintenance.vehicle}</p>
                  <p className="text-sm text-gray-500">{maintenance.type}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {maintenance.date}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-right">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Alle anzeigen →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GlobalDashboard; 