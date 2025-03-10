import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon,
  UserIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

function VehicleRequest() {
  // State für das Formular
  const [formData, setFormData] = useState({
    vehicleId: '',
    startDate: '',
    startTime: '08:00',
    endDate: '',
    endTime: '17:00',
    purpose: '',
    destination: '',
    passengers: 1,
    notes: ''
  });

  // State für verfügbare Fahrzeuge
  const [availableVehicles, setAvailableVehicles] = useState([
    { id: 1, model: 'BMW M1', licensePlate: 'M-BW 1234', status: 'verfügbar', mileage: 28345 },
    { id: 2, model: 'VW Polo', licensePlate: 'M-VW 5678', status: 'verfügbar', mileage: 15678 },
    { id: 3, model: 'Audi RS5', licensePlate: 'M-AU 9012', status: 'verfügbar', mileage: 32890 },
    { id: 4, model: 'Mercedes GLE', licensePlate: 'M-MB 3456', status: 'verfügbar', mileage: 45678 }
  ]);

  // State für erfolgreiche Übermittlung
  const [submitted, setSubmitted] = useState(false);
  // State für Fehler
  const [error, setError] = useState(null);
  // State für Ladevorgang
  const [loading, setLoading] = useState(false);

  // Aktuelles Datum berechnen (für min-Werte in den Datumsfeldern)
  const today = new Date().toISOString().split('T')[0];
  
  // Aktuelle Uhrzeit berechnen (für Zeitvalidierung)
  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, '0');
  const currentMinute = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${currentHour}:${currentMinute}`;

  // Handler für Änderungen an Formularfeldern
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Spezielle Validierung für Datumsfelder
    if (name === 'startDate') {
      // Wenn Startdatum geändert wird, stelle sicher, dass es nicht in der Vergangenheit liegt
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Setze auf Beginn des Tages für korrekten Vergleich
      
      if (selectedDate < today) {
        alert('Termine in der Vergangenheit können nicht gebucht werden.');
        return; // Verhindere die Änderung
      }
      
      // Setze auch Enddatum, wenn es leer ist oder vor dem neuen Startdatum liegt
      if (!formData.endDate || new Date(formData.endDate) < selectedDate) {
        setFormData({
          ...formData,
          [name]: value,
          endDate: value // Setze Enddatum auf gleiches Datum
        });
        return;
      }
    }
    
    // Aktualisiere State
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handler für das Absenden des Formulars
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validierung: Überprüfen, ob ein Fahrzeug ausgewählt wurde
    if (!formData.vehicleId) {
      setError('Bitte wählen Sie ein Fahrzeug aus.');
      return;
    }

    // Validierung: Überprüfen, ob Start- und Enddatum vorhanden sind
    if (!formData.startDate || !formData.endDate) {
      setError('Bitte geben Sie Start- und Enddatum an.');
      return;
    }

    // Validierung: Überprüfen, ob der Zweck angegeben wurde
    if (!formData.purpose.trim()) {
      setError('Bitte geben Sie den Zweck der Fahrt an.');
      return;
    }

    // Start- und Endzeit-Objekte erstellen
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
    const now = new Date();

    // Validierung: Überprüfen, ob Endzeit nach Startzeit liegt
    if (endDateTime <= startDateTime) {
      setError('Die Endzeit muss nach der Startzeit liegen.');
      return;
    }
    
    // Verstärkte Validierung: Überprüfen, ob Startzeit in der Vergangenheit liegt
    if (startDateTime < now) {
      setError('Der Termin kann nicht in der Vergangenheit liegen. Bitte wählen Sie ein Datum in der Zukunft.');
      return;
    }
    
    // Weitere Validierung für das heutige Datum mit genauer Stundenvalidierung
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const startDateOnly = new Date(formData.startDate);
    startDateOnly.setHours(0, 0, 0, 0);
    
    if (startDateOnly.getTime() === todayDate.getTime()) {
      // Bei Buchungen am aktuellen Tag: Prüfen, ob die Startzeit in der Zukunft liegt
      const [startHour, startMinute] = formData.startTime.split(':').map(Number);
      if (startHour < now.getHours() || (startHour === now.getHours() && startMinute < now.getMinutes())) {
        setError('Die Startzeit muss in der Zukunft liegen.');
        return;
      }
    }

    // Fehler zurücksetzen und Ladestatus setzen
    setError(null);
    setLoading(true);

    // In einer realen Anwendung würde hier ein API-Aufruf stattfinden
    // Der würde die Anfrage an das Backend senden, das dann eine Benachrichtigung an den Administrator schickt
    
    // Simulierte Antwort
    const requestData = {
      ...formData,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      status: 'pending',
      requestDate: new Date().toISOString()
    };
    
    console.log('Fahrzeuganfrage gesendet:', requestData);
    
    // Simuliere einen API-Aufruf mit Timeout
    setTimeout(() => {
      // Speichere Anfrage im lokalen Speicher für Demo-Zwecke
      try {
        // Bisherige Anfragen aus dem localStorage holen
        const savedRequests = localStorage.getItem('vehicleRequests') 
          ? JSON.parse(localStorage.getItem('vehicleRequests')) 
          : [];
        
        // Neue Anfrage hinzufügen
        const newRequest = {
          id: Date.now(), // Einfache ID-Generierung für die Demo
          userId: 999, // Demo-Benutzer-ID
          userName: "Demo Benutzer",
          userDepartment: "Demo Abteilung",
          vehicleId: parseInt(formData.vehicleId),
          vehicleModel: selectedVehicle.model,
          vehicleLicensePlate: selectedVehicle.licensePlate,
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
          purpose: formData.purpose,
          destination: formData.destination || "",
          passengers: formData.passengers,
          notes: formData.notes || "",
          status: "pending",
          requestDate: new Date().toISOString(),
          responseDate: null,
          responseNote: null
        };
        
        savedRequests.push(newRequest);
        localStorage.setItem('vehicleRequests', JSON.stringify(savedRequests));
        
      } catch (err) {
        console.error("Fehler beim Speichern der Anfrage:", err);
      }
      
      setLoading(false);
      setSubmitted(true);

      // Formular zurücksetzen
      setFormData({
        vehicleId: '',
        startDate: '',
        startTime: '08:00',
        endDate: '',
        endTime: '17:00',
        purpose: '',
        destination: '',
        passengers: 1,
        notes: ''
      });

      // Nach 5 Sekunden die Erfolgsmeldung zurücksetzen
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    }, 1500);
  };

  // Fahrzeugdetails für ausgewähltes Fahrzeug
  const selectedVehicle = availableVehicles.find(vehicle => vehicle.id === parseInt(formData.vehicleId));

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Fahrzeug anfragen</h2>

      {/* Erfolgsmeldung */}
      {submitted && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
          <p className="font-bold">Anfrage gesendet</p>
          <p>Ihre Fahrzeuganfrage wurde erfolgreich übermittelt. Sie erhalten eine Benachrichtigung, sobald Ihre Anfrage bearbeitet wurde.</p>
        </div>
      )}

      {/* Fehlermeldung */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p className="font-bold">Fehler</p>
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Buchungsdetails</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Fahrzeugauswahl */}
          <div className="mb-6">
            <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 mb-2">
              Fahrzeug auswählen
            </label>
            <select
              id="vehicleId"
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Fahrzeug auswählen --</option>
              {availableVehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.model} ({vehicle.licensePlate})
                </option>
              ))}
            </select>
          </div>

          {/* Fahrzeugdetails, wenn ein Fahrzeug ausgewählt ist */}
          {selectedVehicle && (
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <h4 className="font-semibold text-gray-700 mb-2">Fahrzeugdetails</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Modell</p>
                  <p className="font-medium">{selectedVehicle.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Kennzeichen</p>
                  <p className="font-medium">{selectedVehicle.licensePlate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">{selectedVehicle.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Kilometerstand</p>
                  <p className="font-medium">{selectedVehicle.mileage.toLocaleString()} km</p>
                </div>
              </div>
            </div>
          )}

          {/* Zeit und Datum */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-1 text-gray-500" />
                Startdatum
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                min={today}
                value={formData.startDate}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <small className="text-gray-500">Termine in der Vergangenheit können nicht gebucht werden.</small>
            </div>
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <ClockIcon className="h-5 w-5 mr-1 text-gray-500" />
                Startzeit
              </label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-1 text-gray-500" />
                Enddatum
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                min={formData.startDate || today}
                value={formData.endDate}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <ClockIcon className="h-5 w-5 mr-1 text-gray-500" />
                Endzeit
              </label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Zweck und Ziel */}
          <div className="mb-6">
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-1 text-gray-500" />
              Zweck der Fahrt *
            </label>
            <input
              type="text"
              id="purpose"
              name="purpose"
              placeholder="z.B. Kundenbesuch, Materialtransport, ..."
              value={formData.purpose}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <MapPinIcon className="h-5 w-5 mr-1 text-gray-500" />
              Zielort
            </label>
            <input
              type="text"
              id="destination"
              name="destination"
              placeholder="z.B. München, Stuttgart, ..."
              value={formData.destination}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Passagiere */}
          <div className="mb-6">
            <label htmlFor="passengers" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <UserIcon className="h-5 w-5 mr-1 text-gray-500" />
              Anzahl Personen
            </label>
            <input
              type="number"
              id="passengers"
              name="passengers"
              min="1"
              max="9"
              value={formData.passengers}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Anmerkungen */}
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-1 text-gray-500" />
              Anmerkungen
            </label>
            <textarea
              id="notes"
              name="notes"
              rows="3"
              placeholder="Zusätzliche Informationen für den Fuhrparkverantwortlichen..."
              value={formData.notes}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>

          {/* Submit-Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-md text-white font-medium ${
                loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wird gesendet...
                </span>
              ) : (
                'Fahrzeug anfragen'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VehicleRequest; 