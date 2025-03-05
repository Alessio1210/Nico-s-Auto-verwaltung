from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class Vehicle(db.Model):
    __tablename__ = 'Autos'
    id = db.Column(db.Integer, primary_key=True)
    modell = db.Column(db.String(100), nullable=False)
    kennzeichen = db.Column(db.String(20), unique=True, nullable=False)
    bild = db.Column(db.String(255))
    status = db.Column(db.String(50), nullable=False, default='verfügbar')
    kilometerstand = db.Column(db.Integer, default=0)
    tankstand = db.Column(db.Integer, default=100)  # in Prozent
    letzte_wartung = db.Column(db.DateTime)
    naechste_wartung = db.Column(db.DateTime)
    
    # Beziehungen
    bookings = db.relationship("Booking", backref="vehicle", lazy=True)
    maintenance_records = db.relationship("MaintenanceRecord", backref="vehicle", lazy=True)
    documents = db.relationship("VehicleDocument", backref="vehicle", lazy=True)
    damage_reports = db.relationship("DamageReport", backref="vehicle", lazy=True)
    fuel_logs = db.relationship("FuelLog", backref="vehicle", lazy=True)

class User(db.Model):
    __tablename__ = 'Users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    rolle = db.Column(db.String(50), nullable=False)  # z. B. "Mitarbeiter" oder "Fuhrparkmitarbeiter"
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    department = db.Column(db.String(100))  # Neue Spalte für Abteilung
    building = db.Column(db.String(100))    # Neue Spalte für Gebäude

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

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

    user = db.relationship("User", backref="bookings")

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