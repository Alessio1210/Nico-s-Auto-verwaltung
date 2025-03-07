import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    modell: '',
    kennzeichen: ''
  });

  // Fahrzeuge laden
  const fetchVehicles = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/vehicles');
      setVehicles(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Fehler beim Laden der Fahrzeuge:', error);
      setError('Fehler beim Laden der Fahrzeuge');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Neues Fahrzeug hinzufügen
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/fahrzeug', newVehicle);
      setVehicles([...vehicles, response.data]);
      setNewVehicle({ modell: '', kennzeichen: '' });
      setShowAddForm(false);
      alert('Fahrzeug erfolgreich hinzugefügt!');
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Fahrzeugs:', error);
      alert('Fehler beim Hinzufügen des Fahrzeugs');
    }
  };

  // Fahrzeug löschen
  const handleDeleteVehicle = async (id) => {
    if (window.confirm('Möchten Sie dieses Fahrzeug wirklich löschen?')) {
      try {
        await axios.delete(`http://localhost:5000/api/vehicles/${id}`);
        setVehicles(vehicles.filter(vehicle => vehicle.id !== id));
        alert('Fahrzeug erfolgreich gelöscht!');
      } catch (error) {
        console.error('Fehler beim Löschen des Fahrzeugs:', error);
        alert('Fehler beim Löschen des Fahrzeugs');
      }
    }
  };

  // Eingabeänderungen im Formular verarbeiten
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewVehicle({ ...newVehicle, [name]: value });
  };

  return (
    <div className="p-4 relative">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Fahrzeuge</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          >
            + Fahrzeug hinzufügen
          </button>
          <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
            Export CSV
          </button>
        </div>
      </div>

      {/* Suchleiste */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Suche nach Modell oder Kennzeichen..."
          className="w-full px-4 py-2 border rounded-md"
        />
      </div>

      {/* Modal zum Hinzufügen eines Fahrzeugs */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Neues Fahrzeug hinzufügen</h2>
            <form onSubmit={handleAddVehicle}>
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
              <div className="mb-6">
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
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fahrzeugliste */}
      {loading ? (
        <p>Lade Fahrzeuge...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : vehicles.length === 0 ? (
        <p>Keine Fahrzeuge gefunden.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className="bg-white p-4 rounded-lg shadow-md">
              {vehicle.image_url ? (
                <img src={vehicle.image_url} alt={vehicle.modell} className="w-full h-40 object-cover rounded-md mb-2" />
              ) : (
                <div className="w-full h-40 bg-gray-200 rounded-md mb-2 flex items-center justify-center">
                  <span className="text-gray-500">Kein Bild</span>
                </div>
              )}
              <h2 className="text-xl font-bold">{vehicle.modell}</h2>
              <p className="text-gray-700">{vehicle.kennzeichen}</p>
              <div className="mt-4 flex justify-between">
                <span className={`px-2 py-1 rounded ${vehicle.status === 'verfügbar' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {vehicle.status || 'verfügbar'}
                </span>
                <button
                  onClick={() => handleDeleteVehicle(vehicle.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Vehicles; 