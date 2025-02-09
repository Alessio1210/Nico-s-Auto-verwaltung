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
    bookings = db.relationship("Booking", backref="vehicle", lazy=True)

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