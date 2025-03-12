import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VehicleDetail from './VehicleDetail';
import BookingCalendar from './BookingCalendar';
import BookingForm from './BookingForm';

function VehicleList({ isUserView = false, vehicles = [], onAddVehicle, onUpdateVehicle, onDeleteVehicle, canManageVehicles = false, user }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    modell: '',
    kennzeichen: '',
    kilometerstand: 0,
    tankstand: 100,
    status: 'Verfügbar',
    bild: ''
  });
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showVehicleDetail, setShowVehicleDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showAdminBookingModal, setShowAdminBookingModal] = useState(false);
  const [vehicleToRequest, setVehicleToRequest] = useState(null);
  const [requestDetails, setRequestDetails] = useState({
    startDate: '',
    endDate: '',
    purpose: '',
    userName: '',  // Nur für Admin-Buchungen
    userContact: '' // Nur für Admin-Buchungen
  });
  const [bookingConflicts, setBookingConflicts] = useState([]);
  const [showBookingsCalendar, setShowBookingsCalendar] = useState(false);
  const [calendarVehicle, setCalendarVehicle] = useState(null);

  // Funktion um zu prüfen, ob ein Fahrzeug im angegebenen Zeitraum verfügbar ist
  const checkVehicleAvailability = (vehicleId, startDate, endDate) => {
    // Lade alle existierenden Anfragen/Buchungen
    const allRequests = JSON.parse(localStorage.getItem('vehicleRequests') || '[]');
    
    // Filtere nach genehmigten Anfragen für dieses Fahrzeug
    const approvedBookings = allRequests.filter(req => 
      req.vehicleId === vehicleId && 
      req.status === 'approved'
    );
    
    // Konvertiere Datumsangaben
    const requestStart = new Date(startDate);
    const requestEnd = new Date(endDate);
    
    // Prüfe auf Überschneidungen
    const conflictingBookings = approvedBookings.filter(booking => {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      
      // Überschneidungsprüfung
      return (
        (requestStart <= bookingEnd && requestStart >= bookingStart) || // Startdatum in existierender Buchung
        (requestEnd <= bookingEnd && requestEnd >= bookingStart) ||     // Enddatum in existierender Buchung
        (requestStart <= bookingStart && requestEnd >= bookingEnd)      // Neue Buchung umfasst existierende Buchung
      );
    });
    
    return {
      isAvailable: conflictingBookings.length === 0,
      conflicts: conflictingBookings
    };
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Das Bild-Objekt kommt vom Formular
      const vehicleData = { ...newVehicle };
      
      // Wenn ein Bild ausgewählt wurde, übergeben wir es direkt
      // Der Callback in App.js kümmert sich um die FormData-Erstellung und API-Anfrage
      
      // Callback für die übergeordnete Komponente aufrufen
      if (onAddVehicle) {
        onAddVehicle(vehicleData);
      }
      
      setShowAddForm(false);
      setNewVehicle({
        modell: '',
        kennzeichen: '',
        kilometerstand: 0,
        tankstand: 100,
        status: 'Verfügbar',
        bild: ''
      });
    } catch (error) {
      console.error('Error adding vehicle:', error);
      alert('Fehler beim Hinzufügen des Fahrzeugs.');
    } finally {
      setIsLoading(false);
    }
  };

  // Vorschau für das Bild anzeigen
  const handleImageSelect = (e) => {
    setNewVehicle({...newVehicle, bild: e.target.files[0]});
  };

  // Fahrzeug für Detailansicht auswählen
  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowVehicleDetail(true);
  };

  // Fahrzeug aktualisieren
  const handleVehicleUpdate = (updatedVehicle) => {
    // Callback für die übergeordnete Komponente
    if (onUpdateVehicle) {
      onUpdateVehicle(updatedVehicle);
    }
    
    setSelectedVehicle(updatedVehicle);
  };

  // Fahrzeug löschen
  const handleVehicleDelete = (vehicleId) => {
    // Callback für die übergeordnete Komponente
    if (onDeleteVehicle) {
      onDeleteVehicle(vehicleId);
    }
    
    setShowVehicleDetail(false);
  };

  // Fahrzeug anfragen
  const handleRequestVehicle = (vehicle) => {
    console.log("handleRequestVehicle aufgerufen für Fahrzeug:", vehicle);
    
    // Setze das ausgewählte Fahrzeug und zeige das Anfrage-Formular an
    setVehicleToRequest(vehicle);
    setBookingConflicts([]);
    // Zurücksetzen des Formulars
    setRequestDetails({
      startDate: '',
      endDate: '',
      purpose: '',
      userName: '',
      userContact: ''
    });
    setShowConfirmation(true);
  };
  
  // Prüfen der Verfügbarkeit bei Datumsänderung
  const handleDateChange = (field, value) => {
    const updatedDetails = {...requestDetails, [field]: value};
    setRequestDetails(updatedDetails);
    
    // Nur prüfen, wenn sowohl Start- als auch Enddatum gesetzt sind
    if (vehicleToRequest && updatedDetails.startDate && updatedDetails.endDate) {
      const { isAvailable, conflicts } = checkVehicleAvailability(
        vehicleToRequest.id, 
        updatedDetails.startDate, 
        updatedDetails.endDate
      );
      
      setBookingConflicts(conflicts);
      
      if (!isAvailable) {
        console.log("Buchungskonflikte gefunden:", conflicts);
      }
    }
  };

  // Funktion zum direkten Buchen als Admin
  const handleAdminBooking = (vehicle) => {
    setVehicleToRequest(vehicle);
    setBookingConflicts([]);
    // Zurücksetzen des Formulars
    setRequestDetails({
      startDate: '',
      endDate: '',
      purpose: '',
      userName: '',
      userContact: ''
    });
    setShowAdminBookingModal(true);
  };

  // Admin-Buchung bestätigen
  const handleConfirmAdminBooking = () => {
    if (!requestDetails.startDate || !requestDetails.endDate || !requestDetails.purpose || 
        !requestDetails.userName || !requestDetails.userContact) {
      alert('Bitte füllen Sie alle Felder aus.');
      return;
    }
    
    // Prüfen auf Konflikte
    const { isAvailable, conflicts } = checkVehicleAvailability(
      vehicleToRequest.id, 
      requestDetails.startDate, 
      requestDetails.endDate
    );
    
    if (!isAvailable) {
      const conflictDates = conflicts.map(c => 
        `${new Date(c.startDate).toLocaleDateString()} - ${new Date(c.endDate).toLocaleDateString()}`
      ).join(', ');
      
      const continueAnyway = window.confirm(
        `Das Fahrzeug ist in diesem Zeitraum bereits gebucht:\n${conflictDates}\n\nMöchten Sie die Buchung trotzdem eintragen?`
      );
      
      if (!continueAnyway) return;
    }

    // Anfrage im Local Storage speichern
    const existingRequests = JSON.parse(localStorage.getItem('vehicleRequests') || '[]');
    const newRequest = {
      id: Date.now().toString(),
      vehicleId: vehicleToRequest.id,
      vehicleModel: vehicleToRequest.modell,
      licensePlate: vehicleToRequest.kennzeichen,
      startDate: requestDetails.startDate,  // Da hier keine Umwandlung erfolgt, muss das Datum bereits im ISO-Format sein
      endDate: requestDetails.endDate,      // Da hier keine Umwandlung erfolgt, muss das Datum bereits im ISO-Format sein
      startDateTime: `${requestDetails.startDate}T08:00:00`,
      endDateTime: `${requestDetails.endDate}T17:00:00`,
      purpose: requestDetails.purpose,
      destination: 'Vom Admin eingetragen',
      passengers: 1,
      notes: `Telefonische Buchung für ${requestDetails.userName} (${requestDetails.userContact})`,
      status: 'approved',  // Direkt genehmigt, da vom Admin
      timestamp: new Date().toISOString(),
      requestDate: new Date().toISOString(),
      responseDate: new Date().toISOString(),
      userId: user ? user.id : 'admin-booking',
      userName: requestDetails.userName,
      userDepartment: 'Vom Admin eingetragen',
      adminBooking: true
    };

    console.log("Neue Admin-Buchung wird gespeichert:", newRequest);
    existingRequests.push(newRequest);
    localStorage.setItem('vehicleRequests', JSON.stringify(existingRequests));
    console.log("Anfragen im localStorage nach Speichern:", localStorage.getItem('vehicleRequests'));

    // Dialog schließen und Formular zurücksetzen
    setShowAdminBookingModal(false);
    setVehicleToRequest(null);
    setRequestDetails({
      startDate: '',
      endDate: '',
      purpose: '',
      userName: '',
      userContact: ''
    });

    alert('Fahrzeugbuchung wurde erfolgreich eingetragen!');
  };

  // CSV-Export
  const exportToCSV = () => {
    // Header für CSV
    let csvContent = "Modell,Kennzeichen,Kilometerstand,Tankstand,Status,TÜV-Datum,AU-Datum\n";
    
    // Daten hinzufügen
    vehicles.forEach(vehicle => {
      const tuevDatum = vehicle.tuev_datum ? new Date(vehicle.tuev_datum).toLocaleDateString() : '';
      const auDatum = vehicle.au_datum ? new Date(vehicle.au_datum).toLocaleDateString() : '';
      
      csvContent += `${vehicle.modell},${vehicle.kennzeichen},${vehicle.kilometerstand},${vehicle.tankstand}%,${vehicle.status},${tuevDatum},${auDatum}\n`;
    });
    
    // CSV-Datei erstellen und herunterladen
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'fahrzeuge.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleExpand = (vehicleId) => {
    setExpanded(prev => ({
      ...prev,
      [vehicleId]: !prev[vehicleId]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nicht eingetragen';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  // Filtern der Fahrzeuge basierend auf der Sucheingabe
  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.modell.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.kennzeichen.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Funktion zum Anzeigen des Buchungskalenders
  const showVehicleBookings = (e, vehicle) => {
    e.stopPropagation();
    setCalendarVehicle(vehicle);
    setShowBookingsCalendar(true);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-bold mb-4 md:mb-0">{isUserView ? "Verfügbare Fahrzeuge" : "Fahrzeuge"}</h2>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              className="w-full p-2 border rounded pl-10"
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          {canManageVehicles && (
            <>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Fahrzeug hinzufügen
              </button>
              <button
                onClick={exportToCSV}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Als CSV exportieren
              </button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="w-full flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">Keine Fahrzeuge verfügbar</p>
          {!isUserView && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Fahrzeug hinzufügen
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map(vehicle => (
            <div
              key={vehicle.id} 
              className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="relative h-48 bg-gray-200">
                {vehicle.bild ? (
                  <img 
                    src={vehicle.bild}
                    alt={vehicle.modell} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log("Bild-Fehler für Fahrzeug:", vehicle.modell, "- Bildpfad:", vehicle.bild);
                      e.target.onerror = null;
                      
                      // Standard-Bild basierend auf Fahrzeugmarke auswählen
                      const carImages = {
                        'vw': 'https://cdn.pixabay.com/photo/2013/07/13/10/15/volkswagen-156965_960_720.png',
                        'mercedes': 'https://cdn.pixabay.com/photo/2016/04/17/22/10/mercedes-1335674_960_720.png',
                        'bmw': 'https://cdn.pixabay.com/photo/2013/07/12/14/35/car-148539_960_720.png',
                        'audi': 'https://cdn.pixabay.com/photo/2014/04/02/10/58/car-304920_960_720.png',
                        'opel': 'https://cdn.pixabay.com/photo/2014/04/03/00/30/car-308405_960_720.png',
                        'default': 'https://cdn.pixabay.com/photo/2016/04/01/09/11/car-1299198_960_720.png'
                      };
                      
                      // Wähle ein passendes Bild
                      let fallbackImage = carImages.default;
                      const modelLower = vehicle.modell.toLowerCase();
                      
                      Object.keys(carImages).forEach(brand => {
                        if (modelLower.includes(brand)) {
                          fallbackImage = carImages[brand];
                        }
                      });
                      
                      e.target.src = fallbackImage;
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200">
                    <img 
                      src="https://cdn.pixabay.com/photo/2016/04/01/09/11/car-1299198_960_720.png" 
                      alt="Standard-Fahrzeugbild" 
                      className="w-full h-full object-cover opacity-60"
                    />
                  </div>
                )}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs text-white ${
                  (vehicle.status === 'Verfügbar' || !vehicle.status) ? 'bg-green-500' :
                  vehicle.status === 'In Benutzung' ? 'bg-blue-500' :
                  vehicle.status === 'In Wartung' ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`}>
                  {vehicle.status || 'Verfügbar'}
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold">{vehicle.modell}</h3>
                  <span className="font-medium text-gray-500">{vehicle.kennzeichen}</span>
                </div>
                
                <div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {!isUserView && (
                      <>
                        <div>
                          <p className="text-gray-500">Kilometerstand</p>
                          <p className="font-medium">{vehicle.kilometerstand?.toLocaleString() || '0'} km</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Tankstand</p>
                          <p className="font-medium">{vehicle.tankstand || '100'}%</p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {expanded[vehicle.id] && !isUserView && (
                    <div className="mt-4 space-y-2 border-t pt-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">TÜV bis</p>
                          <p className="font-medium">{formatDate(vehicle.tuev_datum)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">AU bis</p>
                          <p className="font-medium">{formatDate(vehicle.au_datum)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between mt-4">
                  {!isUserView && (
                    <button
                      onClick={() => handleToggleExpand(vehicle.id)}
                      className="text-blue-500 hover:text-blue-700 flex items-center"
                    >
                      {expanded[vehicle.id] ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                      {expanded[vehicle.id] ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  )}
                  <div className="space-x-2">
                    {isUserView ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Verhindert, dass das Event auf das Elternelement weitergeleitet wird
                          console.log("Anfrage-Button geklickt für Fahrzeug:", vehicle);
                          handleRequestVehicle(vehicle);
                        }}
                        className="px-3 py-1 text-white rounded bg-blue-500 hover:bg-blue-600"
                      >
                        Anfragen
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleSelectVehicle(vehicle)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Details
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdminBooking(vehicle);
                          }}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Buchen
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) => showVehicleBookings(e, vehicle)}
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      title="Buchungen anzeigen"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fahrzeugdetail-Modal */}
      {showVehicleDetail && selectedVehicle && (
        <VehicleDetail
          vehicle={selectedVehicle}
          onClose={() => setShowVehicleDetail(false)}
          onUpdate={handleVehicleUpdate}
          onDelete={handleVehicleDelete}
          isUserView={isUserView}
          canManageVehicles={canManageVehicles}
        />
      )}

      {/* Anfrage-Bestätigungsdialog */}
      {showConfirmation && vehicleToRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto border shadow-lg rounded-md bg-white">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Fahrzeug anfragen</h3>
              <button 
                onClick={() => {
                  setShowConfirmation(false);
                  setVehicleToRequest(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <BookingForm 
                vehicle={vehicleToRequest}
                checkAvailability={checkVehicleAvailability}
                onSubmit={(bookingData) => {
                  console.log("Neue Fahrzeuganfrage:", bookingData);
                  
                  // Anfrage im Local Storage speichern
                  const existingRequests = JSON.parse(localStorage.getItem('vehicleRequests') || '[]');
                  const newRequest = {
                    id: Date.now().toString(),
                    vehicleId: vehicleToRequest.id,
                    vehicleModel: vehicleToRequest.modell,
                    licensePlate: vehicleToRequest.kennzeichen,
                    startDate: bookingData.startDateTime.split('T')[0], // ISO-Format für Datum
                    endDate: bookingData.endDateTime.split('T')[0],     // ISO-Format für Datum
                    startDateTime: bookingData.startDateTime,
                    endDateTime: bookingData.endDateTime,
                    purpose: bookingData.purpose,
                    destination: bookingData.destination,
                    passengers: bookingData.passengers,
                    notes: bookingData.notes || '',
                    status: 'pending',
                    timestamp: new Date().toISOString(),
                    requestDate: new Date().toISOString(),
                    userId: user ? user.id : 'unknown',
                    userName: user ? user.name : 'Unbekannter Benutzer',
                    userDepartment: user ? user.department : 'Unbekannte Abteilung',
                    responseDate: null,
                    responseNote: null
                  };
                  
                  existingRequests.push(newRequest);
                  localStorage.setItem('vehicleRequests', JSON.stringify(existingRequests));
                  console.log("Anfragen im localStorage nach Speichern:", localStorage.getItem('vehicleRequests'));
                  
                  // Dialog schließen
                  setShowConfirmation(false);
                  setVehicleToRequest(null);
                  
                  alert('Fahrzeuganfrage wurde erfolgreich gesendet!');
                }}
                onCancel={() => {
                  setShowConfirmation(false);
                  setVehicleToRequest(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Admin-Buchungs-Modal */}
      {showAdminBookingModal && vehicleToRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Fahrzeug direkt buchen</h3>
            <p className="mb-4">Sie buchen das Fahrzeug <strong>{vehicleToRequest.modell}</strong> ({vehicleToRequest.kennzeichen}) für einen Benutzer.</p>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name des Benutzers</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={requestDetails.userName}
                  onChange={(e) => handleDateChange('userName', e.target.value)}
                  placeholder="z.B. Max Mustermann"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kontakt (Telefon/E-Mail)</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={requestDetails.userContact}
                  onChange={(e) => handleDateChange('userContact', e.target.value)}
                  placeholder="z.B. 0123-456789 oder max@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Startdatum</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                  value={requestDetails.startDate}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enddatum</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                  value={requestDetails.endDate}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  required
                />
              </div>
              
              {bookingConflicts.length > 0 && (
                <div className="p-3 bg-yellow-100 text-yellow-800 rounded border border-yellow-300">
                  <p className="font-semibold mb-1">Achtung: Überschneidungen mit bestehenden Buchungen:</p>
                  <ul className="list-disc list-inside text-sm">
                    {bookingConflicts.map((conflict, idx) => (
                      <li key={idx}>
                        {new Date(conflict.startDate).toLocaleDateString()} - {new Date(conflict.endDate).toLocaleDateString()}
                        {conflict.userName && ` (${conflict.userName})`}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm mt-1">Sie können trotzdem eine Buchung eintragen.</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verwendungszweck</label>
                <textarea
                  className="w-full p-2 border rounded"
                  rows="3"
                  value={requestDetails.purpose}
                  onChange={(e) => handleDateChange('purpose', e.target.value)}
                  required
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminBookingModal(false);
                    setVehicleToRequest(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAdminBooking}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Buchung eintragen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Buchungskalender-Modal */}
      {showBookingsCalendar && calendarVehicle && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 max-w-3xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                Buchungen für {calendarVehicle.modell} ({calendarVehicle.kennzeichen})
              </h3>
              <button
                onClick={() => setShowBookingsCalendar(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-auto">
              <BookingCalendar vehicleId={calendarVehicle.id} />
            </div>
          </div>
        </div>
      )}

      {/* Formular zum Hinzufügen eines Fahrzeugs */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Neues Fahrzeug hinzufügen</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modell</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={newVehicle.modell}
                    onChange={(e) => setNewVehicle({...newVehicle, modell: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kennzeichen</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={newVehicle.kennzeichen}
                    onChange={(e) => setNewVehicle({...newVehicle, kennzeichen: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kilometerstand</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={newVehicle.kilometerstand}
                    onChange={(e) => setNewVehicle({...newVehicle, kilometerstand: parseInt(e.target.value) || 0})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tankstand (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full p-2 border rounded"
                    value={newVehicle.tankstand}
                    onChange={(e) => setNewVehicle({...newVehicle, tankstand: parseInt(e.target.value) || 0})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={newVehicle.status}
                    onChange={(e) => setNewVehicle({...newVehicle, status: e.target.value})}
                    required
                  >
                    <option value="Verfügbar">Verfügbar</option>
                    <option value="In Benutzung">In Benutzung</option>
                    <option value="In Wartung">In Wartung</option>
                    <option value="Außer Betrieb">Außer Betrieb</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fahrzeugbild</label>
                  <input
                    type="file"
                    className="w-full p-2 border rounded"
                    onChange={handleImageSelect}
                    accept="image/*"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Fahrzeug hinzufügen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleList; 