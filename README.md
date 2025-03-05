# Fuhrpark-Webapp

Eine Webanwendung zur Verwaltung eines Fuhrparks mit React Frontend und Flask Backend.

## Installation

### Backend (Python/Flask)
1. Installiere Python 3.9 oder höher
2. Navigiere in den backend-Ordner:
   ```bash
   cd backend
   ```
3. Erstelle eine virtuelle Umgebung:
   ```bash
   python -m venv venv
   ```
4. Aktiviere die virtuelle Umgebung:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
5. Installiere die Abhängigkeiten:
   ```bash
   pip install -r requirements.txt
   ```
6. Starte den Flask-Server:
   ```bash
   python app.py
   ```

### Frontend (React)
1. Installiere Node.js (Version 16 oder höher)
2. Navigiere in den frontend-Ordner:
   ```bash
   cd frontend
   ```
3. Installiere die Abhängigkeiten:
   ```bash
   npm install
   ```
4. Starte die Entwicklungsumgebung:
   ```bash
   npm start
   ```

## Verwendung
- Frontend läuft auf: http://localhost:3000
- Backend-API läuft auf: http://localhost:5000

## Datenbank
Die Anwendung verwendet SQL Server Express. Stelle sicher, dass:
1. SQL Server Express installiert ist
2. Die Datenbank "Fuhrpark" existiert
3. Windows-Authentifizierung aktiviert ist

## Funktionen

- **Fahrzeugverwaltung**  
  Fahrzeuge können hinzugefügt, bearbeitet und gelöscht werden. Jedes Fahrzeug beinhaltet:
  - Fahrzeugbild (automatisch generiert anhand des Modells)
  - Kennzeichen
  - Modell
  - Fahrzeugstatus (z. B. "verfügbar", "reserviert", "in Wartung")

- **Kalenderansichten**  
  - Individuelle Kalender für jedes Fahrzeug zur Anzeige der Buchungen  
  - Globales Dashboard für eine Übersicht aller Buchungen, farblich unterschieden

- **Buchungsanfragen und Anfrageverwaltung**  
  - Mitarbeiter können Fahrzeuge buchen (Buchungsanfrage)  
  - Fuhrparkmitarbeiter können Buchungen annehmen, ablehnen oder umplanen

- **Nutzerverwaltung**  
  Es gibt zwei Rollen: Mitarbeiter und Fuhrparkmitarbeiter.  
  Autologin wird in dieser Version simuliert (echte Integration bitte in der Zukunft umsetzen).

- **Zusatzfeatures (erweiterbar)**  
  - E-Mail-Erinnerungen  
  - Wartungsmodus  
  - Import-/Export-Funktion

## Technologie-Stack

- **Frontend**: React, TailwindCSS  
- **Backend**: Flask, Flask-SQLAlchemy, Flask-Cors  
- **Datenbank**: SQL Server Express  

## Weiterentwicklung

- Integration eines echten Autologin-Systems und Benutzer-Authentifizierung  
- Erweiterung der Kalenderfunktionalität (z. B. durch Integration von FullCalendar)  
- Implementierung von E-Mail-Benachrichtigungen und Import-/Export-Funktionen  
- Erweiterte Statistikfunktionen (z. B. Graphen zur Fahrzeugbenutzung) 