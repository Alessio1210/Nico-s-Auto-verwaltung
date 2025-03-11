# Fuhrpark-Webapp

Eine Webanwendung zur Verwaltung eines Fuhrparks mit React Frontend und Flask Backend.

## Installation

### Backend (Python/Flask)
1. Installiere Python 3.12 oder höher
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
6. Konfiguriere die Umgebungsvariablen:
   - Kopiere `.env.example` zu `.env`
   - Passe die Werte in `.env` an:
     ```
     DATABASE_CONNECTION=mssql+pyodbc://server/database?driver=SQL+Server
     SECRET_KEY=dein-geheimer-schluessel
     ```
7. Starte den Flask-Server:
   ```bash
   python app.py
   ```

### Frontend (React)
1. Installiere Node.js (Version 20.x LTS)
2. Navigiere in den frontend-Ordner:
   ```bash
   cd frontend
   ```
3. Installiere die Abhängigkeiten:
   ```bash
   npm install
   ```
4. Konfiguriere die Umgebungsvariablen:
   - Kopiere `.env.example` zu `.env.local`
   - Passe die API-URL an:
     ```
     REACT_APP_API_URL=http://localhost:5000
     ```
5. Starte die Entwicklungsumgebung:
   ```bash
   npm start
   ```

## Verwendung
- Frontend läuft auf: http://localhost:3000
- Backend-API läuft auf: http://localhost:5000
- API-Dokumentation: http://localhost:5000/api/docs

## Datenbank
Die Anwendung verwendet SQL Server Express. Stelle sicher, dass:
1. SQL Server Express installiert ist
2. Die Datenbank "Fuhrpark" existiert
3. Windows-Authentifizierung aktiviert ist

### Datenbank-Setup
1. Führe die Migrations-Skripte aus:
   ```bash
   cd backend
   flask db upgrade
   ```
2. (Optional) Lade Beispieldaten:
   ```bash
   python scripts/seed_data.py
   ```

## Funktionen

- **Fahrzeugverwaltung**  
  Fahrzeuge können hinzugefügt, bearbeitet und gelöscht werden. Jedes Fahrzeug beinhaltet:
  - Fahrzeugbild (automatisch generiert anhand des Modells)
  - Kennzeichen
  - Modell
  - Fahrzeugstatus (z. B. "verfügbar", "reserviert", "in Wartung")

- **Kalenderansichten**  
  - Individuelle Kalender für jedes Fahrzeug zur Anzeige der Buchungen  
  - Globales Dashboard für eine Übersicht aller Buchungen, farblich unterschieden

- **Buchungsanfragen und Anfrageverwaltung**  
  - Mitarbeiter können Fahrzeuge buchen (Buchungsanfrage)  
  - Fuhrparkmitarbeiter können Buchungen annehmen, ablehnen oder umplanen

- **Nutzerverwaltung**  
  Es gibt zwei Rollen: Mitarbeiter und Fuhrparkmitarbeiter.  
  Autologin wird in dieser Version simuliert (echte Integration bitte in der Zukunft umsetzen).

## Tests

### Backend-Tests
```bash
cd backend
pytest
```

### Frontend-Tests
```bash
cd frontend
npm test
```

## API-Dokumentation
Die API-Dokumentation ist verfügbar unter:
- Swagger UI: http://localhost:5000/api/docs
- ReDoc: http://localhost:5000/api/redoc

## Technologie-Stack

- **Frontend**: 
  - React 18
  - TailwindCSS 3
  - TypeScript 5
- **Backend**: 
  - Flask 3.0
  - Flask-SQLAlchemy 3.1
  - Flask-Cors 3.0
- **Datenbank**: SQL Server Express 2019+
- **Tests**:
  - Pytest (Backend)
  - Jest (Frontend)

## Weiterentwicklung

- Integration eines echten Autologin-Systems und Benutzer-Authentifizierung
- Erweiterung der Kalenderfunktionalität (z. B. durch Integration von FullCalendar)
- Implementierung von E-Mail-Benachrichtigungen und Import-/Export-Funktionen
- Erweiterte Statistikfunktionen (z. B. Graphen zur Fahrzeugbenutzung)

## Entwicklungsrichtlinien

- Code-Formatierung mit Black (Python) und Prettier (JavaScript/TypeScript)
- Tests für neue Features erforderlich
- Branching-Strategie: GitHub Flow
- Commit-Messages nach Conventional Commits Standard 