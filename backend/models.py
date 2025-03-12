from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class Vehicle(db.Model):
    __tablename__ = 'Autos'
    id = db.Column(db.Integer, primary_key=True)
    modell = db.Column(db.String(100), nullable=False)
    kennzeichen = db.Column(db.String(20), nullable=False)
    bild = db.Column(db.String(255))  # Bestehender Bildpfad
    status = db.Column(db.String(50), nullable=False, default='verfügbar')
    kilometerstand = db.Column(db.Integer, default=0)
    tankstand = db.Column(db.Integer, default=100)  # in Prozent
    letzte_wartung = db.Column(db.DateTime)
    naechste_wartung = db.Column(db.DateTime)
    # Neue Felder, die optional sind
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=True)
    tuev_datum = db.Column(db.Date, nullable=True)
    au_datum = db.Column(db.Date, nullable=True)
    
    # Beziehungen - bestehende Struktur beibehalten
    bookings = db.relationship("Booking", backref="vehicle", lazy=True)
    maintenance_records = db.relationship("MaintenanceRecord", backref="vehicle", lazy=True)
    documents = db.relationship("VehicleDocument", backref="vehicle", lazy=True)
    damage_reports = db.relationship("DamageReport", backref="vehicle", lazy=True)
    fuel_logs = db.relationship("FuelLog", backref="vehicle", lazy=True)
    
    def to_dict(self):
        data = {
            'id': self.id,
            'modell': self.modell,
            'kennzeichen': self.kennzeichen,
            'kilometerstand': self.kilometerstand,
            'status': self.status,
            'bild': self.bild
        }
        
        # Debug-Ausgabe für die Datumswerte
        print(f"Vehicle {self.id}: Raw TÜV-Datum = {self.tuev_datum}, Raw AU-Datum = {self.au_datum}")
        
        # Nur hinzufügen, wenn vorhanden
        if hasattr(self, 'tuev_datum') and self.tuev_datum:
            try:
                data['tuev_datum'] = self.tuev_datum.isoformat()
                print(f"Formatiertes TÜV-Datum: {data['tuev_datum']}")
            except Exception as e:
                print(f"Fehler bei der Formatierung des TÜV-Datums: {e}")
                data['tuev_datum'] = None
        else:
            data['tuev_datum'] = None
            
        if hasattr(self, 'au_datum') and self.au_datum:
            try:
                data['au_datum'] = self.au_datum.isoformat()
                print(f"Formatiertes AU-Datum: {data['au_datum']}")
            except Exception as e:
                print(f"Fehler bei der Formatierung des AU-Datums: {e}")
                data['au_datum'] = None
        else:
            data['au_datum'] = None
            
        return data

class User(db.Model):
    __tablename__ = 'Users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    rolle = db.Column(db.String(50), nullable=False)  # z. B. "Mitarbeiter" oder "Fuhrparkmitarbeiter"
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))  # Für werkzeug-gehashte Passwörter
    department = db.Column(db.String(100))  # Neue Spalte für Abteilung
    building = db.Column(db.String(100))    # Neue Spalte für Gebäude
    permissions = db.Column(db.JSON, nullable=True)  # Berechtigungen als JSON-Objekt, optional

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
        
    def to_dict(self):
        """Konvertiert das Benutzer-Objekt in ein Dictionary für die API-Antwort"""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'rolle': self.rolle,
            'department': self.department,
            'building': self.building,
            'permissions': self.permissions or {
                'canBookVehicles': True,
                'canViewStatistics': self.rolle == 'Admin',
                'canManageVehicles': self.rolle == 'Admin',
                'canApproveRequests': self.rolle == 'Admin'
            }
        }

class Booking(db.Model):
    __tablename__ = 'Bookings'
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('Autos.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('Users.id'), nullable=False)
    startzeit = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    endzeit = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    status = db.Column(db.String(50), nullable=False, default='Angefragt')  # z. B. "Angefragt", "akzeptiert", "abgelehnt"
    zweck = db.Column(db.String(255), default='')       # Neuer Parameter: Wofür wird das Fahrzeug genutzt?
    auto_groesse = db.Column(db.String(50), default='')   # Neuer Parameter: Gewünschte Fahrzeuggröße
    genehmigt_von_id = db.Column(db.Integer, db.ForeignKey('Users.id'), nullable=True)  # ID des Administrators, der die Anfrage genehmigt hat
    genehmigt_am = db.Column(db.DateTime, nullable=True)  # Zeitpunkt der Genehmigung

    user = db.relationship("User", backref="bookings", foreign_keys=[user_id])
    genehmiger = db.relationship("User", backref="genehmigte_bookings", foreign_keys=[genehmigt_von_id])

class MaintenanceRecord(db.Model):
    __tablename__ = 'Wartungshistorie'
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('Autos.id'), nullable=False)
    datum = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    beschreibung = db.Column(db.String(500), nullable=False)
    kosten = db.Column(db.Float)
    kilometerstand = db.Column(db.Integer)
    durchgefuehrt_von = db.Column(db.String(100))
    art_der_wartung = db.Column(db.String(50))  # z.B. "Routinewartung", "Reparatur", "Inspektion"

class AuditLog(db.Model):
    __tablename__ = 'AuditLog'
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    aktion = db.Column(db.String(50), nullable=False)  # z.B. "Wartung hinzugefügt", "Wartung gelöscht"
    benutzer = db.Column(db.String(100))  # Wer hat die Änderung vorgenommen
    fahrzeug_id = db.Column(db.Integer, db.ForeignKey('Autos.id'))
    beschreibung = db.Column(db.Text)  # Details der Änderung
    alte_werte = db.Column(db.Text)  # JSON der alten Werte bei Änderungen
    neue_werte = db.Column(db.Text)  # JSON der neuen Werte bei Änderungen

    fahrzeug = db.relationship("Vehicle", backref="audit_logs")

class VehicleDocument(db.Model):
    __tablename__ = 'Fahrzeug_Dokumente'
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('Autos.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    document_type = db.Column(db.String(50))  # z.B. "Fahrzeugschein", "Versicherung", etc.

class DamageReport(db.Model):
    __tablename__ = 'Schadensmeldungen'
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('Autos.id'), nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default='Gemeldet')  # Gemeldet, In Bearbeitung, Repariert
    images = db.Column(db.JSON)  # Liste von Bildpfaden
    repair_cost = db.Column(db.Float)
    repaired_date = db.Column(db.DateTime)

class FuelLog(db.Model):
    __tablename__ = 'Tankprotokoll'
    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('Autos.id'), nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    amount_liters = db.Column(db.Float, nullable=False)
    cost_per_liter = db.Column(db.Float, nullable=False)
    total_cost = db.Column(db.Float, nullable=False)
    mileage = db.Column(db.Integer, nullable=False)
    fuel_type = db.Column(db.String(50))  # Diesel, Benzin, etc.

class Audit(db.Model):
    __tablename__ = 'Audit_Log'
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    aktion = db.Column(db.String(50), nullable=False)
    fahrzeug_id = db.Column(db.Integer)
    beschreibung = db.Column(db.String(500))
    alte_werte = db.Column(db.JSON)
    neue_werte = db.Column(db.JSON)

# Neue Statistik-Modell-Klassen
class StatisticsData(db.Model):
    __tablename__ = 'Statistiken'
    id = db.Column(db.Integer, primary_key=True)
    datum = db.Column(db.Date, nullable=False)
    kategorie = db.Column(db.String(50), nullable=False)  # inspektionen, fahrtzeiten, kmstand, etc.
    unter_kategorie = db.Column(db.String(50))  # z.B. Fahrzeugmarke oder Kraftstofftyp
    wert = db.Column(db.Float, nullable=False)  # numerischer Wert
    einheit = db.Column(db.String(20))  # EUR, km, h, L, kWh, etc.
    zusatzinfo = db.Column(db.JSON)  # zusätzliche Informationen

class DepartmentUsage(db.Model):
    __tablename__ = 'Abteilungs_Nutzung'
    id = db.Column(db.Integer, primary_key=True)
    datum = db.Column(db.Date, nullable=False)
    abteilung = db.Column(db.String(100), nullable=False)
    fahrzeug_id = db.Column(db.Integer, db.ForeignKey('Autos.id'))
    nutzungsdauer = db.Column(db.Float)  # in Stunden
    gefahrene_km = db.Column(db.Float)
    vehicle = db.relationship("Vehicle", backref="department_usages")
    
class DeviceStats(db.Model):
    __tablename__ = 'Geraetestatistik'
    id = db.Column(db.Integer, primary_key=True)
    datum = db.Column(db.Date, nullable=False)
    geraetetyp = db.Column(db.String(50), nullable=False)  # mobile oder desktop
    anzahl_zugriffe = db.Column(db.Integer, nullable=False) 