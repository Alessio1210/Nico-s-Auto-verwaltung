import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  CalendarIcon,
  TruckIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline';

function UserRequests({ setActiveView, user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [filteredRequests, setFilteredRequests] = useState([]);

  // Laden der Benutzeranfragen aus dem localStorage
  useEffect(() => {
    setLoading(true);

    // Warte eine kurze Zeit, um das Laden zu simulieren
    setTimeout(() => {
      try {
        // Lade Anfragen aus dem localStorage
        const savedRequests = localStorage.getItem('vehicleRequests');
        let userRequests = [];
        
        if (savedRequests) {
          const allRequests = JSON.parse(savedRequests);
          
          // Filtere die Anfragen nach der Benutzer-ID, wenn ein Benutzer angemeldet ist
          if (user && user.id) {
            userRequests = allRequests.filter(request => 
              request.userId === user.id.toString() || 
              request.userId === user.id
            );
            console.log(`Anfragen für Benutzer ${user.name} (ID: ${user.id}):`, userRequests);
          } else {
            userRequests = allRequests;
            console.log("Kein Benutzer angemeldet oder keine Benutzer-ID vorhanden. Zeige alle Anfragen.");
          }

          // Sortiere nach Datum (neueste zuerst)
          userRequests.sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
          });
          
          console.log("Geladene Benutzeranfragen:", userRequests);
        }
        
        setRequests(userRequests);
        setFilteredRequests(userRequests);
      } catch (err) {
        console.error("Fehler beim Laden der Benutzeranfragen:", err);
        setRequests([]);
        setFilteredRequests([]);
      } finally {
        setLoading(false);
      }
    }, 500);
  }, [user]);

  // Filtern der Anfragen nach Status
  useEffect(() => {
    if (filter === 'all') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter(request => {
        // Konvertiere den Status in das entsprechende Format
        let status = request.status;
        if (status === 'Ausstehend') status = 'pending';
        if (status === 'Genehmigt') status = 'approved';
        if (status === 'Abgelehnt') status = 'rejected';
        
        return status === filter;
      }));
    }
  }, [filter, requests]);

  // Hilfsfunktion zur Formatierung von Datum/Zeit
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
  };

  // Hilfsfunktion für die Anzeige des Status mit entsprechender Farbe
  const getStatusBadge = (status) => {
    // Konvertiere Statusbegriffe in einheitliches Format
    let normalizedStatus = status.toLowerCase();
    if (normalizedStatus === 'ausstehend') normalizedStatus = 'pending';
    if (normalizedStatus === 'genehmigt') normalizedStatus = 'approved';
    if (normalizedStatus === 'abgelehnt') normalizedStatus = 'rejected';
    
    switch(normalizedStatus) {
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

  // Hilfsfunktion zum Navigieren zur Fahrzeugansicht
  const goToVehicles = () => {
    if (setActiveView) {
      setActiveView('vehicles');
    }
  };

  // Rendert Detailansicht einer Anfrage
  const renderRequestDetail = () => {
    if (!selectedRequest) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-start pt-20">
        <div className="relative mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white max-h-80vh overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Anfrage Details</h2>
            <button 
              onClick={() => setSelectedRequest(null)} 
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <TruckIcon className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <p className="font-semibold text-lg">{selectedRequest.vehicleModel}</p>
                <p className="text-gray-600">{selectedRequest.licensePlate}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <p className="font-medium">Zeitraum:</p>
                <p>Von: {formatDate(selectedRequest.startDate)}</p>
                <p>Bis: {formatDate(selectedRequest.endDate)}</p>
              </div>
            </div>
            
            <div>
              <p className="font-medium">Verwendungszweck:</p>
              <p className="text-gray-700">{selectedRequest.purpose}</p>
            </div>
            
            <div>
              <p className="font-medium">Status:</p>
              <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
            </div>
            
            {selectedRequest.responseNote && (
              <div>
                <p className="font-medium">Anmerkung vom Administrator:</p>
                <p className="text-gray-700 italic">{selectedRequest.responseNote}</p>
              </div>
            )}
            
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">Anfrage erstellt am: {formatDate(selectedRequest.timestamp)}</p>
              {selectedRequest.responseDate && (
                <p className="text-sm text-gray-500">Beantwortet am: {formatDate(selectedRequest.responseDate)}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Meine Fahrzeuganfragen</h2>
        
        {/* Button zum Erstellen einer neuen Anfrage */}
        <button
          onClick={goToVehicles}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Neue Anfrage
        </button>
      </div>
      
      {/* Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'all' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Alle
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'pending' 
              ? 'bg-yellow-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Ausstehend
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'approved' 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Genehmigt
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'rejected' 
              ? 'bg-red-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Abgelehnt
        </button>
      </div>
      
      {/* Anfragenliste */}
      {loading ? (
        <div className="w-full flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">Keine Anfragen gefunden.</p>
          <p className="text-gray-400 mt-2">
            Sie können neue Anfragen über die Fahrzeugübersicht erstellen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map(request => (
            <div 
              key={request.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedRequest(request)}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold">{request.vehicleModel}</h3>
                  {getStatusBadge(request.status)}
                </div>
                
                <p className="text-gray-500 text-sm mb-2">{request.licensePlate}</p>
                
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span>{formatDate(request.startDate)} - {formatDate(request.endDate)}</span>
                </div>
                
                <p className="text-gray-700 line-clamp-2">{request.purpose}</p>
                
                <p className="text-right text-xs text-gray-400 mt-3">
                  Erstellt am: {formatDate(request.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Detail-Modal */}
      {renderRequestDetail()}
    </div>
  );
}

export default UserRequests; 