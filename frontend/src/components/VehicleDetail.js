import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DamageReport from './DamageReport';
import FuelLog from './FuelLog';
import VehicleCalendar from './VehicleCalendar';

function VehicleDetail({ vehicle, onClose, onUpdate, onDelete, isUserView = false }) {
  const [vehicleData, setVehicleData] = useState(vehicle);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [newMaintenance, setNewMaintenance] = useState({
    beschreibung: '',
    kosten: 0,
    kilometerstand: vehicle ? vehicle.kilometerstand || 0 : 0,
    durchgefuehrt_von: '',
    art_der_wartung: 'Routinewartung'
  });
  const [editingRecord, setEditingRecord] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [documents, setDocuments] = useState([]);
  const [damageReports, setDamageReports] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [showDamageReport, setShowDamageReport] = useState(false);
  const [showFuelLog, setShowFuelLog] = useState(false);
  const [editingFuelLog, setEditingFuelLog] = useState(null);
  const [editingDamageReport, setEditingDamageReport] = useState(null);
  const [showImageModal, setShowImageModal] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    modell: vehicle ? vehicle.modell : '',
    kennzeichen: vehicle ? vehicle.kennzeichen : '',
    kilometerstand: vehicle ? vehicle.kilometerstand : 0,
    tankstand: vehicle ? vehicle.tankstand : 100,
    tuev_datum: vehicle && vehicle.tuev_datum ? vehicle.tuev_datum.split('T')[0] : '',
    au_datum: vehicle && vehicle.au_datum ? vehicle.au_datum.split('T')[0] : ''
  });
  const [bookings, setBookings] = useState([]);

  const vehicleId = vehicle ? vehicle.id : null;

  // Hilfsfunktion zur Formatierung von Datum
  const formatDate = (dateString) => {
    if (!dateString) return 'Nicht eingetragen';
    try {
      return new Date(dateString).toLocaleDateString('de-DE');
    } catch (e) {
      return 'Ungültiges Datum';
    }
  };

  useEffect(() => {
    if (!vehicleId) {
      console.error("Keine Fahrzeug-ID vorhanden");
      return;
    }

    // Für normale Benutzer holen wir nur die Buchungen
    if (isUserView) {
      loadBookings();
      return;
    }

    // Für Admins laden wir alle detaillierten Informationen
    axios.get(`http://localhost:5000/api/vehicles/${vehicleId}/maintenance`)
      .then(response => {
        console.log('Wartungshistorie geladen:', response.data);
        setMaintenanceHistory(response.data);
      })
      .catch(error => {
        console.error('Error loading maintenance history:', error);
        const demoMaintenance = [
          {
            id: 1,
            datum: new Date().toISOString().split('T')[0],
            beschreibung: 'Ölwechsel',
            kosten: 150,
            kilometerstand: vehicleData.kilometerstand - 1000,
            durchgefuehrt_von: 'Werkstatt Meier',
            art_der_wartung: 'Routinewartung'
          }
        ];
        setMaintenanceHistory(demoMaintenance);
      });

    axios.get(`http://localhost:5000/api/vehicles/${vehicleId}/damage-reports`)
      .then(response => {
        setDamageReports(response.data);
      })
      .catch(error => {
        console.error('Error loading damage reports:', error);
        const demoDamageReports = [];
        setDamageReports(demoDamageReports);
      });

    axios.get(`http://localhost:5000/api/vehicles/${vehicleId}/fuel-logs`)
      .then(response => {
        setFuelLogs(response.data);
      })
      .catch(error => {
        console.error('Error loading fuel logs:', error);
        const demoFuelLogs = [];
        setFuelLogs(demoFuelLogs);
      });
    
    loadBookings();
  }, [vehicleId, vehicleData.kilometerstand, isUserView]);

  // Laden der Buchungen für das Fahrzeug
  const loadBookings = () => {
    try {
      // Lade alle Anfragen aus dem localStorage
      const allRequests = JSON.parse(localStorage.getItem('vehicleRequests') || '[]');
      
      // Filtere nach Anfragen für dieses Fahrzeug
      const vehicleBookings = allRequests.filter(req => {
        const reqVehicleId = req.vehicleId && req.vehicleId.toString();
        const currentVehicleId = vehicleId && vehicleId.toString();
        return reqVehicleId === currentVehicleId;
      });
      
      console.log('Buchungen für Fahrzeug geladen:', vehicleBookings);
      setBookings(vehicleBookings);
    } catch (error) {
      console.error('Fehler beim Laden der Buchungen:', error);
      setBookings([]);
    }
  };

  const handleSaveVehicle = () => {
    if (!vehicleId) return;
    
    axios.put(`http://localhost:5000/api/vehicles/${vehicleId}`, editData)
      .then(response => {
        setVehicleData(response.data);
        setEditMode(false);
        
        if (onUpdate) {
          onUpdate(response.data);
        }
      })
      .catch(error => {
        console.error('Error updating vehicle:', error);
        console.log('Fallback: Simuliere Aktualisierung im Offline-Modus');
        
        const updatedVehicle = {
          ...vehicleData,
          ...editData
        };
        
        setVehicleData(updatedVehicle);
        setEditMode(false);
        
        if (onUpdate) {
          onUpdate(updatedVehicle);
        }
      });
  };

  const handleDeleteVehicle = () => {
    if (!vehicleId) return;
    
    if (window.confirm(`Möchten Sie wirklich das Fahrzeug ${vehicleData.modell} löschen?`)) {
      axios.delete(`http://localhost:5000/api/vehicles/${vehicleId}`)
        .then(() => {
          if (onDelete) {
            onDelete(vehicleId);
          }
          onClose();
        })
        .catch(error => {
          console.error('Error deleting vehicle:', error);
          console.log('Fallback: Simuliere Löschung im Offline-Modus');
          
          if (onDelete) {
            onDelete(vehicleId);
          }
          onClose();
        });
    }
  };

  const handleMaintenanceSubmit = (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Wenn wir einen Eintrag bearbeiten
    if (editingRecord) {
      axios.put(`http://localhost:5000/api/vehicles/${vehicleId}/maintenance/${editingRecord.id}`, {
        ...newMaintenance,
        datum: new Date().toISOString().split('T')[0] // Aktuelles Datum
      })
        .then(response => {
          console.log('Wartungseintrag aktualisiert:', response.data);
          
          // Aktualisiere die Wartungshistorie in der Anzeige
          setMaintenanceHistory(maintenanceHistory.map(record => 
            record.id === editingRecord.id ? response.data : record
          ));
          
          // Formular zurücksetzen
          setNewMaintenance({
            beschreibung: '',
            kosten: 0,
            kilometerstand: vehicleData.kilometerstand || 0,
            durchgefuehrt_von: '',
            art_der_wartung: 'Routinewartung'
          });
          setEditingRecord(null);
          setIsSubmitting(false);
        })
        .catch(error => {
          console.error('Error:', error);
          setIsSubmitting(false);
          
          // Fallback für Offline-Modus
          console.log('Fallback: Simuliere Wartungseintrag-Update im Offline-Modus');
          
          const updatedRecord = {
            ...editingRecord,
            ...newMaintenance,
            datum: new Date().toISOString().split('T')[0]
          };
          
          // Aktualisiere die Wartungshistorie in der Anzeige
          setMaintenanceHistory(maintenanceHistory.map(record => 
            record.id === editingRecord.id ? updatedRecord : record
          ));
          
          // Formular zurücksetzen
          setNewMaintenance({
            beschreibung: '',
            kosten: 0,
            kilometerstand: vehicleData.kilometerstand || 0,
            durchgefuehrt_von: '',
            art_der_wartung: 'Routinewartung'
          });
          setEditingRecord(null);
          setIsSubmitting(false);
        });
    } 
    // Wenn wir einen neuen Eintrag erstellen
    else {
      axios.post(`http://localhost:5000/api/vehicles/${vehicleId}/maintenance`, {
        ...newMaintenance,
        datum: new Date().toISOString().split('T')[0] // Aktuelles Datum
      })
        .then(response => {
          console.log('Wartungseintrag hinzugefügt:', response.data);
          
          // Füge den neuen Eintrag zur Historie hinzu
          setMaintenanceHistory([...maintenanceHistory, response.data]);
          
          // Formular zurücksetzen
          setNewMaintenance({
            beschreibung: '',
            kosten: 0,
            kilometerstand: vehicleData.kilometerstand || 0,
            durchgefuehrt_von: '',
            art_der_wartung: 'Routinewartung'
          });
          setIsSubmitting(false);
        })
        .catch(error => {
          console.error('Error:', error);
          setIsSubmitting(false);
          
          // Fallback für Offline-Modus
          console.log('Fallback: Simuliere neuen Wartungseintrag im Offline-Modus');
          
          const newRecord = {
            ...newMaintenance,
            id: Date.now(), // Generiere eine temporäre ID
            datum: new Date().toISOString().split('T')[0]
          };
          
          // Füge den neuen Eintrag zur Historie hinzu
          setMaintenanceHistory([...maintenanceHistory, newRecord]);
          
          // Formular zurücksetzen
          setNewMaintenance({
            beschreibung: '',
            kosten: 0,
            kilometerstand: vehicleData.kilometerstand || 0,
            durchgefuehrt_von: '',
            art_der_wartung: 'Routinewartung'
          });
          setIsSubmitting(false);
        });
    }
  };

  const handleDelete = (recordId) => {
    if (window.confirm('Möchten Sie diesen Wartungseintrag wirklich löschen?')) {
      axios.delete(`http://localhost:5000/api/vehicles/${vehicleId}/maintenance/${recordId}`)
        .then(() => {
          setMaintenanceHistory(maintenanceHistory.filter(record => record.id !== recordId));
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Fehler beim Löschen des Eintrags');
        });
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setNewMaintenance({
      beschreibung: record.beschreibung,
      kosten: record.kosten,
      kilometerstand: record.kilometerstand,
      durchgefuehrt_von: record.durchgefuehrt_von,
      art_der_wartung: record.art_der_wartung
    });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    axios.put(`http://localhost:5000/api/vehicles/${vehicleId}/maintenance/${editingRecord.id}`, newMaintenance)
      .then(response => {
        setMaintenanceHistory(maintenanceHistory.map(record => 
          record.id === editingRecord.id ? response.data : record
        ));
        setEditingRecord(null);
        setNewMaintenance({
          beschreibung: '',
          kosten: 0,
          kilometerstand: 0,
          durchgefuehrt_von: '',
          art_der_wartung: 'Routinewartung'
        });
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Fehler beim Aktualisieren des Eintrags');
      });
  };

  const renderStatusBadge = (status) => {
    const colors = {
      'verfügbar': 'bg-green-100 text-green-800',
      'gebucht': 'bg-blue-100 text-blue-800',
      'In Wartung': 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-sm ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const handleDocumentUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', 'Allgemein');

      const response = await axios.post(
        `http://localhost:5000/api/vehicles/${vehicleId}/documents`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setDocuments(prev => [...prev, response.data.document]);
    } catch (error) {
      console.error('Fehler beim Hochladen des Dokuments:', error);
      alert('Fehler beim Hochladen des Dokuments');
    }
  };

  const handleDamageReport = (data) => {
    const formData = new FormData();
    formData.append('description', data.description);
    if (data.images) {
      data.images.forEach(image => formData.append('images', image));
    }

    axios.post(`/api/vehicles/${vehicleId}/damage-reports`, formData)
      .then(response => {
        setDamageReports([response.data, ...damageReports]);
      })
      .catch(error => console.error('Error:', error));
  };

  const handleFuelLog = (data) => {
    axios.post(`/api/vehicles/${vehicleId}/fuel-logs`, data)
      .then(response => {
        setFuelLogs([response.data, ...fuelLogs]);
      })
      .catch(error => console.error('Error:', error));
  };

  const handleDeleteFuelLog = (logId) => {
    if (window.confirm('Möchten Sie diesen Tankeintrag wirklich löschen?')) {
      axios.delete(`http://localhost:5000/api/vehicles/${vehicleId}/fuel-logs/${logId}`)
        .then(() => {
          setFuelLogs(fuelLogs.filter(log => log.id !== logId));
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Fehler beim Löschen des Tankeintrags');
        });
    }
  };

  const handleEditFuelLog = (log) => {
    setShowFuelLog(true);
    setEditingFuelLog(log);
  };

  const handleDeleteDamageReport = (reportId) => {
    if (window.confirm('Möchten Sie diese Schadensmeldung wirklich löschen?')) {
      axios.delete(`http://localhost:5000/api/vehicles/${vehicleId}/damage-reports/${reportId}`)
        .then(() => {
          setDamageReports(damageReports.filter(report => report.id !== reportId));
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Fehler beim Löschen der Schadensmeldung');
        });
    }
  };

  const handleEditDamageReport = (report) => {
    setEditingDamageReport(report);
    setShowDamageReport(true);
  };

  const renderDetailsTab = () => {
    if (editMode && !isUserView) {
      // Editor-Ansicht für Admins
      // ... existing code ...
    }

    return (
      <div className="bg-white p-6 rounded-md shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Fahrzeugdetails</h3>
          {!isUserView && (
            <div className="space-x-2">
              {!editMode && (
                <>
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Bearbeiten
                  </button>
                  {onDelete && (
                    <button
                      onClick={handleDeleteVehicle}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Fahrzeug löschen
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {!editMode && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Modell</p>
              <p className="font-medium">{vehicleData.modell}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Kennzeichen</p>
              <p className="font-medium">{vehicleData.kennzeichen}</p>
            </div>
            {!isUserView && (
              <>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Kilometerstand</p>
                  <p className="font-medium">{vehicleData.kilometerstand?.toLocaleString() || '0'} km</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tankstand</p>
                  <p className="font-medium">{vehicleData.tankstand || '100'}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">TÜV gültig bis</p>
                  <p className="font-medium">{formatDate(vehicleData.tuev_datum)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">AU gültig bis</p>
                  <p className="font-medium">{formatDate(vehicleData.au_datum)}</p>
                </div>
              </>
            )}
            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <p className="font-medium">
                <span className={`px-2 py-0.5 rounded text-sm ${
                  vehicleData.status === 'Verfügbar' ? 'bg-green-100 text-green-800' :
                  vehicleData.status === 'In Benutzung' ? 'bg-blue-100 text-blue-800' :
                  vehicleData.status === 'In Wartung' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {vehicleData.status || 'Verfügbar'}
                </span>
              </p>
            </div>
          </div>
        )}
        
        {/* Nur für Benutzer: Zeige Kalendar direkt im Detailbereich an */}
        {isUserView && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Fahrzeugverfügbarkeit</h3>
            <VehicleCalendar bookings={bookings} />
          </div>
        )}
      </div>
    );
  };

  if (!vehicleData) return <div>Loading...</div>;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{vehicleData.modell}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3 py-2 rounded-md ${activeTab === 'details' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
            >
              Details
            </button>
            {!isUserView && (
              <>
                <button
                  onClick={() => setActiveTab('maintenance')}
                  className={`px-3 py-2 rounded-md ${activeTab === 'maintenance' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
                >
                  Wartung
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`px-3 py-2 rounded-md ${activeTab === 'documents' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
                >
                  Dokumente
                </button>
                <button
                  onClick={() => setActiveTab('damage')}
                  className={`px-3 py-2 rounded-md ${activeTab === 'damage' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
                >
                  Schäden
                </button>
                <button
                  onClick={() => setActiveTab('fuel')}
                  className={`px-3 py-2 rounded-md ${activeTab === 'fuel' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
                >
                  Tankprotokoll
                </button>
              </>
            )}
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-2 rounded-md ${activeTab === 'calendar' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
            >
              Kalender
            </button>
          </nav>
        </div>

        {activeTab === 'details' && renderDetailsTab()}
        {!isUserView && activeTab === 'maintenance' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">Wartungshistorie</h3>
            <form onSubmit={editingRecord ? handleUpdate : handleMaintenanceSubmit} className="mb-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Beschreibung der Wartung
                    <textarea
                      placeholder="z.B. Ölwechsel durchgeführt, Bremsbeläge erneuert..."
                      value={newMaintenance.beschreibung}
                      onChange={e => setNewMaintenance({...newMaintenance, beschreibung: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows="3"
                      required
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Kosten (in €)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="z.B. 299.99"
                      value={newMaintenance.kosten}
                      onChange={e => setNewMaintenance({...newMaintenance, kosten: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Aktueller Kilometerstand
                    <input
                      type="number"
                      min="0"
                      placeholder="z.B. 45000"
                      value={newMaintenance.kilometerstand}
                      onChange={e => setNewMaintenance({...newMaintenance, kilometerstand: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-500">Bitte den kompletten Kilometerstand eingeben</span>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Eingetragen von / Verantwortlicher
                    <input
                      type="text"
                      placeholder="z.B. Werkstatt Müller oder Max Mustermann"
                      value={newMaintenance.durchgefuehrt_von}
                      onChange={e => setNewMaintenance({...newMaintenance, durchgefuehrt_von: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Art der Wartung
                    <select
                      value={newMaintenance.art_der_wartung}
                      onChange={e => setNewMaintenance({...newMaintenance, art_der_wartung: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="Routinewartung">Routinewartung (z.B. Inspektion)</option>
                      <option value="Reparatur">Reparatur (z.B. defekte Teile)</option>
                      <option value="Inspektion">Inspektion (TÜV/AU)</option>
                      <option value="Reifenwechsel">Reifenwechsel</option>
                      <option value="Sonstiges">Sonstiges</option>
                    </select>
                  </label>
                </div>
              </div>

              <button 
                type="submit" 
                className={`w-full px-4 py-2 rounded transition-colors ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Wird gespeichert...
                  </span>
                ) : (
                  editingRecord ? 'Wartungseintrag aktualisieren' : 'Wartungseintrag hinzufügen'
                )}
              </button>
              {editingRecord && (
                <button 
                  type="button"
                  onClick={() => {
                    setEditingRecord(null);
                    setNewMaintenance({
                      beschreibung: '',
                      kosten: 0,
                      kilometerstand: 0,
                      durchgefuehrt_von: '',
                      art_der_wartung: 'Routinewartung'
                    });
                  }}
                  className="w-full mt-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Bearbeitung abbrechen
                </button>
              )}
            </form>

            <div className="space-y-4">
              {maintenanceHistory.length === 0 ? (
                <p className="text-gray-500 text-center italic">Noch keine Wartungseinträge vorhanden</p>
              ) : (
                maintenanceHistory.map(record => (
                  <div key={record.id} className="border p-4 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold">{record.art_der_wartung}</span>
                        <span className="ml-4 text-gray-500">{new Date(record.datum).toLocaleDateString('de-DE')}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(record)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(record.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="mt-2">{record.beschreibung}</p>
                    <div className="text-sm text-gray-600 mt-2 space-y-1">
                      <p>Kosten: {record.kosten.toFixed(2)}€</p>
                      <p>Kilometerstand: {record.kilometerstand.toLocaleString('de-DE')} km</p>
                      <p>Durchgeführt von: {record.durchgefuehrt_von || 'Nicht angegeben'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {!isUserView && activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Fahrzeugdokumente</h3>
              <div>
                <input
                  type="file"
                  onChange={handleDocumentUpload}
                  className="hidden"
                  id="document-upload"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <label
                  htmlFor="document-upload"
                  className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600"
                >
                  Dokument hochladen
                </label>
              </div>
            </div>
            
            {documents.length === 0 ? (
              <p className="text-gray-500 text-center italic">Keine Dokumente vorhanden</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {documents.map(doc => (
                  <div key={doc.id} className="border p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-gray-500">
                        Hochgeladen am: {new Date(doc.upload_date).toLocaleDateString()}
                      </p>
                    </div>
                    <a
                      href={`http://localhost:5000${doc.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Öffnen
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {!isUserView && activeTab === 'damage' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Schadensmeldungen</h3>
              <button
                onClick={() => setShowDamageReport(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Neuer Schaden
              </button>
            </div>
            
            {damageReports.length === 0 ? (
              <p className="text-gray-500 text-center italic">Keine Schadensmeldungen vorhanden</p>
            ) : (
              <div className="space-y-4">
                {damageReports.map(report => (
                  <div key={report.id} className="border p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span className="font-medium">Datum: {new Date(report.date).toLocaleDateString()}</span>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditDamageReport(report)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteDamageReport(report.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      report.status === 'Gemeldet' ? 'bg-red-100 text-red-800' :
                      report.status === 'In Bearbeitung' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {report.status}
                    </span>
                    <p className="mt-2">{report.description}</p>
                    {report.images && report.images.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {report.images.map((image, index) => (
                          <img 
                            key={index}
                            src={`http://localhost:5000${image}`}
                            alt={`Schaden ${index + 1}`}
                            className="w-24 h-24 object-cover rounded cursor-pointer"
                            onClick={() => setShowImageModal(image)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {!isUserView && activeTab === 'fuel' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Tankprotokoll</h3>
              <button
                onClick={() => setShowFuelLog(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Neuer Eintrag
              </button>
            </div>
            
            {fuelLogs.length === 0 ? (
              <p className="text-gray-500 text-center italic">Keine Tankeinträge vorhanden</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Menge (L)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">€/Liter</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gesamt €</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kilometerstand</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kraftstoff</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fuelLogs.map(log => (
                      <tr key={log.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{new Date(log.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{log.amount_liters.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{log.cost_per_liter.toFixed(3)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{log.total_cost.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{log.mileage.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{log.fuel_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleEditFuelLog(log)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleDeleteFuelLog(log.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {activeTab === 'calendar' && (
          <div className="bg-white p-6 rounded-md shadow-md">
            <h3 className="text-xl font-semibold mb-4">Fahrzeugbuchungen</h3>
            <VehicleCalendar bookings={bookings} />
          </div>
        )}
      </div>

      {showDamageReport && (
        <DamageReport
          vehicleId={vehicleId}
          onClose={() => {
            setShowDamageReport(false);
            setEditingDamageReport(null);
          }}
          onDamageReported={() => {
            fetchVehicleDetails();
            setEditingDamageReport(null);
          }}
          editingReport={editingDamageReport}
          currentMileage={vehicleData.kilometerstand}
        />
      )}

      {showFuelLog && (
        <FuelLog
          vehicleId={vehicleId}
          onClose={() => {
            setShowFuelLog(false);
            setEditingFuelLog(null);
          }}
          onFuelLogged={() => {
            fetchVehicleDetails();
            setEditingFuelLog(null);
          }}
          editingLog={editingFuelLog}
          currentMileage={vehicleData.kilometerstand}
        />
      )}

      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setShowImageModal(null)}
        >
          <div className="max-w-4xl max-h-[90vh]">
            <img
              src={`http://localhost:5000${showImageModal}`}
              alt="Vergrößertes Schadensbild"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleDetail; 