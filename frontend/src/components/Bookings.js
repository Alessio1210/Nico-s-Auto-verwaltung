import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/de';
import { 
  Container, Box, Paper, Grid, Typography, 
  Divider, CircularProgress, Snackbar, Alert, 
  Table, TableHead, TableBody, TableRow, TableCell, 
  Button, Stack, Card, CardContent, Chip, IconButton
} from '@mui/material';

dayjs.locale('de');

// Backend-URL - direkt angepasst
const API_URL = 'http://localhost:5000';

// Fallback-Fahrzeuge, falls Backend nicht erreichbar
const FALLBACK_VEHICLES = [
  { id: '1', modell: 'VW Golf', kennzeichen: 'ERB-AB 123', displayName: 'VW Golf / ERB-AB 123' },
  { id: '2', modell: 'Audi A5', kennzeichen: 'ERB-CD 456', displayName: 'Audi A5 / ERB-CD 456' },
  { id: '3', modell: 'McLaren 540c', kennzeichen: 'ERB-RM 229', displayName: 'McLaren 540c / ERB-RM 229' }
];

// Lokalen Speicher verwalten
const getLocalBookings = () => {
  try {
    const saved = localStorage.getItem('localBookings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error("Fehler beim Lesen lokaler Buchungen:", err);
  }
  
  // Standard-Buchung, falls keine gespeichert sind
  return [
    {
      id: 'local-1',
      vehicle_id: '3',
      vehicle_name: 'McLaren 540c / ERB-RM 229',
      employee_name: 'Max Mustermann',
      department: 'Vertrieb',
      purpose: 'Kundenbesuch',
      start_date: new Date(Date.now() - 86400000).toISOString(), // Gestern
      end_date: new Date(Date.now() + 172800000).toISOString(),  // In 2 Tagen
      status: 'Reserviert',
      notes: 'Demo-Buchung (lokal gespeichert)'
    }
  ];
};

// Lokale Buchungen speichern
const saveLocalBookings = (bookings) => {
  try {
    localStorage.setItem('localBookings', JSON.stringify(bookings));
  } catch (err) {
    console.error("Fehler beim Speichern lokaler Buchungen:", err);
  }
};

function Bookings() {
  // Zustandsvariablen
  const [loading, setLoading] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState('Verbindung wird geprüft...');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');
  const [localMode, setLocalMode] = useState(true); // Standardmäßig lokalen Modus verwenden
  const [showForm, setShowForm] = useState(false);

  // Formular-Zustand
  const [formData, setFormData] = useState({
    vehicle_id: '',
    employee_name: '',
    department: '',
    purpose: '',
    start_date: dayjs(),
    end_date: dayjs().add(1, 'day'),
    status: 'Reserviert',
    notes: ''
  });
  
  // Formularvalidierung
  const [formErrors, setFormErrors] = useState({});
  
  // Bearbeitung
  const [editingId, setEditingId] = useState(null);

  // State für lokale Buchungen
  const [localBookings, setLocalBookings] = useState(getLocalBookings());

  // Laden aller Daten beim Initialisieren der Komponente
  useEffect(() => {
    console.log("Bookings-Komponente wird initialisiert - Lade Daten");
    checkBackendConnection();
    loadFallbackVehicles(); // Lade sofort Fallback-Daten
    loadAllData();
  }, []);

  // Lokale Buchungen speichern, wenn sie sich ändern
  useEffect(() => {
    saveLocalBookings(localBookings);
  }, [localBookings]);

  // Alle Daten laden, je nach Verbindungsstatus
  const loadAllData = async () => {
    if (localMode) {
      loadLocalData();
    } else {
      try {
        await Promise.all([loadVehicles(), loadBackendBookings()]);
      } catch (err) {
        console.error("Fehler beim Laden der Daten, wechsle in lokalen Modus:", err);
        setLocalMode(true);
        loadLocalData();
      }
    }
  };

  // Lokale Daten laden (schnell und zuverlässig)
  const loadLocalData = () => {
    setLoading(true);
    console.log("Lade lokale Daten");
    
    // Lade Fahrzeuge
    setVehicles(FALLBACK_VEHICLES);
    setLoadingVehicles(false);
    
    // Lade Buchungen aus localStorage
    const storedBookings = getLocalBookings();
    
    // Formatiere die Buchungen für die Anzeige
    const formattedBookings = storedBookings.map(booking => ({
      ...booking,
      start_date: dayjs(booking.start_date),
      end_date: dayjs(booking.end_date)
    }));
    
    setBookings(formattedBookings);
    setLoading(false);
    setBackendStatus('Lokaler Modus (Backend nicht erreichbar)');
    showNotification("Lokaler Modus aktiv - Änderungen werden dauerhaft im Browser gespeichert", "info");
  };

  // Backend-Verbindung überprüfen
  const checkBackendConnection = async () => {
    try {
      const response = await fetch(`${API_URL}/api/vehicles`, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        setBackendStatus('Verbunden');
        setLocalMode(false);
        console.log("Backend-Verbindung erfolgreich hergestellt");
      } else {
        setBackendStatus(`Fehler: ${response.status} ${response.statusText}`);
        setLocalMode(true);
        console.error("Backend-Verbindung fehlgeschlagen:", response.status, response.statusText);
      }
    } catch (error) {
      setBackendStatus('Keine Verbindung');
      setLocalMode(true);
      console.error("Backend nicht erreichbar:", error.message);
      showNotification("Backend-Server nicht erreichbar. Lokaler Modus aktiviert.", "warning");
    }
  };

  // Fahrzeuge vom Backend laden
  const loadVehicles = async () => {
    console.log("Versuche Fahrzeuge vom Server zu laden...");
    setLoadingVehicles(true);
    
    try {
      const response = await fetch(`${API_URL}/api/vehicles`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        console.warn(`Server-Fehler beim Laden der Fahrzeuge: ${response.status}`);
        loadFallbackVehicles();
        return;
      }
      
      const data = await response.json();
      console.log("Server-Fahrzeugdaten:", data);
      
      if (Array.isArray(data) && data.length > 0) {
        const formattedVehicles = data.map(vehicle => ({
          id: vehicle.id?.toString() || '',
          modell: vehicle.modell || 'Unbekannt',
          kennzeichen: vehicle.kennzeichen || 'Unbekannt',
          displayName: `${vehicle.modell || 'Unbekannt'} / ${vehicle.kennzeichen || 'Unbekannt'}`
        }));
        
        console.log(`${formattedVehicles.length} Fahrzeuge geladen`);
        setVehicles(formattedVehicles);
      } else {
        console.warn("Keine Fahrzeuge vom Server erhalten, verwende Fallback-Daten");
        loadFallbackVehicles();
      }
    } catch (error) {
      console.error("Fehler beim Laden der Fahrzeuge:", error);
      loadFallbackVehicles();
    } finally {
      setLoadingVehicles(false);
    }
  };

  // Fallback-Fahrzeuge laden wenn Backend nicht verfügbar
  const loadFallbackVehicles = () => {
    console.log("Verwende Fallback-Fahrzeuge");
    setVehicles(FALLBACK_VEHICLES);
    setLoadingVehicles(false);
  };

  // Buchungen vom Backend laden
  const loadBackendBookings = async () => {
    console.log("Versuche Buchungen vom Server zu laden...");
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/bookings`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        console.warn(`Server-Fehler beim Laden der Buchungen: ${response.status}`);
        throw new Error(`Server antwortet mit ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Server-Buchungsdaten:", data);
      
      if (Array.isArray(data)) {
        const formattedBookings = data.map(booking => ({
          id: booking.id,
          vehicle_id: booking.vehicle_id,
          vehicle_name: findVehicleName(booking.vehicle_id),
          start_date: dayjs(booking.start_date || booking.startzeit),
          end_date: dayjs(booking.end_date || booking.endzeit),
          employee_name: booking.mitarbeiter || booking.employee_name || '',
          department: booking.abteilung || booking.department || '',
          purpose: booking.zweck || booking.purpose || '',
          status: booking.status || 'Reserviert',
          notes: booking.notizen || booking.notes || ''
        }));
        
        console.log(`${formattedBookings.length} Buchungen geladen`);
        setBookings(formattedBookings);
      } else {
        console.warn("Keine Buchungen vom Server erhalten oder unerwartetes Format");
        throw new Error("Unerwartetes Datenformat");
      }
    } catch (error) {
      console.error("Fehler beim Laden der Buchungen, wechsle in lokalen Modus:", error);
      setLocalMode(true);
      loadLocalData();
    } finally {
      setLoading(false);
    }
  };

  // Findet den Fahrzeugnamen anhand der ID
  const findVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.displayName : 'Unbekanntes Fahrzeug';
  };

  // Form Change Handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Fehler zurücksetzen wenn Feld geändert wird
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Datumsfeld-Handler
  const handleDateChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Fehler zurücksetzen wenn Feld geändert wird
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  // Formular zurücksetzen
  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      employee_name: '',
      department: '',
      purpose: '',
      start_date: dayjs(),
      end_date: dayjs().add(1, 'day'),
      status: 'Reserviert',
      notes: ''
    });
    setFormErrors({});
    setEditingId(null);
  };

  // Formular validieren
  const validateForm = () => {
    const errors = {};
    
    if (!formData.vehicle_id) {
      errors.vehicle_id = 'Bitte ein Fahrzeug auswählen';
    }
    
    if (!formData.employee_name) {
      errors.employee_name = 'Bitte einen Mitarbeiternamen eingeben';
    }
    
    if (!formData.purpose) {
      errors.purpose = 'Bitte einen Verwendungszweck angeben';
    }
    
    if (!formData.start_date) {
      errors.start_date = 'Bitte ein Startdatum wählen';
    }
    
    if (!formData.end_date) {
      errors.end_date = 'Bitte ein Enddatum wählen';
    } else if (formData.start_date && formData.end_date.isBefore(formData.start_date)) {
      errors.end_date = 'Das Enddatum muss nach dem Startdatum liegen';
    }
    
    return errors;
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Formular wird abgesendet mit Daten:", formData);
    
    // Formular validieren
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setLoading(true);
    
    if (localMode) {
      // Lokale Speicherung
      handleLocalSave();
    } else {
      try {
        await handleBackendSave();
      } catch (error) {
        console.error("Backend-Speicherung fehlgeschlagen, verwende lokale Speicherung:", error);
        handleLocalSave();
      }
    }
    
    setLoading(false);
  };
  
  // Lokale Speicherung einer Buchung
  const handleLocalSave = () => {
    const localId = editingId && editingId.startsWith('local-') 
      ? editingId 
      : `local-${Date.now()}`;
      
    const newBooking = {
      id: localId,
      vehicle_id: formData.vehicle_id,
      vehicle_name: findVehicleName(formData.vehicle_id),
      employee_name: formData.employee_name,
      department: formData.department,
      purpose: formData.purpose,
      start_date: formData.start_date.toISOString(),
      end_date: formData.end_date.toISOString(),
      status: formData.status,
      notes: formData.notes
    };
    
    // Aktualisiere die lokalen Buchungen
    if (editingId && editingId.startsWith('local-')) {
      // Buchung aktualisieren
      const updatedBookings = localBookings.map(booking => 
        booking.id === editingId ? newBooking : booking
      );
      setLocalBookings(updatedBookings);
    } else {
      // Neue Buchung hinzufügen
      setLocalBookings([...localBookings, newBooking]);
    }
    
    // Aktualisiere den Anzeige-State (formatiert)
    const formattedBookings = [...localBookings, editingId ? null : newBooking]
      .filter(Boolean)
      .map(booking => ({
        ...booking,
        start_date: dayjs(booking.start_date),
        end_date: dayjs(booking.end_date)
      }));
    
    if (editingId) {
      // Wenn wir bearbeiten, müssen wir die neue Version verwenden
      const bookingIndex = formattedBookings.findIndex(b => b.id === editingId);
      if (bookingIndex >= 0) {
        formattedBookings[bookingIndex] = {
          ...newBooking,
          start_date: dayjs(newBooking.start_date),
          end_date: dayjs(newBooking.end_date)
        };
      }
    }
    
    setBookings(formattedBookings);
    showNotification(
      editingId ? "Buchung dauerhaft aktualisiert" : "Buchung dauerhaft gespeichert", 
      "success"
    );
    resetForm();
  };
  
  // Backend-Speicherung einer Buchung
  const handleBackendSave = async () => {
    // Anpassen der Daten an das Backend-Schema
    const bookingToSave = {
      vehicle_id: formData.vehicle_id,
      startzeit: formData.start_date.toISOString(),
      endzeit: formData.end_date.toISOString(),
      status: formData.status || 'Reserviert',
      zweck: formData.purpose || '',
      mitarbeiter: formData.employee_name || '',
      abteilung: formData.department || '',
    };
    
    // Buchung speichern
    const url = editingId && !editingId.startsWith('local-')
      ? `${API_URL}/api/bookings/${editingId}`
      : `${API_URL}/api/bookings`;
    
    const method = editingId && !editingId.startsWith('local-') ? 'PUT' : 'POST';
    console.log(`${method}-Anfrage an ${url}`);
    
    const response = await fetch(url, {
      method: method,
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors',
      cache: 'no-cache',
      body: JSON.stringify(bookingToSave)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server-Fehler:", response.status, errorText);
      throw new Error(`Server-Fehler: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log("Server-Antwort:", result);
    
    showNotification(
      editingId ? "Buchung aktualisiert" : "Neue Buchung erstellt", 
      "success"
    );
    resetForm();
    await loadBackendBookings();
  };

  // Buchung löschen
  const handleDelete = async (id) => {
    if (!window.confirm("Möchten Sie diese Buchung wirklich löschen?")) {
      return;
    }
    
    setLoading(true);
    
    // Lokale Buchung löschen
    if (id.startsWith('local-') || localMode) {
      console.log("Lösche lokale Buchung:", id);
      const updatedBookings = localBookings.filter(booking => booking.id !== id);
      setLocalBookings(updatedBookings);
      
      // Aktualisiere State
      const formattedBookings = updatedBookings.map(booking => ({
        ...booking,
        start_date: dayjs(booking.start_date),
        end_date: dayjs(booking.end_date)
      }));
      
      setBookings(formattedBookings);
      showNotification("Buchung dauerhaft gelöscht", "success");
      setLoading(false);
      return;
    }
    
    // Backend-Buchung löschen
    try {
      console.log(`DELETE ${API_URL}/api/bookings/${id}`);
      const response = await fetch(`${API_URL}/api/bookings/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fehler beim Löschen der Buchung: ${response.status} - ${errorText}`);
      }
      
      showNotification("Buchung erfolgreich gelöscht", "success");
      await loadBackendBookings();
    } catch (error) {
      console.error("Fehler beim Löschen der Buchung:", error);
      showNotification(`Fehler beim Löschen der Buchung: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Buchung bearbeiten
  const handleEdit = (booking) => {
    console.log("Bearbeite Buchung:", booking);
    setEditingId(booking.id);
    setFormData({
      vehicle_id: booking.vehicle_id || '',
      employee_name: booking.employee_name || '',
      department: booking.department || '',
      purpose: booking.purpose || '',
      start_date: dayjs(booking.start_date),
      end_date: dayjs(booking.end_date),
      status: booking.status || 'Reserviert',
      notes: booking.notes || ''
    });
    setShowForm(true);
  };

  // Benachrichtigung anzeigen
  const showNotification = (message, severity = 'info') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setShowAlert(true);
  };

  // Modus wechseln zwischen lokal und Backend
  const toggleMode = () => {
    const newMode = !localMode;
    setLocalMode(newMode);
    
    if (newMode) {
      setBackendStatus('Lokaler Modus (manuell aktiviert)');
      loadLocalData();
    } else {
      checkBackendConnection();
      loadAllData();
    }
    
    showNotification(
      newMode 
        ? "Lokaler Modus aktiviert - Änderungen werden dauerhaft im Browser gespeichert" 
        : "Backend-Modus aktiviert - Verbindung zum Server wird hergestellt",
      "info"
    );
  };

  // Render-Funktion für Formularsicht
  if (showForm) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', overflow: 'visible' }}>
        <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Status-Banner wird nur angezeigt, wenn es ein Problem mit dem Backend gibt */}
          {localMode && backendStatus !== 'Verbunden' && (
            <Alert severity="info" sx={{ mb: 1 }}>
              <strong>Hinweis:</strong> Buchungen werden im Browser gespeichert, da das Backend nicht erreichbar ist.
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button 
              variant="outlined" 
              onClick={() => setShowForm(false)}
              sx={{ mb: 2 }}
            >
              Zurück zur Übersicht
            </Button>
          </Box>
          
          <Typography variant="h4" component="h1" gutterBottom>
            {editingId ? 'Buchung bearbeiten' : 'Neue Buchung erstellen'}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Card elevation={3}>
          <CardContent>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2}>
                {/* Fahrzeugauswahl */}
                <Grid item xs={12} sm={6}>
                  <div className="form-control">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="vehicle_id">
                      Fahrzeug *
                    </label>
                    <select
                      id="vehicle_id"
                      name="vehicle_id"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      value={formData.vehicle_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="" disabled>Bitte wählen</option>
                      {loadingVehicles ? (
                        <option value="" disabled>Fahrzeuge werden geladen...</option>
                      ) : vehicles.length > 0 ? (
                        vehicles.map(vehicle => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.displayName}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>Keine Fahrzeuge verfügbar</option>
                      )}
                    </select>
                    {formErrors.vehicle_id && (
                      <p className="mt-2 text-sm text-red-600">
                        {formErrors.vehicle_id}
                      </p>
                    )}
                    {!loadingVehicles && vehicles.length === 0 && (
                      <p className="mt-2 text-sm text-red-600">
                        Keine Fahrzeuge gefunden. Bitte fügen Sie zuerst Fahrzeuge hinzu.
                      </p>
                    )}
                  </div>
                </Grid>
                
                {/* Mitarbeiter */}
                <Grid item xs={12} sm={6}>
                  <div className="form-control">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="employee_name">
                      Mitarbeiter *
                    </label>
                    <input
                      type="text"
                      id="employee_name"
                      name="employee_name"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      value={formData.employee_name}
                      onChange={handleInputChange}
                      required
                    />
                    {formErrors.employee_name && (
                      <p className="mt-2 text-sm text-red-600">
                        {formErrors.employee_name}
                      </p>
                    )}
                  </div>
                </Grid>
                
                {/* Abteilung */}
                <Grid item xs={12} sm={6}>
                  <div className="form-control">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="department">
                      Abteilung/Kostenstelle
                    </label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      value={formData.department}
                      onChange={handleInputChange}
                    />
                  </div>
                </Grid>
                
                {/* Zweck */}
                <Grid item xs={12} sm={6}>
                  <div className="form-control">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="purpose">
                      Verwendungszweck *
                    </label>
                    <input
                      type="text"
                      id="purpose"
                      name="purpose"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      value={formData.purpose}
                      onChange={handleInputChange}
                      required
                    />
                    {formErrors.purpose && (
                      <p className="mt-2 text-sm text-red-600">
                        {formErrors.purpose}
                      </p>
                    )}
                  </div>
                </Grid>
                
                {/* Startdatum */}
                <Grid item xs={12} sm={6}>
                  <div className="form-control">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="start_date">
                      Startdatum *
                    </label>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      value={formData.start_date.format('YYYY-MM-DD')}
                      onChange={(e) => {
                        const newDate = dayjs(e.target.value);
                        if(newDate.isValid()) {
                          // Behalte die Uhrzeit bei, ändere nur das Datum
                          const newDateTime = formData.start_date
                            .year(newDate.year())
                            .month(newDate.month())
                            .date(newDate.date());
                          handleDateChange('start_date', newDateTime);
                        }
                      }}
                      required
                    />
                    {formErrors.start_date && (
                      <p className="mt-2 text-sm text-red-600">
                        {formErrors.start_date}
                      </p>
                    )}
                  </div>
                </Grid>
                
                {/* Startzeit */}
                <Grid item xs={12} sm={6}>
                  <div className="form-control">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="start_time">
                      Startzeit
                    </label>
                    <input
                      type="time"
                      id="start_time"
                      name="start_time"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      value={formData.start_date.format('HH:mm')}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':').map(Number);
                        const newDateTime = formData.start_date
                          .hour(hours)
                          .minute(minutes)
                          .second(0);
                        handleDateChange('start_date', newDateTime);
                      }}
                    />
                  </div>
                </Grid>
                
                {/* Enddatum */}
                <Grid item xs={12} sm={6}>
                  <div className="form-control">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="end_date">
                      Enddatum *
                    </label>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      value={formData.end_date.format('YYYY-MM-DD')}
                      onChange={(e) => {
                        const newDate = dayjs(e.target.value);
                        if(newDate.isValid()) {
                          // Behalte die Uhrzeit bei, ändere nur das Datum
                          const newDateTime = formData.end_date
                            .year(newDate.year())
                            .month(newDate.month())
                            .date(newDate.date());
                          handleDateChange('end_date', newDateTime);
                        }
                      }}
                      required
                    />
                    {formErrors.end_date && (
                      <p className="mt-2 text-sm text-red-600">
                        {formErrors.end_date}
                      </p>
                    )}
                  </div>
                </Grid>
                
                {/* Endzeit */}
                <Grid item xs={12} sm={6}>
                  <div className="form-control">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="end_time">
                      Endzeit
                    </label>
                    <input
                      type="time"
                      id="end_time"
                      name="end_time"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      value={formData.end_date.format('HH:mm')}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':').map(Number);
                        const newDateTime = formData.end_date
                          .hour(hours)
                          .minute(minutes)
                          .second(0);
                        handleDateChange('end_date', newDateTime);
                      }}
                    />
                  </div>
                </Grid>
                
                {/* Status */}
                <Grid item xs={12} sm={6}>
                  <div className="form-control">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="status">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="Reserviert">Reserviert</option>
                      <option value="Ausgegeben">Ausgegeben</option>
                      <option value="Zurückgegeben">Zurückgegeben</option>
                    </select>
                  </div>
                </Grid>
                
                {/* Notizen */}
                <Grid item xs={12}>
                  <div className="form-control">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="notes">
                      Notizen
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows="3"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      value={formData.notes}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                </Grid>
                
                {/* Buttons */}
                <Grid item xs={12}>
                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      onClick={resetForm}
                      disabled={loading}
                      variant="outlined"
                      sx={{ mr: 2 }}
                    >
                      Abbrechen
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                    >
                      {loading ? 'Wird gespeichert...' : editingId ? 'Aktualisieren' : 'Buchung erstellen'}
                    </Button>
                  </div>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Render-Funktion für Listenansicht
  return (
    <Container maxWidth="lg" sx={{ py: 4, position: 'relative', overflow: 'visible' }}>
      {/* Status-Banner wird nur angezeigt, wenn es ein Problem mit dem Backend gibt */}
      {localMode && backendStatus !== 'Verbunden' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Hinweis:</strong> Buchungen werden im Browser gespeichert, da das Backend nicht erreichbar ist.
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Buchungsverwaltung
          </Typography>
        </Box>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => {
            setEditingId(null);
            setShowForm(true);
          }}
          disabled={loading}
        >
          Neue Buchung
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : bookings.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Keine Buchungen vorhanden
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setEditingId(null);
              setShowForm(true);
            }}
            sx={{ mt: 2 }}
            disabled={loading}
          >
            Erste Buchung erstellen
          </Button>
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><Typography variant="subtitle2">Fahrzeug</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Zeitraum</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Mitarbeiter</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Zweck</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Status</Typography></TableCell>
                <TableCell align="right"><Typography variant="subtitle2">Aktionen</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow 
                  key={booking.id} 
                  hover
                  sx={booking.id.toString().startsWith('local-') ? { backgroundColor: '#fff8e1' } : {}}
                >
                  <TableCell>
                    <Typography variant="body2">
                      {booking.vehicle_name || 'Unbekanntes Fahrzeug'}
                    </Typography>
                    {booking.id.toString().startsWith('local-') && (
                      <Typography variant="caption" color="text.secondary">
                        (Lokal gespeichert)
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {booking.start_date.format('DD.MM.YYYY HH:mm')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      bis {booking.end_date.format('DD.MM.YYYY HH:mm')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {booking.employee_name || 'Nicht angegeben'}
                    </Typography>
                    {booking.department && (
                      <Typography variant="body2" color="text.secondary">
                        {booking.department}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {booking.purpose || 'Kein Zweck angegeben'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={booking.status || 'Unbekannt'} 
                      size="small"
                      color={booking.status === 'Reserviert' ? 'warning' : 
                             booking.status === 'Ausgegeben' ? 'success' : 'info'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => handleEdit(booking)}
                      title="Bearbeiten"
                    >
                      E
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleDelete(booking.id)}
                      title="Löschen"
                    >
                      X
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Benachrichtigungen */}
      <Snackbar 
        open={showAlert} 
        autoHideDuration={6000} 
        onClose={() => setShowAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ zIndex: 10000 }}
      >
        <Alert onClose={() => setShowAlert(false)} severity={alertSeverity} sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Bookings; 