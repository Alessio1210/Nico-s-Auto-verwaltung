import React, { useState, useEffect, useRef } from 'react';
import { CalendarIcon, ClockIcon, ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

function BookingForm({ vehicle, onSubmit, onCancel, checkAvailability }) {
  const [formStep, setFormStep] = useState(1);
  const [totalSteps] = useState(3);
  const [bookingData, setBookingData] = useState({
    pickupDate: '',
    pickupTime: '08:00',
    returnDate: '',
    returnTime: '17:00',
    purpose: '',
    destination: '',
    passengers: 1,
    notes: ''
  });
  const [conflicts, setConflicts] = useState([]);
  const [validated, setValidated] = useState(false);

  // Aktuelles Datum berechnen (für min-Werte in den Datumsfeldern)
  const today = new Date().toISOString().split('T')[0];

  // Refs für Fokusbewahrung
  const inputRefs = {
    purpose: useRef(null),
    destination: useRef(null),
    passengers: useRef(null),
    notes: useRef(null)
  };

  // Aktuelle Feldnamen, die bearbeitet werden
  const [activeField, setActiveField] = useState(null);

  // Fokuswiederherstellung nach Rendering
  useEffect(() => {
    if (activeField && inputRefs[activeField] && inputRefs[activeField].current) {
      const input = inputRefs[activeField].current;
      const length = input.value.length;
      
      // Setze den Cursor an die Stelle, an der er war
      requestAnimationFrame(() => {
        input.focus();
        try {
          // Wenn möglich, setze den Cursor ans Ende des Texts
          input.setSelectionRange(length, length);
        } catch (e) {
          // Einige Input-Typen unterstützen setSelectionRange nicht
          console.log("Konnte Cursor-Position nicht setzen");
        }
      });
    }
  }, [bookingData, activeField]);

  // Validierung für den aktuellen Schritt
  const validateStep = () => {
    switch (formStep) {
      case 1:
        return bookingData.pickupDate && bookingData.returnDate;
      case 2:
        return bookingData.purpose && bookingData.destination;
      case 3:
        return true; // Letzter Schritt, immer gültig
      default:
        return false;
    }
  };

  // Führe die Validierung nur aus, wenn sich der formStep ändert
  useEffect(() => {
    setValidated(validateStep());
  }, [formStep]);

  // Prüfe Verfügbarkeit, wenn sich die Daten ändern
  useEffect(() => {
    if (bookingData.pickupDate && bookingData.returnDate && checkAvailability) {
      const startDateTime = `${bookingData.pickupDate}T${bookingData.pickupTime}`;
      const endDateTime = `${bookingData.returnDate}T${bookingData.returnTime}`;
      
      // Prüfe Verfügbarkeit mit der übergebenen Funktion
      const { isAvailable, conflicts } = checkAvailability(
        vehicle.id,
        startDateTime,
        endDateTime
      );
      
      if (!isAvailable) {
        setConflicts(conflicts);
      } else {
        setConflicts([]);
      }
    }
  }, [bookingData.pickupDate, bookingData.pickupTime, bookingData.returnDate, bookingData.returnTime, vehicle.id, checkAvailability]);

  // Handler für Änderungen an Formularfeldern
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Markiere das aktive Feld für Fokusbewahrung
    setActiveField(name);
    
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
      if (!bookingData.endDate || new Date(bookingData.endDate) < selectedDate) {
        setBookingData({
          ...bookingData,
          [name]: value,
          endDate: value // Setze Enddatum auf gleiches Datum
        });
        return;
      }
    }
    
    // Aktualisiere State
    setBookingData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Führe die Validierung direkt hier durch
    setValidated(validateStep());
  };

  // Zum nächsten Schritt gehen
  const goToNextStep = () => {
    if (formStep < totalSteps && validateStep()) {
      setFormStep(formStep + 1);
    }
  };

  // Zum vorherigen Schritt gehen
  const goToPrevStep = () => {
    if (formStep > 1) {
      setFormStep(formStep - 1);
    }
  };

  // Formular einreichen
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const fullBookingData = {
      ...bookingData,
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.modell} (${vehicle.kennzeichen})`,
      startDateTime: `${bookingData.pickupDate}T${bookingData.pickupTime}`,
      endDateTime: `${bookingData.returnDate}T${bookingData.returnTime}`
    };
    
    onSubmit(fullBookingData);
  };

  // Fortschrittsbalken
  const ProgressBar = () => (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        <div className="text-sm text-gray-600">Schritt {formStep} von {totalSteps}</div>
        <div className="text-sm font-medium text-blue-600">{Math.round((formStep / totalSteps) * 100)}% Abgeschlossen</div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
          style={{ width: `${(formStep / totalSteps) * 100}%` }}
        ></div>
      </div>
    </div>
  );

  // Komponenten für die verschiedenen Schritte
  const Step1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center text-gray-800">
        Wann benötigen Sie das Fahrzeug?
      </h2>
      <p className="text-center text-gray-600">
        Wählen Sie Ihre bevorzugten Abhol- und Rückgabezeiten
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Abholdatum & Zeit
          </label>
          <div className="flex">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <CalendarIcon className="w-5 h-5 text-gray-500" />
              </div>
              <input
                type="date"
                name="pickupDate"
                min={today}
                value={bookingData.pickupDate}
                onChange={handleChange}
                className="block w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="relative ml-2 w-24">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <ClockIcon className="w-5 h-5 text-gray-500" />
              </div>
              <input
                type="time"
                name="pickupTime"
                value={bookingData.pickupTime}
                onChange={handleChange}
                className="block w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Rückgabedatum & Zeit
          </label>
          <div className="flex">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <CalendarIcon className="w-5 h-5 text-gray-500" />
              </div>
              <input
                type="date"
                name="returnDate"
                min={bookingData.pickupDate || today}
                value={bookingData.returnDate}
                onChange={handleChange}
                className="block w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="relative ml-2 w-24">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <ClockIcon className="w-5 h-5 text-gray-500" />
              </div>
              <input
                type="time"
                name="returnTime"
                value={bookingData.returnTime}
                onChange={handleChange}
                className="block w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="p-4 mt-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Überschneidungen mit bestehenden Buchungen
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc pl-5 space-y-1">
                  {conflicts.map((conflict, idx) => (
                    <li key={idx}>
                      {new Date(conflict.startDateTime).toLocaleDateString()} - {new Date(conflict.endDateTime).toLocaleDateString()}
                      {conflict.userName && ` (${conflict.userName})`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const Step2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center text-gray-800">
        Wohin fahren Sie?
      </h2>
      <p className="text-center text-gray-600">
        Geben Sie den Zweck und das Ziel Ihrer Fahrt an
      </p>

      <div className="space-y-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Verwendungszweck
          </label>
          <input
            type="text"
            name="purpose"
            value={bookingData.purpose}
            onChange={handleChange}
            ref={inputRefs.purpose}
            placeholder="z.B. Kundentermin, Materialtransport"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zielort
          </label>
          <input
            type="text"
            name="destination"
            value={bookingData.destination}
            onChange={handleChange}
            ref={inputRefs.destination}
            placeholder="z.B. München, Stuttgart"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Anzahl Personen
          </label>
          <input
            type="number"
            name="passengers"
            min="1"
            max="9"
            value={bookingData.passengers}
            onChange={handleChange}
            ref={inputRefs.passengers}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zusätzliche Hinweise (optional)
          </label>
          <textarea
            name="notes"
            value={bookingData.notes}
            onChange={handleChange}
            ref={inputRefs.notes}
            rows="3"
            placeholder="z.B. Besondere Anforderungen, Parkmöglichkeiten, etc."
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>
      </div>
    </div>
  );

  const Step3 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center text-gray-800">
        Überprüfen und bestätigen
      </h2>
      <p className="text-center text-gray-600">
        Bitte überprüfen Sie Ihre Angaben
      </p>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-4">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Fahrzeugdetails
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Fahrzeug</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {vehicle.modell} ({vehicle.kennzeichen})
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Abholdatum</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(bookingData.pickupDate).toLocaleDateString()} um {bookingData.pickupTime} Uhr
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Rückgabedatum</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(bookingData.returnDate).toLocaleDateString()} um {bookingData.returnTime} Uhr
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Verwendungszweck</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {bookingData.purpose}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Zielort</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {bookingData.destination}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Anzahl Personen</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {bookingData.passengers}
              </dd>
            </div>
            {bookingData.notes && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Hinweise</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {bookingData.notes}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="p-4 mt-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Hinweis: Überschneidungen mit bestehenden Buchungen
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Diese Anfrage überschneidet sich mit bestehenden Buchungen. Sie können die Anfrage trotzdem absenden, aber sie muss vom Administrator genehmigt werden.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Rendere den aktuellen Schritt
  const renderStep = () => {
    switch (formStep) {
      case 1:
        return <Step1 />;
      case 2:
        return <Step2 />;
      case 3:
        return <Step3 />;
      default:
        return <Step1 />;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-3xl mx-auto">
      <ProgressBar />
      
      <form onSubmit={handleSubmit}>
        {renderStep()}
        
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={formStep === 1 ? onCancel : goToPrevStep}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            {formStep === 1 ? 'Abbrechen' : 'Zurück'}
          </button>
          
          {formStep < totalSteps ? (
            <button
              type="button"
              onClick={goToNextStep}
              disabled={!validated}
              className={`px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white flex items-center
                ${validated ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}
            >
              Weiter
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 flex items-center"
            >
              Anfrage senden
              <CheckCircleIcon className="ml-2 h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default BookingForm; 