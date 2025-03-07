import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VehicleDetail from './VehicleDetail';

function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    modell: '',
    kennzeichen: '',
    kilometerstand: '',
    tuev_datum: '',
    au_datum: '',
    bild: null
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = () => {
    console.log('Starte Fahrzeug-Abfrage...');
    axios.get('http://localhost:5000/api/vehicles')
      .then(response => {
        console.log('Antwort vom Server:', response);
        
        // Debug-Ausgabe für TÜV und AU Daten
        if (response.data && Array.isArray(response.data)) {
          response.data.forEach(vehicle => {
            console.log(`Fahrzeug ${vehicle.id}: Model=${vehicle.modell}, TÜV=${vehicle.tuev_datum}, AU=${vehicle.au_datum}`);
          });
        }
        
        setVehicles(response.data);
      })
      .catch(error => {
        console.error('Fehler beim Laden der Fahrzeuge:', error);
        if (error.response) {
          console.error('Antwort vom Server:', error.response.data);
        }
      });
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    
    console.log("Formulardaten beim Absenden:", newVehicle);
    
    try {
      // Erstelle FormData für den Bildupload
      const formData = new FormData();
      formData.append('modell', newVehicle.modell);
      formData.append('kennzeichen', newVehicle.kennzeichen);
      formData.append('kilometerstand', newVehicle.kilometerstand || '0');
      
      // Sicherstellen, dass die Datums-Daten korrekt formatiert sind
      if (newVehicle.tuev_datum) {
        console.log("TÜV-Datum vor dem Senden:", newVehicle.tuev_datum);
        formData.append('tuev_datum', newVehicle.tuev_datum);
      }
      
      if (newVehicle.au_datum) {
        console.log("AU-Datum vor dem Senden:", newVehicle.au_datum);
        formData.append('au_datum', newVehicle.au_datum);
      }
      
      if (newVehicle.bild) {
        formData.append('bild', newVehicle.bild);
      }
      
      // FormData-Inhalte für Debug ausgeben
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
      
      const response = await axios.post('http://localhost:5000/fahrzeug', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log("Server-Antwort:", response.data);
      
      setVehicles([...vehicles, response.data]);
      setNewVehicle({ 
        modell: '', 
        kennzeichen: '', 
        kilometerstand: '', 
        tuev_datum: '', 
        au_datum: '', 
        bild: null 
      });
      setShowAddForm(false);
      alert('Fahrzeug erfolgreich hinzugefügt!');
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Fahrzeugs:', error);
      alert('Fehler beim Hinzufügen des Fahrzeugs');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewVehicle({ ...newVehicle, [name]: value });
  };

  const handleFileChange = (e) => {
    setNewVehicle({ ...newVehicle, bild: e.target.files[0] });
  };

  const filteredVehicles = vehicles.filter(vehicle => 
    vehicle.modell.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.kennzeichen.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Fahrzeuge</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            + Fahrzeug hinzufügen
          </button>
          <button 
            onClick={() => window.location.href = 'http://localhost:5000/api/vehicles/export'}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Suche nach Modell oder Kennzeichen..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Modal zum Hinzufügen eines Fahrzeugs */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-90vh overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Neues Fahrzeug hinzufügen</h2>
            <form onSubmit={handleAddVehicle}>
              {/* Bild Upload */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Fahrzeugbild
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Klicken zum Hochladen</span> oder Drag & Drop</p>
                      <p className="text-xs text-gray-500">SVG, PNG, JPG oder GIF</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      name="bild"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                {newVehicle.bild && (
                  <p className="mt-2 text-sm text-gray-600">
                    Ausgewählte Datei: {newVehicle.bild.name}
                  </p>
                )}
              </div>

              {/* Basisinformationen */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="modell">
                  Modell
                </label>
                <input
                  type="text"
                  id="modell"
                  name="modell"
                  value={newVehicle.modell}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="kennzeichen">
                  Kennzeichen
                </label>
                <input
                  type="text"
                  id="kennzeichen"
                  name="kennzeichen"
                  value={newVehicle.kennzeichen}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              {/* Kilometerstand */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="kilometerstand">
                  Kilometerstand
                </label>
                <input
                  type="number"
                  id="kilometerstand"
                  name="kilometerstand"
                  value={newVehicle.kilometerstand}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="z.B. 45000"
                />
              </div>

              {/* TÜV/AU Daten */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tuev_datum">
                  TÜV gültig bis
                </label>
                <input
                  type="date"
                  id="tuev_datum"
                  name="tuev_datum"
                  value={newVehicle.tuev_datum}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="au_datum">
                  AU gültig bis
                </label>
                <input
                  type="date"
                  id="au_datum"
                  name="au_datum"
                  value={newVehicle.au_datum}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map(vehicle => (
          <div 
            key={vehicle.id} 
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => setSelectedVehicle(vehicle.id)}
          >
            <div className="relative pb-48">
              <img 
                src={vehicle.bild || 'https://via.placeholder.com/300x200?text=Kein+Bild'} 
                alt={vehicle.modell}
                className="absolute h-full w-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/300x200?text=Kein+Bild';
                }}
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900">{vehicle.modell}</h3>
              <div className="mt-2 flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{vehicle.kennzeichen}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    vehicle.status === 'verfügbar' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {vehicle.status || 'verfügbar'}
                  </span>
                </div>
                
                {vehicle.kilometerstand !== undefined && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Kilometer:</span> {vehicle.kilometerstand.toLocaleString()} km
                  </div>
                )}
                
                {vehicle.tuev_datum && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">TÜV bis:</span> {new Date(vehicle.tuev_datum).toLocaleDateString('de-DE')}
                  </div>
                )}
                {!vehicle.tuev_datum && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">TÜV:</span> Nicht eingetragen
                  </div>
                )}
                
                {vehicle.au_datum && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">AU bis:</span> {new Date(vehicle.au_datum).toLocaleDateString('de-DE')}
                  </div>
                )}
                {!vehicle.au_datum && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">AU:</span> Nicht eingetragen
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedVehicle && (
        <VehicleDetail 
          vehicleId={selectedVehicle} 
          onClose={() => setSelectedVehicle(null)} 
        />
      )}
    </div>
  );
}

export default VehicleList; 