# Fuhrpark-Webapp

Dieses Projekt ist eine vollständige Webapplikation zur Verwaltung eines Fuhrparks. Es umfasst:

- **Frontend**: Eine React-Anwendung (mit TailwindCSS für das Styling)
- **Backend**: Eine Flask REST API (mit Endpunkten für Fahrzeuge, Buchungen und Benutzer)
- **Datenbank**: PostgreSQL
- **Deployment**: Docker & Docker Compose

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
- **Datenbank**: PostgreSQL  
- **Deployment**: Docker & Docker Compose

## Setup mit Docker

1. **Voraussetzungen**  
   Stelle sicher, dass Docker und Docker Compose auf deinem System installiert sind.

2. **Projekt starten**  
   - Klone dieses Repository oder lade die Dateien in einen Ordner (z. B. `fuhrpark-webapp`).
   - Navigiere in das Projektverzeichnis.
   - Starte alle Container mit:
     ```
     docker-compose up --build
     ```
   - Das Backend ist dann unter `http://localhost:5000` erreichbar.
   - Das Frontend läuft unter `http://localhost:3000`.

3. **Datenbank**  
   Beim ersten Start werden die Datenbanktabellen automatisch erstellt. Für weitere Änderungen empfiehlt sich der Einsatz von Migrations-Tools (z. B. Flask-Migrate).

## Weiterentwicklung

- Integration eines echten Autologin-Systems und Benutzer-Authentifizierung  
- Erweiterung der Kalenderfunktionalität (z. B. durch Integration von FullCalendar)  
- Implementierung von E-Mail-Benachrichtigungen und Import-/Export-Funktionen  
- Erweiterte Statistikfunktionen (z. B. Graphen zur Fahrzeugbenutzung) 