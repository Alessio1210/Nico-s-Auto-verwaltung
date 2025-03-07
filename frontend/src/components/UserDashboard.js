import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CalendarIcon, 
  TruckIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

function UserDashboard() {
  // Dummy-Daten für das Benutzer-Dashboard
  const [userDashboard, setUserDashboard] = useState({
    // Dummy Benutzer für die Demo
    currentUser: {
      id: 1,
      name: 'Max Mustermann',
      department: 'IT',
      email: 'max.mustermann@company.com'
    },
    // Dummy Buchungen des Benutzers
    userBookings: [
      { id: 101, vehicle: 'BMW M1', startTime: '2025-03-15T08:00:00', endTime: '2025-03-15T17:00:00', status: 'angefragt' },
      { id: 102, vehicle: 'VW Polo', startTime: '2025-03-07T09:00:00', endTime: '2025-03-07T18:00:00', status: 'akzeptiert' },
      { id: 103, vehicle: 'Audi RS5', startTime: '2025-02-25T08:30:00', endTime: '2025-02-25T16:30:00', status: 'abgeschlossen' },
      { id: 104, vehicle: 'Mercedes GLE', startTime: '2025-01-15T10:00:00', endTime: '2025-01-15T19:00:00', status: 'abgelehnt' }
    ],
    // Dummy Fahrzeuge, die verfügbar sind
    availableVehicles: [
      { id: 1, model: 'BMW M1', licensePlate: 'M-BW 1234', status: 'verfügbar', mileage: 28345 },
      { id: 2, model: 'VW Polo', licensePlate: 'M-VW 5678', status: 'verfügbar', mileage: 15678 },
      { id: 3, model: 'Audi RS5', licensePlate: 'M-AU 9012', status: 'verfügbar', mileage: 32890 },
      { id: 4, model: 'Mercedes GLE', licensePlate: 'M-MB 3456', status: 'verfügbar', mileage: 45678 }
    ],
    // Statistiken des Benutzers
    userStats: {
      totalBookings: 14,
      upcomingBookings: 2,
      completedBookings: 11,
      rejectedBookings: 1,
      totalDistance: 1245
    }
  });

  // Effekt zum Laden echter Daten (momentan deaktiviert)
  useEffect(() => {
    // Hier später echte API-Aufrufe implementieren
    // Momentan verwenden wir Dummy-Daten
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

  // Hilfsfunktion zur Anzeige des Status mit entsprechender Farbe und Icon
  const renderStatus = (status) => {
    switch(status) {
      case 'akzeptiert':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Akzeptiert
          </span>
        );
      case 'angefragt':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="h-4 w-4 mr-1" />
            Angefragt
          </span>
        );
      case 'abgelehnt':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-4 w-4 mr-1" />
            Abgelehnt
          </span>
        );
      case 'abgeschlossen':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Abgeschlossen
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <ExclamationCircleIcon className="h-4 w-4 mr-1" />
            {status}
          </span>
        );
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Begrüßung und Benutzerübersicht */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
            {userDashboard.currentUser.name.charAt(0)}
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-bold text-gray-800">Willkommen, {userDashboard.currentUser.name}</h2>
            <div className="mt-1 text-sm text-gray-500">
              <p>Abteilung: {userDashboard.currentUser.department}</p>
              <p>Email: {userDashboard.currentUser.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiken des Benutzers */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm text-gray-500">Gesamte Buchungen</div>
              <div className="text-xl font-bold">{userDashboard.userStats.totalBookings}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm text-gray-500">Abgeschlossene</div>
              <div className="text-xl font-bold">{userDashboard.userStats.completedBookings}</div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm text-gray-500">Bevorstehende</div>
              <div className="text-xl font-bold">{userDashboard.userStats.upcomingBookings}</div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-3 rounded-full">
              <TruckIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm text-gray-500">Zurückgelegte KM</div>
              <div className="text-xl font-bold">{userDashboard.userStats.totalDistance}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Meine Buchungen */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Meine Buchungen</h3>
        </div>
        <div className="px-6 py-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fahrzeug</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Von</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bis</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {userDashboard.userBookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{booking.vehicle}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDateTime(booking.startTime)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDateTime(booking.endTime)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{renderStatus(booking.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="px-6 py-3 bg-gray-50 text-right">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">Alle Buchungen anzeigen →</button>
        </div>
      </div>

      {/* Verfügbare Fahrzeuge */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Verfügbare Fahrzeuge</h3>
        </div>
        <div className="px-6 py-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modell</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kennzeichen</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kilometerstand</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {userDashboard.availableVehicles.map(vehicle => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{vehicle.model}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{vehicle.licensePlate}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{vehicle.mileage.toLocaleString()} km</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition duration-150 ease-in-out">
                        Anfragen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="px-6 py-3 bg-gray-50 text-right">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">Alle Fahrzeuge anzeigen →</button>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard; 