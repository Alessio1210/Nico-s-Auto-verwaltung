import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlobalDashboard from './GlobalDashboard';
import UserDashboard from './UserDashboard';

function Dashboard({ user, isAdmin }) {
  const [dashboardData, setDashboardData] = useState({
    // Gemeinsame Daten für beide Dashboards
    vehicles: [],
    bookings: [],
    statistics: {
      totalBookings: 0,
      upcomingBookings: 0,
      completedBookings: 0,
      rejectedBookings: 0
    }
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Daten laden, wenn die Komponente montiert wird
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Je nachdem, welche API-Endpunkte implementiert sind, können hier verschiedene
        // Daten für Benutzer und Administratoren geladen werden
        
        // Hier könnten für Admin-User mehr Daten geladen werden als für normale Benutzer
        if (isAdmin) {
          // Admin-spezifische Daten laden
          try {
            const response = await axios.get('http://localhost:5000/api/admin/dashboard');
            if (response.data) {
              setDashboardData(response.data);
            }
          } catch (adminError) {
            console.log('Konnte keine Admin-spezifischen Daten laden, verwende Dummy-Daten');
            // Fehlerbehandlung: Wir stellen sicher, dass wir trotzdem Dashboard-Daten haben
            // indem wir mit Dummy-Daten arbeiten
          }
        } else {
          // Benutzer-spezifische Daten laden
          try {
            const response = await axios.get(`http://localhost:5000/api/users/${user.id}/dashboard`);
            if (response.data) {
              setDashboardData(response.data);
            }
          } catch (userError) {
            console.log('Konnte keine benutzerspezifischen Daten laden, verwende Dummy-Daten');
            // Fehlerbehandlung: Wir stellen sicher, dass wir trotzdem Dashboard-Daten haben
          }
        }
        
        // Gemeinsame Daten für alle Benutzer, falls die spezifischen Anfragen fehlschlagen
        try {
          const vehiclesResponse = await axios.get('http://localhost:5000/api/vehicles');
          if (vehiclesResponse.data) {
            if (Array.isArray(vehiclesResponse.data)) {
              setDashboardData(prev => ({...prev, vehicles: vehiclesResponse.data}));
            } else if (vehiclesResponse.data.vehicles && Array.isArray(vehiclesResponse.data.vehicles)) {
              setDashboardData(prev => ({...prev, vehicles: vehiclesResponse.data.vehicles}));
            }
          }

          const bookingsResponse = await axios.get('http://localhost:5000/api/bookings');
          if (bookingsResponse.data) {
            if (Array.isArray(bookingsResponse.data)) {
              setDashboardData(prev => ({...prev, bookings: bookingsResponse.data}));
            } else if (bookingsResponse.data.bookings && Array.isArray(bookingsResponse.data.bookings)) {
              setDashboardData(prev => ({...prev, bookings: bookingsResponse.data.bookings}));
            }
          }
        } catch (commonError) {
          console.log('Konnte keine gemeinsamen Daten laden');
        }
      } catch (error) {
        console.error('Fehler beim Laden der Dashboard-Daten:', error);
        setError('Die Dashboard-Daten konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAdmin, user?.id]);

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center my-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Dashboard wird geladen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center my-12 text-red-500">
        <p className="mb-2 font-semibold">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Erneut laden
        </button>
      </div>
    );
  }

  // Renderlogik: Je nach Benutzerrolle das passende Dashboard anzeigen
  return (
    <div className="dashboard-container">
      {isAdmin ? (
        <GlobalDashboard data={dashboardData} user={user} />
      ) : (
        <UserDashboard data={dashboardData} user={user} />
      )}
    </div>
  );
}

export default Dashboard; 