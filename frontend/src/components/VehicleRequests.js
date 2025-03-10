import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  CalendarIcon, 
  ClockIcon,
  UserIcon,
  MapPinIcon,
  DocumentTextIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

function VehicleRequests() {
  // Anfragen und Filter
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [loading, setLoading] = useState(true);
  
  // Archiv-Funktionalität
  const [archivedRequests, setArchivedRequests] = useState([]);
  const [showArchive, setShowArchive] = useState(false);
  
  // Detailansicht für eine ausgewählte Anfrage
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // State für Umplanung
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    note: ''
  });

  // Laden von Anfragen aus dem localStorage und kombinieren mit Dummy-Daten
  useEffect(() => {
    // Simuliere Ladezeit
    setTimeout(() => {
      // Standard-Anfragen (werden immer angezeigt)
      const dummyRequests = [
        {
          id: 1,
          userId: 101,
          userName: 'Max Mustermann',
          userDepartment: 'IT',
          vehicleId: 1,
          vehicleModel: 'BMW M1',
          vehicleLicensePlate: 'M-BW 1234',
          startDateTime: '2025-03-15T08:00:00',
          endDateTime: '2025-03-15T17:00:00',
          purpose: 'Kundenbesuch in Stuttgart',
          destination: 'Stuttgart',
          passengers: 2,
          notes: 'Benötige Zugang zur Tiefgarage',
          status: 'pending',
          requestDate: '2025-03-01T10:30:00',
          responseDate: null,
          responseNote: null
        },
        {
          id: 2,
          userId: 102,
          userName: 'Anna Schmidt',
          userDepartment: 'Marketing',
          vehicleId: 2,
          vehicleModel: 'VW Polo',
          vehicleLicensePlate: 'M-VW 5678',
          startDateTime: '2025-03-20T09:00:00',
          endDateTime: '2025-03-20T16:00:00',
          purpose: 'Messe-Besuch',
          destination: 'München',
          passengers: 3,
          notes: 'Benötige zusätzlich Parkgenehmigung',
          status: 'approved',
          requestDate: '2025-03-02T14:15:00',
          responseDate: '2025-03-03T09:30:00',
          responseNote: 'Parkgenehmigung liegt im Handschuhfach'
        },
        {
          id: 3,
          userId: 103,
          userName: 'Tim Meyer',
          userDepartment: 'Vertrieb',
          vehicleId: 3,
          vehicleModel: 'Audi RS5',
          vehicleLicensePlate: 'M-AU 9012',
          startDateTime: '2025-03-18T07:30:00',
          endDateTime: '2025-03-18T19:00:00',
          purpose: 'Kundenbesuche im Außendienst',
          destination: 'Nürnberg',
          passengers: 1,
          notes: '',
          status: 'rejected',
          requestDate: '2025-03-02T16:45:00',
          responseDate: '2025-03-04T11:20:00',
          responseNote: 'Fahrzeug an diesem Tag bereits reserviert. Bitte wählen Sie ein anderes Fahrzeug oder einen anderen Tag.'
        },
        {
          id: 4,
          userId: 104,
          userName: 'Laura Müller',
          userDepartment: 'Produktion',
          vehicleId: 4,
          vehicleModel: 'Mercedes GLE',
          vehicleLicensePlate: 'M-MB 3456',
          startDateTime: '2025-03-25T10:00:00',
          endDateTime: '2025-03-25T18:30:00',
          purpose: 'Transport von Materialien',
          destination: 'Augsburg',
          passengers: 2,
          notes: 'Benötige den größeren Kofferraum',
          status: 'pending',
          requestDate: '2025-03-05T08:10:00',
          responseDate: null,
          responseNote: null
        }
      ];
      
      // Versuche, zusätzliche Anfragen aus dem localStorage zu laden
      let userRequests = [];
      try {
        const savedRequests = localStorage.getItem('vehicleRequests');
        if (savedRequests) {
          const parsedRequests = JSON.parse(savedRequests);
          console.log("Geladene Benutzeranfragen aus localStorage:", parsedRequests);
          
          // Lade die gespeicherten Status aus approvedRequests und rejectedRequests
          const approvedRequestIds = JSON.parse(localStorage.getItem('approvedRequests') || '[]');
          const rejectedRequestIds = JSON.parse(localStorage.getItem('rejectedRequests') || '[]');
          
          console.log("Gespeicherte genehmigte Anfragen:", approvedRequestIds);
          console.log("Gespeicherte abgelehnte Anfragen:", rejectedRequestIds);
          
          // Konvertiere die Anfragen in das Format, das vom Admin erwartet wird
          userRequests = parsedRequests.map(req => {
            // Konvertiere das Format, falls notwendig
            const startDateTime = req.startDateTime || `${req.startDate}T08:00:00`;
            const endDateTime = req.endDateTime || `${req.endDate}T17:00:00`;
            
            // Status-Mapping
            let status = req.status;
            if (status === 'Ausstehend') status = 'pending';
            if (status === 'Genehmigt') status = 'approved';
            if (status === 'Abgelehnt') status = 'rejected';
            
            // Überschreibe den Status basierend auf den gespeicherten Status-IDs
            if (approvedRequestIds.includes(req.id)) {
              status = 'approved';
              console.log(`Anfrage ${req.id} ist als genehmigt gespeichert und wird entsprechend angezeigt.`);
            } else if (rejectedRequestIds.includes(req.id)) {
              status = 'rejected';
              console.log(`Anfrage ${req.id} ist als abgelehnt gespeichert und wird entsprechend angezeigt.`);
            }
            
            return {
              id: req.id,
              userId: req.userId || 999,
              userName: req.userName || 'Benutzer',
              userDepartment: req.userDepartment || 'Allgemein',
              vehicleId: req.vehicleId,
              vehicleModel: req.vehicleModel,
              vehicleLicensePlate: req.licensePlate || req.vehicleLicensePlate,
              startDateTime: startDateTime,
              endDateTime: endDateTime,
              purpose: req.purpose,
              destination: req.destination || 'Nicht angegeben',
              passengers: req.passengers || 1,
              notes: req.notes || '',
              status: status,
              requestDate: req.timestamp || new Date().toISOString(),
              responseDate: req.responseDate || null,
              responseNote: req.responseNote || null
            };
          });
          
          console.log("Konvertierte Benutzeranfragen für Admin:", userRequests);
        }
      } catch (err) {
        console.error("Fehler beim Laden der Benutzeranfragen:", err);
      }
      
      // Kombiniere die Standard-Anfragen mit den Benutzeranfragen
      const allRequests = [...dummyRequests, ...userRequests];
      
      // Gib Feedback in der Konsole, wenn Benutzeranfragen gefunden wurden
      if (userRequests.length > 0) {
        console.log(`${userRequests.length} Benutzeranfragen wurden geladen und mit den Demo-Anfragen kombiniert.`);
      }
      
      // Teile die Anfragen in aktuelle und archivierte auf
      const current = [];
      const archived = [];
      
      allRequests.forEach(request => {
        if (shouldBeArchived(request)) {
          archived.push(request);
        } else {
          current.push(request);
        }
      });
      
      // Sortiere die Anfragen nach Datum (neueste zuerst)
      current.sort((a, b) => new Date(b.startDateTime) - new Date(a.startDateTime));
      archived.sort((a, b) => new Date(b.startDateTime) - new Date(a.startDateTime));
      
      console.log(`${current.length} aktuelle Anfragen und ${archived.length} archivierte Anfragen.`);
      
      setRequests(current);
      setArchivedRequests(archived);
      setFilteredRequests(current); // Standardmäßig zeige aktuelle Anfragen
      setLoading(false);
    }, 1000);
  }, []);

  // Filtern der Anfragen nach Status
  useEffect(() => {
    if (filter === 'all') {
      setFilteredRequests(showArchive ? archivedRequests : requests.filter(req => !shouldBeArchived(req)));
    } else {
      const filteredByStatus = requests.filter(request => request.status === filter);
      setFilteredRequests(showArchive 
        ? archivedRequests.filter(request => request.status === filter)
        : filteredByStatus.filter(req => !shouldBeArchived(req)));
    }
  }, [filter, requests, archivedRequests, showArchive]);

  // Prüfen, ob eine Anfrage archiviert werden sollte
  const shouldBeArchived = (request) => {
    const now = new Date();
    const endDate = new Date(request.endDateTime);
    
    // Nur Anfragen archivieren, deren Enddatum in der Vergangenheit liegt (abgeschlossene Termine)
    if (endDate < now) {
      return true;
    }
    
    return false;
  };

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

  // Hilfsfunktion für die Anzeige des Status mit entsprechender Farbe
  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Genehmigt
          </span>
        );
      case 'rejected':
        return (
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <XCircleIcon className="h-4 w-4 mr-1" />
            Abgelehnt
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            Ausstehend
          </span>
        );
    }
  };

  // Handler für die Genehmigung einer Anfrage
  const handleApprove = (requestId, note = '') => {
    // In einer echten Anwendung: API-Aufruf zur Genehmigung der Anfrage
    // Dieser Teil würde normalerweise den API-Aufruf implementieren
    
    // Speichere die genehmigte Anfrage in einer separaten Variable im localStorage
    try {
      // Speichere die ID in der Liste der genehmigten Anfragen
      const approvedRequests = JSON.parse(localStorage.getItem('approvedRequests') || '[]');
      if (!approvedRequests.includes(requestId)) {
        approvedRequests.push(requestId);
        localStorage.setItem('approvedRequests', JSON.stringify(approvedRequests));
      }
      
      // Entferne die ID aus der Liste der abgelehnten Anfragen, falls vorhanden
      const rejectedRequests = JSON.parse(localStorage.getItem('rejectedRequests') || '[]');
      const updatedRejectedRequests = rejectedRequests.filter(id => id !== requestId);
      localStorage.setItem('rejectedRequests', JSON.stringify(updatedRejectedRequests));
      
      // Aktualisiere den localStorage, falls die Anfrage dort gespeichert ist
      const savedRequests = localStorage.getItem('vehicleRequests');
      if (savedRequests) {
        let userRequests = JSON.parse(savedRequests);
        const requestIndex = userRequests.findIndex(req => req.id.toString() === requestId.toString());
        
        if (requestIndex !== -1) {
          userRequests[requestIndex] = {
            ...userRequests[requestIndex],
            status: 'approved',
            responseDate: new Date().toISOString(),
            responseNote: note || null
          };
          
          // Speichere die Änderungen im localStorage
          localStorage.setItem('vehicleRequests', JSON.stringify(userRequests));
          console.log("Anfrage im localStorage aktualisiert (genehmigt):", requestId);
        }
      }
      
      // Bestimme, ob die Anfrage in den aktuellen oder archivierten Anfragen ist
      const isInCurrentRequests = requests.some(req => req.id === requestId);
      const isInArchivedRequests = archivedRequests.some(req => req.id === requestId);
      
      // Aktualisiere den entsprechenden State
      if (isInCurrentRequests) {
        const updatedRequests = requests.map(req => 
          req.id === requestId 
            ? {
                ...req, 
                status: 'approved', 
                responseDate: new Date().toISOString(),
                responseNote: note || null
              } 
            : req
        );
        
        setRequests(updatedRequests);
        
        // Filterliste aktualisieren, wenn aktuelle Anfragen angezeigt werden
        if (!showArchive) {
          if (filter === 'all') {
            setFilteredRequests(updatedRequests);
          } else {
            setFilteredRequests(updatedRequests.filter(request => request.status === filter));
          }
        }
      }
      
      if (isInArchivedRequests) {
        const updatedArchived = archivedRequests.map(req => 
          req.id === requestId 
            ? {
                ...req, 
                status: 'approved', 
                responseDate: new Date().toISOString(),
                responseNote: note || null
              } 
            : req
        );
        
        setArchivedRequests(updatedArchived);
        
        // Filterliste aktualisieren, wenn archivierte Anfragen angezeigt werden
        if (showArchive) {
          if (filter === 'all') {
            setFilteredRequests(updatedArchived);
          } else {
            setFilteredRequests(updatedArchived.filter(request => request.status === filter));
          }
        }
      }
      
      // Schließen der Detailansicht, falls geöffnet
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
      }
      
    } catch (err) {
      console.error("Fehler beim Aktualisieren des localStorage:", err);
      alert("Es ist ein Fehler beim Speichern der Genehmigung aufgetreten. Bitte versuchen Sie es erneut.");
    }
  };

  // Handler für die Ablehnung einer Anfrage
  const handleReject = (requestId, note = '') => {
    // In einer echten Anwendung: API-Aufruf zur Ablehnung der Anfrage
    // Dieser Teil würde normalerweise den API-Aufruf implementieren
    
    // Speichere die abgelehnte Anfrage in einer separaten Variable im localStorage
    try {
      // Speichere die ID in der Liste der abgelehnten Anfragen
      const rejectedRequests = JSON.parse(localStorage.getItem('rejectedRequests') || '[]');
      if (!rejectedRequests.includes(requestId)) {
        rejectedRequests.push(requestId);
        localStorage.setItem('rejectedRequests', JSON.stringify(rejectedRequests));
      }
      
      // Entferne die ID aus der Liste der genehmigten Anfragen, falls vorhanden
      const approvedRequests = JSON.parse(localStorage.getItem('approvedRequests') || '[]');
      const updatedApprovedRequests = approvedRequests.filter(id => id !== requestId);
      localStorage.setItem('approvedRequests', JSON.stringify(updatedApprovedRequests));
      
      // Aktualisiere den localStorage, falls die Anfrage dort gespeichert ist
      const savedRequests = localStorage.getItem('vehicleRequests');
      if (savedRequests) {
        let userRequests = JSON.parse(savedRequests);
        const requestIndex = userRequests.findIndex(req => req.id.toString() === requestId.toString());
        
        if (requestIndex !== -1) {
          userRequests[requestIndex] = {
            ...userRequests[requestIndex],
            status: 'rejected',
            responseDate: new Date().toISOString(),
            responseNote: note || 'Anfrage abgelehnt'
          };
          
          // Speichere die Änderungen im localStorage
          localStorage.setItem('vehicleRequests', JSON.stringify(userRequests));
          console.log("Anfrage im localStorage aktualisiert (abgelehnt):", requestId);
        }
      }
      
      // Bestimme, ob die Anfrage in den aktuellen oder archivierten Anfragen ist
      const isInCurrentRequests = requests.some(req => req.id === requestId);
      const isInArchivedRequests = archivedRequests.some(req => req.id === requestId);
      
      // Aktualisiere den entsprechenden State
      if (isInCurrentRequests) {
        const updatedRequests = requests.map(req => 
          req.id === requestId 
            ? {
                ...req, 
                status: 'rejected', 
                responseDate: new Date().toISOString(),
                responseNote: note || 'Anfrage abgelehnt'
              } 
            : req
        );
        
        setRequests(updatedRequests);
        
        // Filterliste aktualisieren, wenn aktuelle Anfragen angezeigt werden
        if (!showArchive) {
          if (filter === 'all') {
            setFilteredRequests(updatedRequests);
          } else {
            setFilteredRequests(updatedRequests.filter(request => request.status === filter));
          }
        }
      }
      
      if (isInArchivedRequests) {
        const updatedArchived = archivedRequests.map(req => 
          req.id === requestId 
            ? {
                ...req, 
                status: 'rejected', 
                responseDate: new Date().toISOString(),
                responseNote: note || 'Anfrage abgelehnt'
              } 
            : req
        );
        
        setArchivedRequests(updatedArchived);
        
        // Filterliste aktualisieren, wenn archivierte Anfragen angezeigt werden
        if (showArchive) {
          if (filter === 'all') {
            setFilteredRequests(updatedArchived);
          } else {
            setFilteredRequests(updatedArchived.filter(request => request.status === filter));
          }
        }
      }
      
      // Schließen der Detailansicht, falls geöffnet
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
      }
      
    } catch (err) {
      console.error("Fehler beim Aktualisieren des localStorage:", err);
      alert("Es ist ein Fehler beim Speichern der Ablehnung aufgetreten. Bitte versuchen Sie es erneut.");
    }
  };

  // Handler für die Umplanung einer Anfrage
  const handleReschedule = (requestId) => {
    const request = requests.find(req => req.id === requestId);
    if (!request) return;
    
    // Initialisieren der Umplanungsdaten mit aktuellen Werten
    const startDateTime = new Date(request.startDateTime);
    const endDateTime = new Date(request.endDateTime);
    
    setRescheduleData({
      startDate: startDateTime.toISOString().split('T')[0],
      startTime: startDateTime.toTimeString().substring(0, 5),
      endDate: endDateTime.toISOString().split('T')[0],
      endTime: endDateTime.toTimeString().substring(0, 5),
      note: ''
    });
    
    setIsRescheduling(true);
  };

  // Handler für das Absenden der Umplanung
  const submitReschedule = () => {
    if (!selectedRequest) return;
    
    // Erstellen von DateTime-Strings aus Datum und Zeit
    const startDateTime = new Date(`${rescheduleData.startDate}T${rescheduleData.startTime}`).toISOString();
    const endDateTime = new Date(`${rescheduleData.endDate}T${rescheduleData.endTime}`).toISOString();
    
    // In einer echten Anwendung: API-Aufruf zur Umplanung der Anfrage
    const updatedRequests = requests.map(req => 
      req.id === selectedRequest.id 
        ? {
            ...req, 
            startDateTime,
            endDateTime,
            status: 'approved',
            responseDate: new Date().toISOString(),
            responseNote: rescheduleData.note || 'Termin wurde umgeplant.'
          } 
        : req
    );
    
    setRequests(updatedRequests);
    
    // Filterliste aktualisieren
    if (filter === 'all') {
      setFilteredRequests(updatedRequests);
    } else {
      setFilteredRequests(updatedRequests.filter(request => request.status === filter));
    }
    
    // Aktualisiere auch den localStorage, falls die Anfrage dort gespeichert ist
    try {
      const savedRequests = localStorage.getItem('vehicleRequests');
      if (savedRequests) {
        let userRequests = JSON.parse(savedRequests);
        const requestIndex = userRequests.findIndex(req => req.id === selectedRequest.id);
        
        if (requestIndex !== -1) {
          userRequests[requestIndex] = {
            ...userRequests[requestIndex],
            startDateTime,
            endDateTime,
            status: 'approved',
            responseDate: new Date().toISOString(),
            responseNote: rescheduleData.note || 'Termin wurde umgeplant.'
          };
          
          localStorage.setItem('vehicleRequests', JSON.stringify(userRequests));
          console.log("Benutzeranfrage im localStorage aktualisiert:", selectedRequest.id);
        }
      }
    } catch (err) {
      console.error("Fehler beim Aktualisieren des localStorage:", err);
    }
    
    // Zurücksetzen der Umplanungsdaten und Schließen des Dialogs
    setIsRescheduling(false);
    setRescheduleData({
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      note: ''
    });
    setSelectedRequest(null);
  };
  
  // Handler für Änderungen in den Umplanungsfeldern
  const handleRescheduleChange = (e) => {
    const { name, value } = e.target;
    setRescheduleData({
      ...rescheduleData,
      [name]: value
    });
  };

  // Wenn Daten geladen werden
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Lade Anfragen...</span>
      </div>
    );
  }

  // Render für Umplanungsdialog
  if (isRescheduling && selectedRequest) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Anfrage umplanen</h2>
          <button 
            onClick={() => setIsRescheduling(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-800">
              Anfrage von {selectedRequest.userName} für {selectedRequest.vehicleModel}
            </h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Startdatum und -zeit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Startdatum
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={rescheduleData.startDate}
                  onChange={handleRescheduleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Startzeit
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={rescheduleData.startTime}
                  onChange={handleRescheduleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Enddatum und -zeit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enddatum
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={rescheduleData.endDate}
                  onChange={handleRescheduleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endzeit
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={rescheduleData.endTime}
                  onChange={handleRescheduleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Notiz */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notiz für den Benutzer
              </label>
              <textarea
                name="note"
                value={rescheduleData.note}
                onChange={handleRescheduleChange}
                rows="3"
                placeholder="Informationen zur Umplanung..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsRescheduling(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={submitReschedule}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Änderungen speichern
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render für Detailansicht einer ausgewählten Anfrage
  if (selectedRequest) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Anfrage Details</h2>
          <button 
            onClick={() => setSelectedRequest(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="p-6 bg-gray-50 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Fahrzeuganfrage #{selectedRequest.id}
              </h3>
              <div>
                {getStatusBadge(selectedRequest.status)}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Benutzerinformationen */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Benutzer</h4>
              <div className="flex items-start">
                <UserIcon className="h-5 w-5 mr-2 text-gray-400" />
                <div>
                  <p className="font-medium">{selectedRequest.userName}</p>
                  <p className="text-sm text-gray-500">{selectedRequest.userDepartment}</p>
                </div>
              </div>
            </div>
            
            {/* Fahrzeuginformationen */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Fahrzeug</h4>
              <div className="flex items-start">
                <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
                <div>
                  <p className="font-medium">{selectedRequest.vehicleModel}</p>
                  <p className="text-sm text-gray-500">{selectedRequest.vehicleLicensePlate}</p>
                </div>
              </div>
            </div>
            
            {/* Zeitraum */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Zeitraum</h4>
              <div className="flex items-start">
                <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
                <div>
                  <p className="font-medium">Von: {formatDateTime(selectedRequest.startDateTime)}</p>
                  <p className="font-medium">Bis: {formatDateTime(selectedRequest.endDateTime)}</p>
                </div>
              </div>
            </div>
            
            {/* Zweck und Ziel */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Zweck</h4>
                <div className="flex items-start">
                  <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-400" />
                  <p>{selectedRequest.purpose}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Zielort</h4>
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
                  <p>{selectedRequest.destination}</p>
                </div>
              </div>
            </div>
            
            {/* Zusätzliche Informationen */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Zusätzliche Informationen</h4>
              <div className="flex items-start">
                <UserIcon className="h-5 w-5 mr-2 text-gray-400" />
                <div>
                  <p className="mb-1">Anzahl Personen: {selectedRequest.passengers}</p>
                  {selectedRequest.notes && (
                    <p className="text-gray-700">{selectedRequest.notes}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Antwort, falls vorhanden */}
            {selectedRequest.responseDate && (
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Antwort</h4>
                <p className="text-sm text-gray-600">Beantwortet am {formatDateTime(selectedRequest.responseDate)}</p>
                {selectedRequest.responseNote && (
                  <p className="mt-2">{selectedRequest.responseNote}</p>
                )}
              </div>
            )}
          </div>
          
          {/* Actions */}
          {selectedRequest.status === 'pending' && (
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
              <button
                onClick={() => handleReject(selectedRequest.id, 'Anfrage abgelehnt')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                <XCircleIcon className="h-5 w-5 mr-2" />
                Ablehnen
              </button>
              <button
                onClick={() => handleReschedule(selectedRequest.id)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700"
              >
                <PencilSquareIcon className="h-5 w-5 mr-2" />
                Umplanen
              </button>
              <button
                onClick={() => handleApprove(selectedRequest.id, 'Anfrage genehmigt')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Genehmigen
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Standard-Ansicht: Liste der Anfragen
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {showArchive ? "Archivierte Fahrzeuganfragen" : "Aktuelle Fahrzeuganfragen"}
        </h2>
        
        {/* Filter und Archiv-Toggle */}
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md text-sm ${filter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
            >
              Alle
            </button>
            <button 
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-md text-sm ${filter === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}
            >
              Ausstehend
            </button>
            <button 
              onClick={() => setFilter('approved')}
              className={`px-3 py-1 rounded-md text-sm ${filter === 'approved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
            >
              Genehmigt
            </button>
            <button 
              onClick={() => setFilter('rejected')}
              className={`px-3 py-1 rounded-md text-sm ${filter === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}
            >
              Abgelehnt
            </button>
          </div>
          
          {/* Archiv-Toggle */}
          <div className="flex items-center space-x-2 border-l pl-4">
            <button
              onClick={() => setShowArchive(false)}
              className={`px-3 py-1 rounded-md text-sm ${!showArchive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
            >
              Aktuelle
            </button>
            <button
              onClick={() => setShowArchive(true)}
              className={`px-3 py-1 rounded-md text-sm ${showArchive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
            >
              Archivierte
            </button>
          </div>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-500">
            {showArchive 
              ? "Keine archivierten Anfragen gefunden." 
              : "Keine aktuellen Anfragen gefunden."}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Benutzer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fahrzeug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zeitraum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map(request => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{request.userName}</div>
                    <div className="text-sm text-gray-500">{request.userDepartment}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{request.vehicleModel}</div>
                    <div className="text-sm text-gray-500">{request.vehicleLicensePlate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDateTime(request.startDateTime)}</div>
                    <div className="text-sm text-gray-500">bis {formatDateTime(request.endDateTime)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Details
                      </button>
                      
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleReject(request.id, 'Anfrage abgelehnt')}
                            className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                          >
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Ablehnen
                          </button>
                          
                          <button
                            onClick={() => handleApprove(request.id, 'Anfrage genehmigt')}
                            className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Genehmigen
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default VehicleRequests; 