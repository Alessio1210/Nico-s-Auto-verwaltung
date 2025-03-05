import React, { useState } from 'react';
import axios from 'axios';

function DamageReport({ vehicleId, onClose, onDamageReported, editingReport = null, currentMileage = 0 }) {
  const [description, setDescription] = useState(editingReport?.description || '');
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState(editingReport?.status || 'Gemeldet');
  const [existingImages, setExistingImages] = useState(editingReport?.images || []);
  const [mileage, setMileage] = useState(editingReport?.mileage || currentMileage);
  const [mileageWarning, setMileageWarning] = useState('');

  const validateMileage = (value) => {
    const mileageNum = parseInt(value);
    if (mileageNum < currentMileage && !editingReport) {
      setMileageWarning('Der Kilometerstand kann nicht niedriger als der aktuelle sein');
      return false;
    }
    if (mileageNum > currentMileage + 5000) {
      setMileageWarning('Warnung: Mehr als 5000km seit letztem Eintrag');
    } else {
      setMileageWarning('');
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('description', description);
    formData.append('status', status);
    formData.append('mileage', mileage);
    
    if (editingReport) {
      // Füge die Liste der beibehaltenen Bilder hinzu
      formData.append('existing_images', JSON.stringify(existingImages));
    }
    
    // Füge neue Bilder hinzu
    images.forEach(image => {
      formData.append('images', image);
    });

    try {
      if (editingReport) {
        // Bearbeiten
        await axios.put(
          `http://localhost:5000/api/vehicles/${vehicleId}/damage-reports/${editingReport.id}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      } else {
        // Neu erstellen
        await axios.post(
          `http://localhost:5000/api/vehicles/${vehicleId}/damage-reports`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }
      onDamageReported();
      onClose();
    } catch (error) {
      console.error('Fehler beim Melden des Schadens:', error);
    }
  };

  const handleDeleteImage = (imageToDelete) => {
    if (window.confirm('Möchten Sie dieses Bild wirklich löschen?')) {
      setExistingImages(existingImages.filter(img => img !== imageToDelete));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {editingReport ? 'Schadensmeldung bearbeiten' : 'Neue Schadensmeldung'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Beschreibung des Schadens
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows="4"
              required
            />
          </div>
          
          
          {editingReport && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="Gemeldet">Gemeldet</option>
                <option value="In Bearbeitung">In Bearbeitung</option>
                <option value="Repariert">Repariert</option>
              </select>
            </div>
          )}

          {/* Vorhandene Bilder anzeigen */}
          {editingReport && existingImages.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vorhandene Bilder
              </label>
              <div className="grid grid-cols-3 gap-2">
                {existingImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={`http://localhost:5000${image}`}
                      alt={`Schaden ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(image)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Kilometerstand
              {!editingReport && (
                <span className="text-sm text-gray-500 ml-2">
                  (Aktuell: {currentMileage.toLocaleString()} km)
                </span>
              )}
            </label>
            <input
              type="number"
              name="mileage"
              value={mileage}
              onChange={(e) => {
                const value = e.target.value;
                if (validateMileage(value)) {
                  setMileage(value);
                }
              }}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                mileageWarning ? 'border-yellow-500' : 'border-gray-300'
              }`}
              required
            />
            {mileageWarning && (
              <p className="mt-1 text-sm text-yellow-600">{mileageWarning}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {editingReport ? 'Weitere Bilder hochladen' : 'Bilder hochladen'}
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImages(Array.from(e.target.files))}
              className="mt-1 block w-full"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              {editingReport ? 'Speichern' : 'Schaden melden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DamageReport; 