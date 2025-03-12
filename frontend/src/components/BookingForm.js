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

  // Hilfsfunktion zum Formatieren des Datums während der Eingabe
  const formatDateInput = (input) => {
    // Entferne alle nicht-numerischen Zeichen außer Punkt
    let cleaned = input.replace(/[^\d.]/g, '');
    
    // Erlaube höchstens 2 Punkte
    const dots = cleaned.split('.').length - 1;
    if (dots > 2) {
      cleaned = cleaned.substring(0, cleaned.lastIndexOf('.'));
    }
    
    // Automatische Formatierung: füge Punkte ein, wenn nötig
    if (cleaned.length > 0) {
      // Erstes Segment (Tag)
      if (cleaned.length >= 2 && !cleaned.includes('.')) {
        cleaned = cleaned.substring(0, 2) + '.' + cleaned.substring(2);
      }
      // Zweites Segment (Monat)
      if (cleaned.length >= 5 && cleaned.split('.').length === 2) {
        const parts = cleaned.split('.');
        if (parts[1].length >= 2) {
          cleaned = parts[0] + '.' + parts[1].substring(0, 2) + '.' + parts[1].substring(2);
        }
      }
    }
    
    return cleaned;
  };

  // Hilfsfunktion zum Formatieren der Zeit während der Eingabe
  const formatTimeInput = (input) => {
    // Entferne alle nicht-numerischen Zeichen außer Doppelpunkt
    let cleaned = input.replace(/[^\d:]/g, '');
    
    // Erlaube höchstens 1 Doppelpunkt
    const colons = cleaned.split(':').length - 1;
    if (colons > 1) {
      cleaned = cleaned.substring(0, cleaned.lastIndexOf(':'));
    }
    
    // Automatische Formatierung: füge Doppelpunkt ein, wenn nötig
    if (cleaned.length > 0) {
      // Erstes Segment (Stunden)
      if (cleaned.length >= 2 && !cleaned.includes(':')) {
        cleaned = cleaned.substring(0, 2) + ':' + cleaned.substring(2);
      }
      
      // Begrenze Minuten auf 2 Ziffern
      if (cleaned.includes(':')) {
        const parts = cleaned.split(':');
        if (parts[1].length > 2) {
          cleaned = parts[0] + ':' + parts[1].substring(0, 2);
        }
      }
    }
    
    return cleaned;
  };

  // Hilfsfunktion zur Validierung der Zeitwerte
  const isValidTime = (timeString) => {
    if (!timeString || !timeString.includes(':')) return false;
    
    const parts = timeString.split(':');
    if (parts.length !== 2) return false;
    
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    
    return !isNaN(hours) && !isNaN(minutes) && 
           hours >= 0 && hours <= 23 && 
           minutes >= 0 && minutes <= 59;
  };

  // Hilfsfunktion zur Umwandlung von TT.MM.JJJJ in ein Date-Objekt
  const parseGermanDate = (dateString) => {
    if (!dateString || !dateString.includes('.')) return null;
    
    const parts = dateString.split('.');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Monate sind 0-indexiert
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (year < 1000 || year > 9999) return null; // Jahr muss 4-stellig sein
    
    const date = new Date(year, month, day);
    
    // Überprüfe, ob das erstellte Datum gültig ist
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
      return null; // Ungültiges Datum (z.B. 31.02.2025)
    }
    
    return date;
  };

  // Hilfsfunktion zur Umwandlung von Date in TT.MM.JJJJ
  const formatDateToGerman = (date) => {
    if (!date) return '';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  };

  // Aktuelles Datum berechnen (für min-Werte in den Datumsfeldern)
  const today = new Date().toISOString().split('T')[0];
  const todayGerman = formatDateToGerman(new Date());

  // Refs für Fokusbewahrung
  const inputRefs = {
    pickupDate: useRef(null),
    pickupTime: useRef(null),
    returnDate: useRef(null),
    returnTime: useRef(null),
    purpose: useRef(null),
    destination: useRef(null),
    passengers: useRef(null),
    notes: useRef(null)
  };

  // Aktuelle Feldnamen, die bearbeitet werden
  const [activeField, setActiveField] = useState(null);
  // Position des Cursors
  const [selectionInfo, setSelectionInfo] = useState({ start: 0, end: 0 });

  // Fokuswiederherstellung nach Rendering
  useEffect(() => {
    if (activeField && inputRefs[activeField] && inputRefs[activeField].current) {
      const input = inputRefs[activeField].current;
      
      // Unmittelbar den Fokus wiederherstellen (ohne requestAnimationFrame)
      try {
        input.focus();
        
        // Bei Text/Number-Inputs: versuche Cursor-Position wiederherzustellen
        if (input.type === 'text' || input.type === 'number') {
          try {
            input.setSelectionRange(selectionInfo.start, selectionInfo.end);
          } catch (e) {
            console.log("Konnte Cursor-Position nicht setzen");
          }
        }
      } catch (e) {
        console.error("Fokussierung fehlgeschlagen:", e);
      }
    }
  }, [activeField, selectionInfo]);

  // Handler für speziell für den Fokus bei date/time Inputs
  const handleFocus = (e) => {
    const { name } = e.target;
    setActiveField(name);
  };

  // Validierung für den aktuellen Schritt
  const validateStep = () => {
    switch (formStep) {
      case 1:
        // Validiere Datum im Format TT.MM.JJJJ
        const pickupDateValid = !!parseGermanDate(bookingData.pickupDate);
        const returnDateValid = !!parseGermanDate(bookingData.returnDate);
        // Validiere Zeit im Format HH:MM
        const pickupTimeValid = isValidTime(bookingData.pickupTime);
        const returnTimeValid = isValidTime(bookingData.returnTime);
        return pickupDateValid && returnDateValid && pickupTimeValid && returnTimeValid;
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

  // Handler für Änderungen an Formularfeldern
  const handleChange = (e) => {
    const { name, value, selectionStart, selectionEnd } = e.target;
    
    // Speichere Cursor-Position für Text-Inputs
    if (e.target.type === 'text' || e.target.type === 'number') {
      setSelectionInfo({
        start: selectionStart || 0,
        end: selectionEnd || 0
      });
    }
    
    // Markiere das aktive Feld für Fokusbewahrung
    setActiveField(name);
    
    let newValue = value;
    
    // Spezielles Handling für Datumsfelder mit Formatierung
    if (name === 'pickupDate' || name === 'returnDate') {
      newValue = formatDateInput(value);
      
      // Berechne die neue Cursor-Position nach der Formatierung
      const addedChars = newValue.length - value.length;
      if (addedChars > 0 && selectionStart) {
        setSelectionInfo({
          start: selectionStart + addedChars,
          end: selectionEnd + addedChars
        });
      }
      
      // Spezielle Behandlung für Abholdatum: setze auch Rückgabedatum
      if (name === 'pickupDate') {
        const pickupDate = parseGermanDate(newValue);
        const returnDate = parseGermanDate(bookingData.returnDate);
        
        if (pickupDate && (!returnDate || pickupDate > returnDate)) {
          setBookingData(prevData => ({
            ...prevData,
            [name]: newValue,
            returnDate: newValue  // Setze Rückgabedatum auf gleiches Datum
          }));
          return;
        }
      }
    }
    // Spezielles Handling für Zeitfelder mit Formatierung
    else if (name === 'pickupTime' || name === 'returnTime') {
      newValue = formatTimeInput(value);
      
      // Berechne die neue Cursor-Position nach der Formatierung
      const addedChars = newValue.length - value.length;
      if (addedChars > 0 && selectionStart) {
        setSelectionInfo({
          start: selectionStart + addedChars,
          end: selectionEnd + addedChars
        });
      }
    }
    
    // Aktualisiere State ohne unnötige Re-Renderings
    setBookingData(prevData => ({
      ...prevData,
      [name]: newValue
    }));
    
    // Führe die Validierung direkt hier durch, aber nur für relevante Felder
    if (
      (formStep === 1 && (name === 'pickupDate' || name === 'returnDate' || name === 'pickupTime' || name === 'returnTime')) ||
      (formStep === 2 && (name === 'purpose' || name === 'destination'))
    ) {
      setValidated(validateStep());
    }
  };

  // Handler für onBlur - prüft nur die Formatierung, aber nicht die Verfügbarkeit
  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // Prüfe Datumseingaben
    if (name === 'pickupDate' || name === 'returnDate') {
      // Überprüfe, ob das Datum vollständig ist
      const parts = value.split('.');
      
      // Nur validieren, wenn vollständiges Datum eingegeben wurde
      if (parts.length === 3 && parts[2].length === 4) {
        // Prüfe, ob das Datum gültig ist
        const date = parseGermanDate(value);
        if (!date) {
          alert(`Bitte geben Sie ein gültiges Datum im Format TT.MM.JJJJ ein.`);
          return;
        }
      }
    }
    // Prüfe Zeiteingaben
    else if (name === 'pickupTime' || name === 'returnTime') {
      if (!isValidTime(value)) {
        alert(`Bitte geben Sie eine gültige Zeit im Format HH:MM ein.`);
        return;
      }
    }
  };

  // Prüfe Verfügbarkeit und setze Konflikte
  const checkAvailabilityAndSetConflicts = () => {
    // Nur prüfen, wenn beide Datums- und Zeitfelder ausgefüllt sind
    if (
      bookingData.pickupDate && isValidTime(bookingData.pickupTime) &&
      bookingData.returnDate && isValidTime(bookingData.returnTime) &&
      checkAvailability
    ) {
      const pickupDate = parseGermanDate(bookingData.pickupDate);
      const returnDate = parseGermanDate(bookingData.returnDate);
      
      if (pickupDate && returnDate) {
        // Formatiere zu ISO-Format für API-Anfragen
        const isoPickupDate = pickupDate.toISOString().split('T')[0];
        const isoReturnDate = returnDate.toISOString().split('T')[0];
        
        const startDateTime = `${isoPickupDate}T${bookingData.pickupTime}`;
        const endDateTime = `${isoReturnDate}T${bookingData.returnTime}`;
        
        // Prüfe Verfügbarkeit mit der übergebenen Funktion
        const { isAvailable, conflicts } = checkAvailability(
          vehicle.id,
          startDateTime,
          endDateTime
        );
        
        if (!isAvailable) {
          // Entferne Benutzernamen aus den Konflikten
          const anonymizedConflicts = conflicts.map(conflict => ({
            ...conflict,
            userName: undefined // Entferne den Benutzernamen
          }));
          setConflicts(anonymizedConflicts);
          return false;
        } else {
          setConflicts([]);
          return true;
        }
      }
    }
    return true; // Wenn keine Prüfung möglich ist, gilt es als verfügbar
  };

  // Zum nächsten Schritt gehen
  const goToNextStep = () => {
    // Führe Datumsvalidierung hier durch, bevor wir zum nächsten Schritt gehen
    if (formStep === 1) {
      // Prüfe, ob die Daten gültig sind
      const pickupDate = parseGermanDate(bookingData.pickupDate);
      const returnDate = parseGermanDate(bookingData.returnDate);
      
      if (!pickupDate || !returnDate) {
        alert('Bitte geben Sie gültige Datumswerte im Format TT.MM.JJJJ ein.');
        return;
      }
      
      // Prüfe Zeitwerte
      if (!isValidTime(bookingData.pickupTime) || !isValidTime(bookingData.returnTime)) {
        alert('Bitte geben Sie gültige Zeitwerte im Format HH:MM ein.');
        return;
      }
      
      // Prüfe, ob das Abholdatum in der Vergangenheit liegt
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Setze auf Beginn des Tages für korrekten Vergleich
      
      if (pickupDate < today) {
        alert('Termine in der Vergangenheit können nicht gebucht werden.');
        return; // Verhindere das Weitergehen
      }
      
      // Prüfe, ob das Rückgabedatum vor dem Abholdatum liegt
      if (returnDate < pickupDate) {
        alert('Das Rückgabedatum kann nicht vor dem Abholdatum liegen.');
        return;
      }
      
      // Prüfe, ob das Rückgabedatum gleich dem Abholdatum ist und die Rückgabezeit vor der Abholzeit liegt
      if (
        returnDate.getTime() === pickupDate.getTime() && 
        bookingData.returnTime < bookingData.pickupTime
      ) {
        alert('Die Rückgabezeit kann nicht vor der Abholzeit am selben Tag liegen.');
        return;
      }
      
      // Prüfe auf Konflikte mit anderen Buchungen
      const isAvailable = checkAvailabilityAndSetConflicts();
      if (!isAvailable) {
        if (conflicts.length > 0) {
          alert('Das Fahrzeug ist im gewählten Zeitraum bereits gebucht. Bitte wählen Sie einen anderen Zeitraum.');
          return;
        }
      }
    }
    
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
    
    // Konvertiere das deutsche Datumsformat zu ISO für die API
    const pickupDate = parseGermanDate(bookingData.pickupDate);
    const returnDate = parseGermanDate(bookingData.returnDate);
    
    if (!pickupDate || !returnDate) {
      alert('Bitte geben Sie gültige Datumswerte ein.');
      return;
    }
    
    if (!isValidTime(bookingData.pickupTime) || !isValidTime(bookingData.returnTime)) {
      alert('Bitte geben Sie gültige Zeitwerte ein.');
      return;
    }
    
    // Prüfe nochmals auf Konflikte, bevor die Anfrage abgesendet wird
    const isAvailable = checkAvailabilityAndSetConflicts();
    if (!isAvailable) {
      if (conflicts.length > 0) {
        alert('Das Fahrzeug ist im gewählten Zeitraum bereits gebucht. Bitte wählen Sie einen anderen Zeitraum.');
        return;
      }
    }
    
    const isoPickupDate = pickupDate.toISOString().split('T')[0];
    const isoReturnDate = returnDate.toISOString().split('T')[0];
    
    const fullBookingData = {
      ...bookingData,
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.modell} (${vehicle.kennzeichen})`,
      startDateTime: `${isoPickupDate}T${bookingData.pickupTime}`,
      endDateTime: `${isoReturnDate}T${bookingData.returnTime}`
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
                type="text"
                name="pickupDate"
                placeholder="TT.MM.JJJJ"
                value={bookingData.pickupDate}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                ref={inputRefs.pickupDate}
                className="block w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="relative ml-2 w-32">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <ClockIcon className="w-5 h-5 text-gray-500" />
              </div>
              <input
                type="text"
                name="pickupTime"
                placeholder="HH:MM"
                value={bookingData.pickupTime}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                ref={inputRefs.pickupTime}
                className="block w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
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
                type="text"
                name="returnDate"
                placeholder="TT.MM.JJJJ"
                value={bookingData.returnDate}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                ref={inputRefs.returnDate}
                className="block w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="relative ml-2 w-32">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <ClockIcon className="w-5 h-5 text-gray-500" />
              </div>
              <input
                type="text"
                name="returnTime"
                placeholder="HH:MM"
                value={bookingData.returnTime}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                ref={inputRefs.returnTime}
                className="block w-full pl-10 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                required
              />
            </div>
          </div>
        </div>
      </div>
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
                {bookingData.pickupDate} um {bookingData.pickupTime} Uhr
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Rückgabedatum</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {bookingData.returnDate} um {bookingData.returnTime} Uhr
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