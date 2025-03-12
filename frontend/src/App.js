import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import VehicleList from './components/VehicleList';
import Dashboard from './components/Dashboard';
import StatisticsDashboard from './components/StatisticsDashboard';
import VehicleRequests from './components/VehicleRequests';
import UserRequests from './components/UserRequests';
import UserManagement from './components/UserManagement';
import AdminCalendar from './components/AdminCalendar';
import axios from 'axios';

// Backend-URL
const BASE_URL = 'http://localhost:5000';

// Mögliche Endpunkte für Fahrzeuganfragen
const API_ENDPOINTS = {
  // Liste aller Fahrzeuge abrufen
  GET_ALL: [
    '/fahrzeuge',
    '/api/fahrzeuge', 
    '/fahrzeug',
    '/api/fahrzeug',
    '/vehicles',
    '/api/vehicles',
    '/vehicle',
    '/api/vehicle'
  ],
  // Einzelnes Fahrzeug erstellen
  CREATE: [
    '/fahrzeug',
    '/api/fahrzeug',
    '/fahrzeuge',
    '/api/fahrzeuge',
    '/vehicle',
    '/api/vehicle',
    '/vehicles',
    '/api/vehicles'
  ],
  // Prefix für Operationen mit einzelnen Fahrzeugen (UPDATE, DELETE)
  ITEM_PREFIX: [
    '/fahrzeug/',
    '/api/fahrzeug/',
    '/fahrzeuge/',
    '/api/fahrzeuge/',
    '/vehicle/',
    '/api/vehicle/',
    '/vehicles/',
    '/api/vehicles/'
  ]
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState({
    canBookVehicles: true,
    canViewStatistics: false,
    canManageVehicles: false,
    canApproveRequests: false
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('vehicles');
  
  // Zentraler Fahrzeugzustand
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoaded, setVehiclesLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  
  // Erfolgreiche Endpunkte speichern
  const [successfulEndpoints, setSuccessfulEndpoints] = useState({
    GET_ALL: null,
    CREATE: null,
    ITEM_PREFIX: null
  });
  
  // Überprüfe, ob ein Benutzer bereits angemeldet ist
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      const userData = JSON.parse(loggedInUser);
      setUser(userData);
      setIsLoggedIn(true);
      setIsAdmin(userData.isAdmin || false);
      setUserPermissions(userData.permissions || {
        canBookVehicles: true,
        canViewStatistics: userData.isAdmin || false,
        canManageVehicles: userData.isAdmin || false,
        canApproveRequests: userData.isAdmin || false
      });
      
      // Wenn der Benutzer ein Admin ist und Passwort-Zurücksetzungsanfragen vorliegen,
      // setze die aktive Ansicht auf die Benutzerverwaltung
      if (userData.isAdmin && localStorage.getItem('passwordReset')) {
        setActiveView('user-management');
      }
    }
  }, []);
  
  // Laden der Fahrzeuge beim Start der Anwendung (nur wenn angemeldet)
  useEffect(() => {
    if (isLoggedIn) {
      loadVehicles();
    }
  }, [isLoggedIn]);

  // Debug-Ausgabe der erfolgreichen Endpunkte
  useEffect(() => {
    console.log("Aktuelle erfolgreiche Endpunkte:", successfulEndpoints);
  }, [successfulEndpoints]);
  
  // Funktion zum Laden der Fahrzeuge direkt aus der API
  const loadVehicles = async () => {
    console.log("App: Lade Fahrzeuge aus der API...");
    setVehiclesLoaded(false);
    setLoadingError(null);
    
    // Wenn wir bereits einen erfolgreichen Endpunkt haben, versuche diesen zuerst
    if (successfulEndpoints.GET_ALL) {
      try {
        console.log(`Versuche zuvor erfolgreichen Endpunkt: ${BASE_URL}${successfulEndpoints.GET_ALL}`);
        const response = await axios.get(`${BASE_URL}${successfulEndpoints.GET_ALL}`);
        if (await processVehicleResponse(response)) {
          return;
        }
      } catch (error) {
        console.error("Zuvor erfolgreicher Endpunkt funktioniert nicht mehr:", error);
        // Endpunkt zurücksetzen und alle Endpunkte versuchen
        setSuccessfulEndpoints(prev => ({...prev, GET_ALL: null}));
      }
    }
    
    // Alle Endpunkte für GET_ALL durchprobieren
    for (const endpoint of API_ENDPOINTS.GET_ALL) {
      try {
        console.log(`Versuche Endpunkt: ${BASE_URL}${endpoint}`);
        const response = await axios.get(`${BASE_URL}${endpoint}`);
        // Wenn die Verarbeitung erfolgreich war, speichere den Endpunkt und beende
        if (await processVehicleResponse(response)) {
          setSuccessfulEndpoints(prev => ({...prev, GET_ALL: endpoint}));
          return;
        }
      } catch (error) {
        console.log(`Fehler bei ${endpoint}:`, error.message);
      }
    }
    
    // Wenn wir hier ankommen, haben alle Endpunkte fehlgeschlagen
    console.error("Alle Endpunkte für GET_ALL sind fehlgeschlagen");
    setLoadingError("Fehler beim Laden der Fahrzeuge: Keiner der Endpunkte funktioniert");
    setVehicles([]);
    setVehiclesLoaded(true);
  };
  
  // Hilfsfunktion zum Verarbeiten der Fahrzeug-Antwort
  const processVehicleResponse = async (response) => {
    console.log('Antwort vom Server:', response);
    
    // Funktion zum Normalisieren der Fahrzeugdaten
    const normalizeVehicleData = (vehicles) => {
      return vehicles.map(vehicle => ({
        ...vehicle,
        // Behalte den vorhandenen Status bei oder setze auf "Verfügbar", wenn keiner existiert
        status: vehicle.status || 'Verfügbar'
      }));
    };
    
    // Direkte Array-Antwort
    if (response.data && Array.isArray(response.data)) {
      console.log(`${response.data.length} Fahrzeuge geladen:`, response.data);
      const normalizedVehicles = normalizeVehicleData(response.data);
      setVehicles(normalizedVehicles);
      setVehiclesLoaded(true);
      return true;
    }
    
    // Antwort als Objekt mit Array darin
    if (response.data && typeof response.data === 'object') {
      console.log("API-Antwort ist ein Objekt:", response.data);
      
      // Versuche Arrays in verschiedenen Eigenschaften zu finden
      const possibleArrayProps = ['vehicles', 'fahrzeuge', 'data', 'results', 'items', 'records'];
      
      for (const prop of possibleArrayProps) {
        if (response.data[prop] && Array.isArray(response.data[prop])) {
          console.log(`Fahrzeuge in '${prop}' gefunden:`, response.data[prop]);
          const normalizedVehicles = normalizeVehicleData(response.data[prop]);
          setVehicles(normalizedVehicles);
          setVehiclesLoaded(true);
          return true;
        }
      }
      
      // Versuche andere Eigenschaften, die Arrays sein könnten
      const arrayProps = Object.keys(response.data).find(key => 
        Array.isArray(response.data[key])
      );
      
      if (arrayProps) {
        console.log(`Fahrzeuge in '${arrayProps}' gefunden:`, response.data[arrayProps]);
        const normalizedVehicles = normalizeVehicleData(response.data[arrayProps]);
        setVehicles(normalizedVehicles);
        setVehiclesLoaded(true);
        return true;
      }
    }
    
    // Wenn keine Fahrzeuge gefunden wurden
    console.warn("Keine Fahrzeuge in der Antwort gefunden:", response.data);
    return false;
  };
  
  // Fahrzeug hinzufügen
  const addVehicle = async (newVehicle) => {
    console.log("App: Füge neues Fahrzeug hinzu:", newVehicle);
    
    // FormData für Dateiupload erstellen
    const formData = new FormData();
    
    // Alle Eigenschaften des Fahrzeugs hinzufügen
    Object.entries(newVehicle).forEach(([key, value]) => {
      if (key === 'bild' && value instanceof File) {
        formData.append('bild', value);
      } else if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    
    // Debug-Ausgabe der FormData
    console.log("Sende Daten an API:");
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
    
    // Wenn wir bereits einen erfolgreichen Endpunkt haben, versuche diesen zuerst
    if (successfulEndpoints.CREATE) {
      try {
        console.log(`Versuche zuvor erfolgreichen Endpunkt: ${BASE_URL}${successfulEndpoints.CREATE}`);
        const response = await axios.post(`${BASE_URL}${successfulEndpoints.CREATE}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log("Fahrzeug erfolgreich hinzugefügt:", response.data);
        loadVehicles();
        alert("Fahrzeug erfolgreich hinzugefügt!");
        return;
      } catch (error) {
        console.error("Zuvor erfolgreicher Endpunkt funktioniert nicht mehr:", error);
        // Endpunkt zurücksetzen und alle Endpunkte versuchen
        setSuccessfulEndpoints(prev => ({...prev, CREATE: null}));
      }
    }
    
    // Alle Endpunkte für CREATE durchprobieren
    for (const endpoint of API_ENDPOINTS.CREATE) {
      try {
        console.log(`Versuche Endpunkt: ${BASE_URL}${endpoint}`);
        const response = await axios.post(`${BASE_URL}${endpoint}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log("Fahrzeug erfolgreich hinzugefügt:", response.data);
        // Erfolgreichen Endpunkt speichern
        setSuccessfulEndpoints(prev => ({...prev, CREATE: endpoint}));
        loadVehicles();
        alert("Fahrzeug erfolgreich hinzugefügt!");
        return;
      } catch (error) {
        console.log(`Fehler bei ${endpoint}:`, error.message);
      }
    }
    
    // Wenn wir hier ankommen, haben alle Endpunkte fehlgeschlagen
    console.error("Alle Endpunkte für CREATE sind fehlgeschlagen");
    alert("Fehler beim Hinzufügen des Fahrzeugs: Keiner der Endpunkte funktioniert");
  };
  
  // Fahrzeug aktualisieren
  const updateVehicle = async (updatedVehicle) => {
    console.log("App: Aktualisiere Fahrzeug:", updatedVehicle);
    
    // FormData für Dateiupload erstellen
    const formData = new FormData();
    
    // Alle Eigenschaften des Fahrzeugs hinzufügen
    Object.entries(updatedVehicle).forEach(([key, value]) => {
      if (key === 'bild' && value instanceof File) {
        formData.append('bild', value);
      } else if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    
    // Debug-Ausgabe der FormData
    console.log("Sende Update-Daten an API:");
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
    
    // Wenn wir bereits einen erfolgreichen Endpunkt haben, versuche diesen zuerst
    if (successfulEndpoints.ITEM_PREFIX) {
      try {
        const url = `${BASE_URL}${successfulEndpoints.ITEM_PREFIX}${updatedVehicle.id}`;
        console.log(`Versuche zuvor erfolgreichen Endpunkt: ${url}`);
        const response = await axios.put(url, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log("Fahrzeug erfolgreich aktualisiert:", response.data);
        loadVehicles();
        alert("Fahrzeug erfolgreich aktualisiert!");
        return;
      } catch (error) {
        console.error("Zuvor erfolgreicher Endpunkt funktioniert nicht mehr:", error);
        // Endpunkt zurücksetzen und alle Endpunkte versuchen
        setSuccessfulEndpoints(prev => ({...prev, ITEM_PREFIX: null}));
      }
    }
    
    // Alle Endpunkte für ITEM_PREFIX durchprobieren
    for (const endpoint of API_ENDPOINTS.ITEM_PREFIX) {
      try {
        const url = `${BASE_URL}${endpoint}${updatedVehicle.id}`;
        console.log(`Versuche Endpunkt: ${url}`);
        const response = await axios.put(url, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log("Fahrzeug erfolgreich aktualisiert:", response.data);
        // Erfolgreichen Endpunkt speichern
        setSuccessfulEndpoints(prev => ({...prev, ITEM_PREFIX: endpoint}));
        loadVehicles();
        alert("Fahrzeug erfolgreich aktualisiert!");
        return;
      } catch (error) {
        console.log(`Fehler bei ${endpoint}:`, error.message);
      }
    }
    
    // Wenn wir hier ankommen, haben alle Endpunkte fehlgeschlagen
    console.error("Alle Endpunkte für UPDATE sind fehlgeschlagen");
    alert("Fehler beim Aktualisieren des Fahrzeugs: Keiner der Endpunkte funktioniert");
  };
  
  // Fahrzeug löschen
  const deleteVehicle = async (vehicleId) => {
    console.log("App: Lösche Fahrzeug mit ID:", vehicleId);
    
    // Wenn wir bereits einen erfolgreichen Endpunkt haben, versuche diesen zuerst
    if (successfulEndpoints.ITEM_PREFIX) {
      try {
        const url = `${BASE_URL}${successfulEndpoints.ITEM_PREFIX}${vehicleId}`;
        console.log(`Versuche zuvor erfolgreichen Endpunkt: ${url}`);
        await axios.delete(url);
        console.log("Fahrzeug erfolgreich gelöscht");
        loadVehicles();
        alert("Fahrzeug erfolgreich gelöscht!");
        return;
      } catch (error) {
        console.error("Zuvor erfolgreicher Endpunkt funktioniert nicht mehr:", error);
        // Endpunkt zurücksetzen und alle Endpunkte versuchen
        setSuccessfulEndpoints(prev => ({...prev, ITEM_PREFIX: null}));
      }
    }
    
    // Alle Endpunkte für ITEM_PREFIX durchprobieren
    for (const endpoint of API_ENDPOINTS.ITEM_PREFIX) {
      try {
        const url = `${BASE_URL}${endpoint}${vehicleId}`;
        console.log(`Versuche Endpunkt: ${url}`);
        await axios.delete(url);
        console.log("Fahrzeug erfolgreich gelöscht");
        // Erfolgreichen Endpunkt speichern
        setSuccessfulEndpoints(prev => ({...prev, ITEM_PREFIX: endpoint}));
        loadVehicles();
        alert("Fahrzeug erfolgreich gelöscht!");
        return;
      } catch (error) {
        console.log(`Fehler bei ${endpoint}:`, error.message);
      }
    }
    
    // Wenn wir hier ankommen, haben alle Endpunkte fehlgeschlagen
    console.error("Alle Endpunkte für DELETE sind fehlgeschlagen");
    alert("Fehler beim Löschen des Fahrzeugs: Keiner der Endpunkte funktioniert");
  };

  // Benutzeranmeldung
  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    setIsAdmin(userData.isAdmin || false);
    setUserPermissions(userData.permissions || {
      canBookVehicles: true,
      canViewStatistics: userData.isAdmin || false,
      canManageVehicles: userData.isAdmin || false,
      canApproveRequests: userData.isAdmin || false
    });
    
    // Setze die aktive Ansicht basierend auf der Benutzerrolle
    if (userData.isAdmin) {
      setActiveView('dashboard');
    } else {
      setActiveView('vehicles');
    }
  };
  
  // Benutzerregistrierung
  const handleRegister = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    setIsAdmin(userData.isAdmin || false);
    setUserPermissions(userData.permissions || {
      canBookVehicles: true,
      canViewStatistics: userData.isAdmin || false,
      canManageVehicles: userData.isAdmin || false,
      canApproveRequests: userData.isAdmin || false
    });
    
    // Neue Benutzer sind standardmäßig keine Admins
    setActiveView('vehicles');
  };
  
  // Benutzerabmeldung
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUserPermissions({
      canBookVehicles: true,
      canViewStatistics: false,
      canManageVehicles: false,
      canApproveRequests: false
    });
  };

  // Renderlogik basierend auf der aktiven Ansicht
  const renderContent = () => {
    if (!vehiclesLoaded && isLoggedIn) {
      return (
        <div className="w-full flex flex-col items-center justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Fahrzeuge werden geladen...</p>
        </div>
      );
    }

    if (loadingError && isLoggedIn) {
      return (
        <div className="w-full flex flex-col items-center justify-center my-12 text-red-500">
          <p className="mb-2 font-semibold">{loadingError}</p>
          <p className="mb-6 text-gray-700 text-sm">
            Stelle sicher, dass dein Backend auf <span className="font-mono bg-gray-100 px-1 rounded">{BASE_URL}</span> läuft.
          </p>
          <button 
            onClick={loadVehicles} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Erneut versuchen
          </button>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return <Dashboard user={user} isAdmin={isAdmin} />;
      case 'vehicles':
        return <VehicleList 
          isUserView={!isAdmin} 
          vehicles={vehicles} 
          onAddVehicle={addVehicle} 
          onUpdateVehicle={updateVehicle} 
          onDeleteVehicle={deleteVehicle} 
          canManageVehicles={userPermissions.canManageVehicles}
          user={user}
        />;
      case 'statistics':
        return userPermissions.canViewStatistics ? <StatisticsDashboard /> : null;
      case 'vehicle-requests':
        return userPermissions.canApproveRequests ? <VehicleRequests user={user} /> : null;
      case 'my-requests':
        return userPermissions.canBookVehicles ? <UserRequests setActiveView={setActiveView} user={user} /> : null;
      case 'user-management':
        return isAdmin ? <UserManagement /> : null;
      case 'admin-calendar':
        return isAdmin ? <AdminCalendar vehicles={vehicles} /> : null;
      default:
        return <VehicleList 
          isUserView={!isAdmin} 
          vehicles={vehicles} 
          onAddVehicle={addVehicle} 
          onUpdateVehicle={updateVehicle} 
          onDeleteVehicle={deleteVehicle} 
          canManageVehicles={userPermissions.canManageVehicles}
          user={user}
        />;
    }
  };

  // Wenn der Benutzer nicht angemeldet ist, zeige die Login-/Registrierungsseite an
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} onRegister={handleRegister} />;
  }

  // Wenn angemeldet, zeige die Hauptanwendung an
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <Header 
        isAdmin={isAdmin} 
        onLogout={handleLogout} 
        user={user}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          isAdmin={isAdmin}
          onLogout={handleLogout}
          activeView={activeView}
          setActiveView={setActiveView}
          user={user}
          permissions={userPermissions}
        />
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 