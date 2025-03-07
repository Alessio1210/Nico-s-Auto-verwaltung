from app import app, db
from datetime import datetime, date, timedelta
import random
import json

# Datenbank-Tabellen innerhalb des Anwendungskontexts erstellen
with app.app_context():
    print("Starte Datenbank-Migration...")
    db.create_all()
    print("Datenbanktabellen wurden erstellt!")
    
    # Überprüfen, ob bereits Daten vorhanden sind
    from models import Vehicle, User, Booking
    
    # Keine Testdaten für die Statistiken erstellen,
    # da wir jetzt echte Daten aus der Datenbank verwenden
    
    print("Migration der Datenbanktabellen abgeschlossen!")
    print("Die Statistiken werden nun aus tatsächlichen Daten in der Datenbank generiert.") 