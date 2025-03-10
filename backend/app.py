from flask import Flask, request, jsonify, g, Response, send_file, send_from_directory
from flask_cors import CORS
from config import Config
from models import db, Vehicle, User, Booking, MaintenanceRecord, AuditLog, VehicleDocument, DamageReport, FuelLog, StatisticsData, DepartmentUsage, DeviceStats
import os
import requests
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import json
from sqlalchemy import text  # Füge diesen Import am Anfang der Datei hinzu
import jwt  # Für JWT-Token (JSON Web Token)
import bcrypt  # Für Passwort-Hashing
from functools import wraps  # Für Dekoratoren

app = Flask(__name__)
app.config.from_object(Config)

# Secret Key für JWT
app.config['JWT_SECRET_KEY'] = 'geheim-und-sicher-schluessel'  # In Produktion würde man einen sicheren Schlüssel verwenden

# Zurück zur einfachen CORS-Konfiguration
CORS(app)

db.init_app(app)

# Funktion zum Erstellen der vordefinierten Benutzer
def create_default_users():
    with app.app_context():
        # Prüfen, ob der Admin-Benutzer bereits existiert
        admin_user = User.query.filter_by(email='admin@pirelli.com').first()
        if not admin_user:
            # Admin-Benutzer erstellen
            admin = User(
                name='Administrator',
                email='admin@pirelli.com',
                rolle='Admin',
                department='IT-Administration',
                permissions={
                    'canBookVehicles': True,
                    'canViewStatistics': True,
                    'canManageVehicles': True,
                    'canApproveRequests': True
                }
            )
            # Passwort mit der set_password-Methode setzen (verwendet password_hash)
            admin.set_password('Admin')
            db.session.add(admin)
            print("Admin-Benutzer erstellt")
        
        # Prüfen, ob der normale Benutzer bereits existiert
        normal_user = User.query.filter_by(email='user@pirelli.com').first()
        if not normal_user:
            # Normalen Benutzer erstellen
            user = User(
                name='Normaler Benutzer',
                email='user@pirelli.com',
                rolle='Mitarbeiter',
                department='Vertrieb',
                permissions={
                    'canBookVehicles': True,
                    'canViewStatistics': False,
                    'canManageVehicles': False,
                    'canApproveRequests': False
                }
            )
            # Passwort mit der set_password-Methode setzen (verwendet password_hash)
            user.set_password('user123')
            db.session.add(user)
            print("Normaler Benutzer erstellt")
        
        # Änderungen speichern, falls Benutzer erstellt wurden
        if not admin_user or not normal_user:
            db.session.commit()
            print("Standardbenutzer wurden in der Datenbank gespeichert")

# Am Anfang der Datei nach den Imports
UPLOAD_FOLDER = 'uploads'
DOCUMENT_FOLDER = os.path.join(UPLOAD_FOLDER, 'documents')
DAMAGE_FOLDER = os.path.join(UPLOAD_FOLDER, 'damage_reports')

# Erstelle die Ordner, falls sie nicht existieren
for folder in [UPLOAD_FOLDER, DOCUMENT_FOLDER, DAMAGE_FOLDER]:
    if not os.path.exists(folder):
        os.makedirs(folder)

# Test-Route für Datenbankverbindung
@app.route('/api/test-db')
def test_db():
    try:
        # Versuche eine einfache Datenbankabfrage
        vehicles = Vehicle.query.all()
        return jsonify({
            "status": "success",
            "message": "Datenbankverbindung erfolgreich",
            "vehicle_count": len(vehicles)
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# -- Autologin Simulation --
@app.before_request
def auto_login():
    # Simuliere einen Autologin. In einer echten Anwendung wird der Desktop-User abgefragt.
    g.current_user = {
        "id": 1,
        "name": "AutoLoginUser",
        "rolle": "Mitarbeiter",
        "department": "Vertrieb",
        "building": "Hauptgebäude"
    }

def get_vehicle_image(modell):
    # Unsplash API Konfiguration
    try:
        # Versuche ein Foto von Unsplash zu bekommen
        query = f"car {modell}"
        url = f"https://api.unsplash.com/photos/random?query={query}&client_id={Config.UNSPLASH_ACCESS_KEY}"
        
        response = requests.get(url, timeout=3)
        
        if response.status_code == 200:
            data = response.json()
            return data['urls']['regular']
        else:
            print(f"Unsplash API Fehler: {response.status_code}")
    except Exception as e:
        print(f"Fehler beim Abrufen des Unsplash-Bildes: {e}")
    
    # Fallback zu einem statischen Platzhalterbild von einer externen Quelle
    return "https://via.placeholder.com/800x600?text=Auto"

# Konfiguration für Bildupload
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max-size

# Stelle sicher, dass der Upload-Ordner existiert
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'vehicles'), exist_ok=True)

# Funktion, um fehlende Spalten zur Tabelle hinzuzufügen
def check_and_update_table_structure():
    with app.app_context():
        # Überprüfe, ob die neuen Spalten existieren, bevor du versuchst, sie hinzuzufügen
        connection = db.engine.connect()
        inspector = db.inspect(db.engine)
        
        # Hole alle bestehenden Spalten der Autos-Tabelle
        existing_columns = [column['name'] for column in inspector.get_columns('Autos')]
        print(f"Vorhandene Spalten in der Autos-Tabelle: {existing_columns}")
        
        # Füge fehlende Spalten hinzu
        if 'tuev_datum' not in existing_columns:
            try:
                print("Füge tuev_datum Spalte hinzu...")
                connection.execute(text("ALTER TABLE Autos ADD tuev_datum DATE NULL"))
                connection.commit()
                print("Spalte 'tuev_datum' zur Tabelle 'Autos' hinzugefügt")
            except Exception as e:
                print(f"Fehler beim Hinzufügen der Spalte 'tuev_datum': {e}")
                connection.rollback()
        
        if 'au_datum' not in existing_columns:
            try:
                print("Füge au_datum Spalte hinzu...")
                connection.execute(text("ALTER TABLE Autos ADD au_datum DATE NULL"))
                connection.commit()
                print("Spalte 'au_datum' zur Tabelle 'Autos' hinzugefügt")
            except Exception as e:
                print(f"Fehler beim Hinzufügen der Spalte 'au_datum': {e}")
                connection.rollback()
        
        connection.close()

# Überprüfe und aktualisiere die Tabellenstruktur beim Start der Anwendung
with app.app_context():
    check_and_update_table_structure()

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# -------- Vehicles Endpoints --------
@app.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    print("GET /api/vehicles wurde aufgerufen")
    try:
        # Verwende eine direkte SQL-Abfrage für mehr Kontrolle
        result = db.session.execute(text("""
            SELECT id, modell, kennzeichen, bild, status, kilometerstand, tankstand, 
                   tuev_datum, au_datum
            FROM Autos
        """)).fetchall()
        
        print(f"Gefundene Fahrzeuge: {len(result)}")
        
        vehicles_list = []
        for row in result:
            # Erstelle ein Wörterbuch aus der Zeile
            vehicle = {
                'id': row[0],
                'modell': row[1],
                'kennzeichen': row[2],
                'status': row[4] or 'verfügbar',
                'kilometerstand': row[5] or 0,
                'tankstand': row[6] or 100
            }
            
            # Debug-Ausgabe für TÜV und AU Datum
            print(f"Fahrzeug {vehicle['id']} - TÜV: {row[7]}, AU: {row[8]}")
            
            # Stelle sicher, dass ein Bild vorhanden ist
            if row[3] and row[3].strip():
                vehicle['bild'] = row[3]
            else:
                # Verwende das Unsplash-Bild als Fallback
                vehicle['bild'] = get_vehicle_image(vehicle['modell'])
            
            # Füge TÜV- und AU-Daten hinzu, wenn sie existieren
            if len(row) > 7 and row[7]:  # tuev_datum
                try:
                    if hasattr(row[7], 'isoformat'):
                        vehicle['tuev_datum'] = row[7].isoformat()
                    else:
                        vehicle['tuev_datum'] = str(row[7])
                    print(f"TÜV-Datum formatiert: {vehicle['tuev_datum']}")
                except Exception as e:
                    print(f"Fehler bei der Formatierung des TÜV-Datums: {e}")
                    vehicle['tuev_datum'] = None
            
            if len(row) > 8 and row[8]:  # au_datum
                try:
                    if hasattr(row[8], 'isoformat'):
                        vehicle['au_datum'] = row[8].isoformat()
                    else:
                        vehicle['au_datum'] = str(row[8])
                    print(f"AU-Datum formatiert: {vehicle['au_datum']}")
                except Exception as e:
                    print(f"Fehler bei der Formatierung des AU-Datums: {e}")
                    vehicle['au_datum'] = None
            
            vehicles_list.append(vehicle)
        
        print(f"Zurückgegebene Fahrzeuge: {len(vehicles_list)}")
        return jsonify(vehicles_list)
    except Exception as e:
        print(f"Fehler beim Abrufen der Fahrzeuge: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/fahrzeug', methods=['POST'])
def add_vehicle():
    # Extrahiere Textdaten
    modell = request.form.get('modell')
    kennzeichen = request.form.get('kennzeichen')
    kilometerstand = request.form.get('kilometerstand')
    tuev_datum = request.form.get('tuev_datum')
    au_datum = request.form.get('au_datum')
    
    print(f"Eingegangene Daten: modell={modell}, kennzeichen={kennzeichen}, km={kilometerstand}")
    print(f"TÜV-Datum (Original): {tuev_datum}, AU-Datum (Original): {au_datum}")
    
    if not modell or not kennzeichen:
        return jsonify({'error': 'Modell und Kennzeichen sind erforderlich'}), 400
    
    # Bild verarbeiten wenn vorhanden
    bild_url = None
    if 'bild' in request.files:
        file = request.files['bild']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Eindeutigen Dateinamen generieren
            unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
            # Speicherpfad: uploads/vehicles/DATEINAME
            file_path = os.path.join('vehicles', unique_filename)
            full_path = os.path.join(app.config['UPLOAD_FOLDER'], file_path)
            file.save(full_path)
            bild_url = f'/uploads/vehicles/{unique_filename}'
    
    # Konvertiere Datumsangaben und Kilometerstand
    tuev_date = None
    if tuev_datum:
        try:
            # Versuche unterschiedliche Datumsformate
            try:
                # ISO-Format (YYYY-MM-DD)
                tuev_date = datetime.strptime(tuev_datum, '%Y-%m-%d').date()
            except ValueError:
                # Deutsches Format (DD.MM.YYYY)
                tuev_date = datetime.strptime(tuev_datum, '%d.%m.%Y').date()
            
            print(f"Konvertiertes TÜV-Datum: {tuev_date}")
        except ValueError as e:
            print(f"Fehler bei der Konvertierung des TÜV-Datums: {e}")
    
    au_date = None
    if au_datum:
        try:
            # Versuche unterschiedliche Datumsformate
            try:
                # ISO-Format (YYYY-MM-DD)
                au_date = datetime.strptime(au_datum, '%Y-%m-%d').date()
            except ValueError:
                # Deutsches Format (DD.MM.YYYY)
                au_date = datetime.strptime(au_datum, '%d.%m.%Y').date()
                
            print(f"Konvertiertes AU-Datum: {au_date}")
        except ValueError as e:
            print(f"Fehler bei der Konvertierung des AU-Datums: {e}")
    
    km = 0
    if kilometerstand:
        try:
            km = int(kilometerstand)
        except ValueError:
            pass
    
    # Neues Fahrzeug erstellen
    new_vehicle = Vehicle(
        modell=modell,
        kennzeichen=kennzeichen,
        kilometerstand=km,
        tuev_datum=tuev_date,
        au_datum=au_date,
        bild=bild_url,
        status='verfügbar'
    )
    
    db.session.add(new_vehicle)
    db.session.commit()
    
    # Fahrzeugdaten für die Antwort vorbereiten
    response_data = new_vehicle.to_dict()
    print(f"Gespeichertes Fahrzeug: {response_data}")
    
    return jsonify(response_data), 201

@app.route('/api/vehicles/<int:vehicle_id>', methods=['PUT'])
def update_vehicle(vehicle_id):
    data = request.get_json()
    vehicle = Vehicle.query.get_or_404(vehicle_id)
    vehicle.modell = data.get('modell', vehicle.modell)
    vehicle.kennzeichen = data.get('kennzeichen', vehicle.kennzeichen)
    if 'modell' in data:
        vehicle.bild = get_vehicle_image(vehicle.modell)
    vehicle.status = data.get('status', vehicle.status)
    db.session.commit()
    return jsonify({"message": "Fahrzeug aktualisiert"})

@app.route('/api/vehicles/<int:vehicle_id>', methods=['DELETE'])
def delete_vehicle(vehicle_id):
    vehicle = Vehicle.query.get_or_404(vehicle_id)
    db.session.delete(vehicle)
    db.session.commit()
    return jsonify({"message": "Fahrzeug gelöscht"})

@app.route('/api/vehicles/<int:vehicle_id>', methods=['GET'])
def get_vehicle(vehicle_id):
    try:
        vehicle = Vehicle.query.get_or_404(vehicle_id)
        return jsonify({
            'id': vehicle.id,
            'modell': vehicle.modell,
            'kennzeichen': vehicle.kennzeichen,
            'bild': vehicle.bild,
            'status': vehicle.status,
            'kilometerstand': vehicle.kilometerstand,
            'tankstand': vehicle.tankstand,
            'letzte_wartung': vehicle.letzte_wartung.isoformat() if vehicle.letzte_wartung else None
        })
    except Exception as e:
        print(f"Fehler beim Abrufen des Fahrzeugs: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Export der Fahrzeugliste als CSV
@app.route('/api/vehicles/export', methods=['GET'])
def export_vehicles():
    import csv
    from io import StringIO
    vehicles = Vehicle.query.all()
    si = StringIO()
    writer = csv.writer(si)
    writer.writerow(["id", "modell", "kennzeichen", "bild", "status"])
    for v in vehicles:
        writer.writerow([v.id, v.modell, v.kennzeichen, v.bild, v.status])
    output = si.getvalue()
    return Response(output, mimetype="text/csv", headers={"Content-Disposition": "attachment;filename=vehicles.csv"})

def log_aktion(aktion, fahrzeug_id, beschreibung, alte_werte=None, neue_werte=None):
    try:
        log = AuditLog(
            aktion=aktion,
            benutzer=g.current_user['name'],  # Nutzt den simulierten Login
            fahrzeug_id=fahrzeug_id,
            beschreibung=beschreibung,
            alte_werte=json.dumps(alte_werte) if alte_werte else None,
            neue_werte=json.dumps(neue_werte) if neue_werte else None
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        print(f"Fehler beim Logging: {str(e)}")

@app.route('/api/vehicles/<int:vehicle_id>/maintenance', methods=['POST'])
def add_maintenance_record(vehicle_id):
    try:
        data = request.get_json()
        record = MaintenanceRecord(
            vehicle_id=vehicle_id,
            beschreibung=data['beschreibung'],
            kosten=float(data.get('kosten', 0)),
            kilometerstand=int(data.get('kilometerstand', 0)),
            durchgefuehrt_von=data.get('durchgefuehrt_von'),
            art_der_wartung=data.get('art_der_wartung')
        )
        
        # Update vehicle's last maintenance date
        vehicle = Vehicle.query.get(vehicle_id)
        vehicle.letzte_wartung = datetime.utcnow()
        
        db.session.add(record)
        db.session.commit()

        # Logging
        log_aktion(
            aktion="Wartung hinzugefügt",
            fahrzeug_id=vehicle_id,
            beschreibung=f"Neue {data['art_der_wartung']} hinzugefügt",
            neue_werte=data
        )
        
        # Rückgabe des kompletten Records mit allen notwendigen Feldern
        return jsonify({
            'id': record.id,
            'datum': record.datum.isoformat(),
            'beschreibung': record.beschreibung,
            'kosten': float(record.kosten),  # Explizit als float
            'kilometerstand': int(record.kilometerstand),  # Explizit als int
            'durchgefuehrt_von': record.durchgefuehrt_von,
            'art_der_wartung': record.art_der_wartung
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/vehicles/<int:vehicle_id>/maintenance', methods=['GET'])
def get_maintenance_history(vehicle_id):
    records = MaintenanceRecord.query.filter_by(vehicle_id=vehicle_id).order_by(MaintenanceRecord.datum.desc()).all()
    return jsonify([{
        'id': r.id,
        'datum': r.datum.isoformat(),
        'beschreibung': r.beschreibung,
        'kosten': r.kosten,
        'kilometerstand': r.kilometerstand,
        'durchgefuehrt_von': r.durchgefuehrt_von,
        'art_der_wartung': r.art_der_wartung
    } for r in records])

@app.route('/api/vehicles/<int:vehicle_id>/maintenance/<int:maintenance_id>', methods=['DELETE'])
def delete_maintenance_record(vehicle_id, maintenance_id):
    try:
        record = MaintenanceRecord.query.get_or_404(maintenance_id)
        if record.vehicle_id != vehicle_id:
            return jsonify({"error": "Wartungseintrag gehört nicht zu diesem Fahrzeug"}), 400
        
        # Alte Werte für das Logging speichern
        alte_werte = record_to_dict(record)
        
        db.session.delete(record)
        db.session.commit()


        # Logging
        log_aktion(
            aktion="Wartung gelöscht",
            fahrzeug_id=vehicle_id,
            beschreibung=f"Wartungseintrag {maintenance_id} gelöscht",
            alte_werte=alte_werte
        )

        return jsonify({"message": "Wartungseintrag gelöscht"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/vehicles/<int:vehicle_id>/maintenance/<int:maintenance_id>', methods=['PUT'])
def update_maintenance_record(vehicle_id, maintenance_id):
    try:
        record = MaintenanceRecord.query.get_or_404(maintenance_id)
        if record.vehicle_id != vehicle_id:
            return jsonify({"error": "Wartungseintrag gehört nicht zu diesem Fahrzeug"}), 400
        
        # Alte Werte für das Logging speichern
        alte_werte = record_to_dict(record)
        
        data = request.get_json()
        record.beschreibung = data.get('beschreibung', record.beschreibung)
        record.kosten = float(data.get('kosten', record.kosten))
        record.kilometerstand = int(data.get('kilometerstand', record.kilometerstand))
        record.durchgefuehrt_von = data.get('durchgefuehrt_von', record.durchgefuehrt_von)
        record.art_der_wartung = data.get('art_der_wartung', record.art_der_wartung)
        
        db.session.commit()

        # Logging
        log_aktion(
            aktion="Wartung bearbeitet",
            fahrzeug_id=vehicle_id,
            beschreibung=f"Wartungseintrag {maintenance_id} bearbeitet",
            alte_werte=alte_werte,
            neue_werte=data
        )

        return jsonify(record_to_dict(record))
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Route für Bildupload
@app.route('/api/uploads/vehicles/<filename>')
def uploaded_file(filename):
    return send_file(os.path.join(UPLOAD_FOLDER, filename))

# -------- Bookings Endpoints --------
@app.route('/api/bookings', methods=['GET'])
def get_bookings():
    bookings = Booking.query.all()
    result = []
    for b in bookings:
        result.append({
            "id": b.id,
            "vehicle_id": b.vehicle_id,
            "user_id": b.user_id,
            "startzeit": b.startzeit.isoformat(),
            "endzeit": b.endzeit.isoformat(),
            "status": b.status,
            "zweck": b.zweck,
            "auto_groesse": b.auto_groesse
        })
    return jsonify(result)

@app.route('/api/bookings', methods=['POST'])
def add_booking():
    data = request.get_json()
    vehicle_id = data.get('vehicle_id')
    user_id = data.get('user_id', g.current_user['id'])
    startzeit = data.get('startzeit')
    endzeit = data.get('endzeit')
    status = data.get('status', 'Angefragt')
    zweck = data.get('zweck', '')
    auto_groesse = data.get('auto_groesse', '')
    
    new_booking = Booking(vehicle_id=vehicle_id, user_id=user_id, startzeit=startzeit, endzeit=endzeit,
                          status=status, zweck=zweck, auto_groesse=auto_groesse)
    db.session.add(new_booking)
    db.session.commit()
    
    # Hier könnte z.B. eine E-Mail-Benachrichtigung versendet werden.
    return jsonify({"message": "Buchungsanfrage erstellt", "booking": {
        "id": new_booking.id,
        "vehicle_id": new_booking.vehicle_id,
        "user_id": new_booking.user_id,
        "startzeit": new_booking.startzeit.isoformat(),
        "endzeit": new_booking.endzeit.isoformat(),
        "status": new_booking.status,
        "zweck": new_booking.zweck,
        "auto_groesse": new_booking.auto_groesse
    }}), 201

@app.route('/api/bookings/<int:booking_id>', methods=['PUT'])
def update_booking(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    data = request.get_json()
    booking.vehicle_id = data.get('vehicle_id', booking.vehicle_id)
    booking.user_id = data.get('user_id', booking.user_id)
    booking.startzeit = data.get('startzeit', booking.startzeit)
    booking.endzeit = data.get('endzeit', booking.endzeit)
    booking.status = data.get('status', booking.status)
    # Optionale Aktualisierung der neuen Felder:
    booking.zweck = data.get('zweck', booking.zweck)
    booking.auto_groesse = data.get('auto_groesse', booking.auto_groesse)
    db.session.commit()
    return jsonify({"message": "Buchung aktualisiert"})

@app.route('/api/bookings/<int:booking_id>', methods=['DELETE'])
def delete_booking(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    db.session.delete(booking)
    db.session.commit()
    return jsonify({"message": "Buchung gelöscht"})

# -------- Users Endpoints --------
@app.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.all()
    result = []
    for u in users:
        result.append(u.to_dict())
    return jsonify(result)

@app.route('/api/users', methods=['POST'])
def add_user():
    data = request.get_json()
    name = data.get('name')
    rolle = data.get('rolle')
    email = data.get('email')
    password = data.get('password')
    department = data.get('department', '')
    building = data.get('building', '')
    permissions = data.get('permissions', {
        'canBookVehicles': True,
        'canViewStatistics': rolle == 'Admin',
        'canManageVehicles': rolle == 'Admin',
        'canApproveRequests': rolle == 'Admin'
    })
    
    new_user = User(
        name=name, 
        rolle=rolle, 
        email=email, 
        department=department, 
        building=building,
        permissions=permissions
    )
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "Benutzer erstellt", "user": new_user.to_dict()}), 201

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    user.name = data.get('name', user.name)
    user.rolle = data.get('rolle', user.rolle)
    user.email = data.get('email', user.email)
    user.department = data.get('department', user.department)
    user.building = data.get('building', user.building)
    
    # Berechtigungen aktualisieren, falls vorhanden
    if 'permissions' in data:
        user.permissions = data['permissions']
    
    # Passwort aktualisieren, falls vorhanden
    if 'password' in data and data['password']:
        user.set_password(data['password'])
    
    db.session.commit()
    return jsonify({"message": "Benutzer aktualisiert", "user": user.to_dict()})

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "Benutzer gelöscht"})

# Neuer Endpunkt: Aktueller Benutzer (für Autologin/Anzeige)
@app.route('/api/current_user', methods=['GET'])
def get_current_user():
    return jsonify(g.current_user)

# Neue Route: Statistiken
@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    from sqlalchemy import func, extract, and_
    from datetime import datetime, timedelta
    import calendar
    
    try:
        # Aktuelles Datum und Zeit
        current_date = datetime.now().date()
        current_month = current_date.month
        current_year = current_date.year
        
        # Zeitraum für "This Month"
        first_day = datetime(current_year, current_month, 1)
        last_day = datetime(current_year, current_month, calendar.monthrange(current_year, current_month)[1])
        
        # Zeitraum für Vergleich (letzter Monat)
        last_month = first_day - timedelta(days=1)
        last_month_first = datetime(last_month.year, last_month.month, 1)
        
        # 1. Inspektionen Kosten (nach Monaten) - ECHTE DATEN AUS DER DATENBANK
        inspection_costs = {}
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        for month_idx, month_name in enumerate(month_names, 1):
            # Tatsächliche Inspektion-Kosten aus den Wartungseinträgen abrufen
            month_costs = db.session.query(func.sum(MaintenanceRecord.kosten))\
                .filter(
                    and_(
                        extract('year', MaintenanceRecord.datum) == current_year,
                        extract('month', MaintenanceRecord.datum) == month_idx,
                        MaintenanceRecord.art_der_wartung == 'Inspektion'
                    )
                ).scalar() or 0
            
            inspection_costs[month_name] = float(month_costs)
            
        # 2. Fahrtzeiten (Gesamt und nach Fahrzeugmarken) - VORLÄUFIG LASSEN WIE ES IST
        drive_time_stats = StatisticsData.query.filter(
            and_(
                StatisticsData.kategorie == "fahrtzeiten",
                StatisticsData.datum <= current_date
            )
        ).all()
        
        drive_time_by_brand = {}
        total_drive_time_hours = 0.0
        
        # Wenn keine Statistikdaten vorhanden sind, lassen wir die Werte auf 0
        if drive_time_stats:
            for stat in drive_time_stats:
                drive_time_by_brand[stat.unter_kategorie] = float(stat.wert)
                total_drive_time_hours += float(stat.wert)
        else:
            # Fallback auf Marken basierend auf tatsächlichen Fahrzeugen
            brands = {}
            vehicles = Vehicle.query.all()
            for vehicle in vehicles:
                brand = vehicle.modell.split(' ')[0]  # Erste Wort als Marke
                if brand not in brands:
                    brands[brand] = 0
                    drive_time_by_brand[brand] = 0  # Initialwert 0 Stunden
        
        # 3. Gefahrene KM - VORLÄUFIG LASSEN WIE ES IST
        total_km_this_month = 0
        
        # 4. Häufigkeit Fahrzeuge - ECHTE DATEN AUS TATSÄCHLICHER FAHRZEUGNUTZUNG
        vehicle_usage_km = {}
        
        # Alle Fahrzeuge aus der Datenbank holen
        vehicles = Vehicle.query.all()
        
        for vehicle in vehicles:
            # Nutze den aktuellen Kilometerstand des Fahrzeugs
            vehicle_usage_km[vehicle.modell] = vehicle.kilometerstand or 0
        
        # 5. Tank verbrauch - ECHTE DATEN AUS TATSÄCHLICHEN TANKEINTRÄGEN
        fuel_consumption = {}
        
        # Kraftstofftypen ermitteln und Gesamtmengen berechnen
        fuel_logs = FuelLog.query.filter(
            FuelLog.date >= first_day
        ).all()
        
        for log in fuel_logs:
            fuel_type = log.fuel_type or "Unbekannt"
            if fuel_type not in fuel_consumption:
                fuel_consumption[fuel_type] = 0
            fuel_consumption[fuel_type] += log.amount_liters
        
        # Wenn keine Tankeinträge vorhanden sind, fügen wir leere Kategorien hinzu
        if not fuel_consumption:
            fuel_consumption = {
                "Diesel": 0,
                "Super": 0,
                "Super Plus": 0,
                "Strom": 0,
                "Auto Gas": 0
            }
        
        # 6. Abteilung - ECHTE DATEN AUS TATSÄCHLICHEN NUTZERBUCHUNGEN
        department_usage = {}
        
        # Berechne Nutzungsprozente basierend auf Buchungen nach Abteilung
        departments = db.session.query(func.distinct(User.department)).all()
        
        total_bookings = db.session.query(func.count(Booking.id)).filter(
            and_(
                Booking.startzeit >= first_day,
                Booking.endzeit <= last_day,
                Booking.status == 'akzeptiert'
            )
        ).scalar() or 1  # Mindestens 1 um Division durch 0 zu vermeiden
        
        for dept in departments:
            if not dept[0]:
                continue
                
            # Nutzer dieser Abteilung
            user_ids = db.session.query(User.id).filter(User.department == dept[0]).all()
            user_ids = [u[0] for u in user_ids]
            
            if not user_ids:
                continue
                
            # Anzahl der Buchungen dieser Abteilung
            bookings_count = db.session.query(func.count(Booking.id)).filter(
                and_(
                    Booking.user_id.in_(user_ids),
                    Booking.startzeit >= first_day,
                    Booking.endzeit <= last_day,
                    Booking.status == 'akzeptiert'
                )
            ).scalar() or 0
            
            # Prozent berechnen
            if total_bookings > 0:
                department_usage[dept[0]] = (bookings_count / total_bookings) * 100
            else:
                department_usage[dept[0]] = 0
        
        # Wenn keine Abteilungsdaten vorhanden sind, setzen wir Default-Werte
        if not department_usage:
            department_usage = {
                "IT": 0,
                "Vertrieb": 0,
                "Produktion": 0,
                "Marketing": 0,
                "Verwaltung": 0
            }
        
        # 7. Device Type - Mobile vs Desktop (simuliert, da in Realität nicht erfasst)
        device_stats = {
            "Mobile": 73,
            "Desktop": 27
        }
        
        # 8. This Month Summary - tatsächliche Buchungen und statische Fahrzeiten
        # Da Fahrzeiten später implementiert werden sollen, belassen wir die statischen Werte
        current_pickups = db.session.query(func.count(Booking.id)).filter(
            and_(
                Booking.startzeit >= first_day,
                Booking.endzeit <= last_day,
                Booking.status == 'akzeptiert'
            )
        ).scalar() or 0
        
        last_month_pickups = db.session.query(func.count(Booking.id)).filter(
            and_(
                Booking.startzeit >= last_month_first,
                Booking.endzeit < first_day,
                Booking.status == 'akzeptiert'
            )
        ).scalar() or 0
        
        # Prozentuale Änderung berechnen
        if last_month_pickups > 0:
            pickups_change_pct = ((current_pickups - last_month_pickups) / last_month_pickups) * 100
        else:
            pickups_change_pct = 100 if current_pickups > 0 else 0
            
        pickups_change_abs = current_pickups - last_month_pickups
        
        # Für Fahrzeiten belassen wir die bestehenden Werte (wird später implementiert)
        current_drive_time = total_drive_time_hours
        last_drive_time = total_drive_time_hours * 0.9  # Simulierte Vormonatszeit
        
        if last_drive_time > 0:
            drive_time_change_pct = ((current_drive_time - last_drive_time) / last_drive_time) * 100
        else:
            drive_time_change_pct = 100 if current_drive_time > 0 else 0
            
        drive_time_change_abs = current_drive_time - last_drive_time
        
        this_month_summary = {
            "drive_time_hours": current_drive_time,
            "drive_time_change_pct": round(drive_time_change_pct, 1),
            "drive_time_change_abs": round(drive_time_change_abs, 2),
            "total_pickups": current_pickups,
            "pickups_change_pct": round(pickups_change_pct, 1),
            "pickups_change_abs": pickups_change_abs
        }
        
        # Gesamtstatistik zusammenstellen
        stats = {
            "inspection_costs": inspection_costs,
            "drive_time": {
                "total_hours": round(total_drive_time_hours, 2),
                "by_brand": {brand: round(hours, 2) for brand, hours in drive_time_by_brand.items()}
            },
            "kilometers": {
                "total": total_km_this_month,
                "by_vehicle": vehicle_usage_km
            },
            "fuel_consumption": fuel_consumption,
            "department_usage": department_usage,
            "device_stats": device_stats,
            "this_month": this_month_summary
        }
        
        return jsonify(stats)
    except Exception as e:
        print(f"Fehler beim Abrufen der Statistikdaten: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Hilfsfunktion zum Konvertieren eines Records in ein Dict
def record_to_dict(record):
    return {
        'id': record.id,
        'datum': record.datum.isoformat(),
        'beschreibung': record.beschreibung,
        'kosten': record.kosten,
        'kilometerstand': record.kilometerstand,
        'durchgefuehrt_von': record.durchgefuehrt_von,
        'art_der_wartung': record.art_der_wartung
    }

# Neue Route für das Abrufen der Logs
@app.route('/api/audit-logs', methods=['GET'])
def get_audit_logs():
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).all()
    return jsonify([{
        'id': log.id,
        'timestamp': log.timestamp.isoformat(),
        'aktion': log.aktion,
        'benutzer': log.benutzer,
        'fahrzeug_id': log.fahrzeug_id,
        'beschreibung': log.beschreibung,
        'alte_werte': json.loads(log.alte_werte) if log.alte_werte else None,
        'neue_werte': json.loads(log.neue_werte) if log.neue_werte else None
    } for log in logs])

@app.route('/api/vehicles/<int:vehicle_id>/bookings', methods=['GET'])
def get_vehicle_bookings(vehicle_id):
    try:
        bookings = Booking.query.filter_by(vehicle_id=vehicle_id).all()
        return jsonify([{
            'id': b.id,
            'startzeit': b.startzeit.isoformat(),
            'endzeit': b.endzeit.isoformat(),
            'status': b.status,
            'zweck': b.zweck,
            'user_name': b.user.name if b.user else 'Unbekannt'
        } for b in bookings])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Dokumente hochladen
@app.route('/api/vehicles/<int:vehicle_id>/documents', methods=['POST'])
def upload_document(vehicle_id):
    try:
        if 'file' not in request.files:
            return jsonify({"error": "Keine Datei ausgewählt"}), 400
        
        file = request.files['file']
        if not file.filename:
            return jsonify({"error": "Keine Datei ausgewählt"}), 400
            
        document_type = request.form.get('document_type', 'Sonstiges')
        
        if file and allowed_file(file.filename):
            filename = secure_filename(f"{vehicle_id}_{document_type}_{file.filename}")
            filepath = os.path.join(DOCUMENT_FOLDER, filename)
            file.save(filepath)
            
            doc = VehicleDocument(
                vehicle_id=vehicle_id,
                name=file.filename,
                file_path=f"/uploads/documents/{filename}",  # Relativer Pfad für Frontend
                document_type=document_type
            )
            db.session.add(doc)
            db.session.commit()
            
            return jsonify({
                "message": "Dokument hochgeladen",
                "document": {
                    "id": doc.id,
                    "name": doc.name,
                    "file_path": doc.file_path,
                    "document_type": doc.document_type,
                    "upload_date": doc.upload_date.isoformat()
                }
            })
    except Exception as e:
        print(f"Fehler beim Hochladen des Dokuments: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/vehicles/<int:vehicle_id>/documents', methods=['GET'])
def get_documents(vehicle_id):
    try:
        documents = VehicleDocument.query.filter_by(vehicle_id=vehicle_id).all()
        return jsonify([{
            'id': doc.id,
            'name': doc.name,
            'document_type': doc.document_type,
            'upload_date': doc.upload_date.isoformat()
        } for doc in documents])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Schadensmeldung erstellen
@app.route('/api/vehicles/<int:vehicle_id>/damage-reports', methods=['POST'])
def create_damage_report(vehicle_id):
    try:
        data = request.form
        images = []
        
        # Bilder speichern
        if 'images' in request.files:
            files = request.files.getlist('images')
            for file in files:
                if file and allowed_file(file.filename):
                    filename = secure_filename(f"damage_{vehicle_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}")
                    filepath = os.path.join(DAMAGE_FOLDER, filename)
                    file.save(filepath)
                    images.append(f"/uploads/damage_reports/{filename}")  # Relativer Pfad für Frontend
        
        report = DamageReport(
            vehicle_id=vehicle_id,
            description=data['description'],
            images=images,
            status='Gemeldet'  # Initialer Status
        )
        
        db.session.add(report)
        db.session.commit()
        
        return jsonify({
            "message": "Schadensmeldung erstellt",
            "report": {
                "id": report.id,
                "date": report.date.isoformat(),
                "description": report.description,
                "status": report.status,
                "images": report.images
            }
        })
    except Exception as e:
        print(f"Fehler beim Erstellen der Schadensmeldung: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/vehicles/<int:vehicle_id>/damage-reports', methods=['GET'])
def get_damage_reports(vehicle_id):
    try:
        reports = DamageReport.query.filter_by(vehicle_id=vehicle_id).all()
        return jsonify([{
            'id': report.id,
            'date': report.date.isoformat(),
            'description': report.description,
            'status': report.status,
            'images': report.images
        } for report in reports])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Tankprotokoll hinzufügen
@app.route('/api/vehicles/<int:vehicle_id>/fuel-logs', methods=['POST'])
def add_fuel_log(vehicle_id):
    data = request.get_json()
    
    log = FuelLog(
        vehicle_id=vehicle_id,
        amount_liters=float(data['amount_liters']),
        cost_per_liter=float(data['cost_per_liter']),
        total_cost=float(data['amount_liters']) * float(data['cost_per_liter']),
        mileage=int(data['mileage']),
        fuel_type=data['fuel_type']
    )
    
    # Aktualisiere den Kilometerstand des Fahrzeugs
    vehicle = Vehicle.query.get(vehicle_id)
    vehicle.kilometerstand = log.mileage
    
    db.session.add(log)
    db.session.commit()
    
    return jsonify({"message": "Tankprotokoll hinzugefügt"})

@app.route('/api/vehicles/<int:vehicle_id>/fuel-logs', methods=['GET'])
def get_fuel_logs(vehicle_id):
    try:
        logs = FuelLog.query.filter_by(vehicle_id=vehicle_id).all()
        return jsonify([{
            'id': log.id,
            'date': log.date.isoformat(),
            'amount_liters': log.amount_liters,
            'cost_per_liter': log.cost_per_liter,
            'total_cost': log.total_cost,
            'mileage': log.mileage,
            'fuel_type': log.fuel_type
        } for log in logs])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/vehicles/<int:vehicle_id>/fuel-logs/<int:log_id>', methods=['PUT'])
def update_fuel_log(vehicle_id, log_id):
    try:
        data = request.get_json()
        log = FuelLog.query.get(log_id)
        
        if not log:
            return jsonify({"error": "Tankeintrag nicht gefunden"}), 404
            
        log.amount_liters = float(data['amount_liters'])
        log.cost_per_liter = float(data['cost_per_liter'])
        log.total_cost = float(data['amount_liters']) * float(data['cost_per_liter'])
        log.mileage = int(data['mileage'])
        log.fuel_type = data['fuel_type']
        
        # Aktualisiere den Kilometerstand des Fahrzeugs
        vehicle = Vehicle.query.get(vehicle_id)
        vehicle.kilometerstand = log.mileage
        
        db.session.commit()
        
        return jsonify({
            'id': log.id,
            'date': log.date.isoformat(),
            'amount_liters': log.amount_liters,
            'cost_per_liter': log.cost_per_liter,
            'total_cost': log.total_cost,
            'mileage': log.mileage,
            'fuel_type': log.fuel_type
        })
    except Exception as e:
        print(f"Fehler beim Aktualisieren des Tankprotokolls: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/vehicles/<int:vehicle_id>/fuel-logs/<int:log_id>', methods=['DELETE'])
def delete_fuel_log(vehicle_id, log_id):
    try:
        log = FuelLog.query.get(log_id)
        if not log:
            return jsonify({"error": "Tankeintrag nicht gefunden"}), 404
            
        db.session.delete(log)
        db.session.commit()
        
        return jsonify({"message": "Tankeintrag erfolgreich gelöscht"})
    except Exception as e:
        print(f"Fehler beim Löschen des Tankprotokolls: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/test-connection')
def test_connection():
    try:
        # Teste die Verbindung mit text()
        db.session.execute(text('SELECT 1'))
        return jsonify({"status": "success", "message": "Datenbankverbindung OK"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Füge eine Route zum Servieren der hochgeladenen Dateien hinzu
@app.route('/uploads/<path:filename>')
def serve_file(filename):
    return send_file(os.path.join(app.root_path, 'uploads', filename))

@app.route('/api/vehicles/<int:vehicle_id>/damage-reports/<int:report_id>', methods=['PUT'])
def update_damage_report(vehicle_id, report_id):
    try:
        data = request.form
        report = DamageReport.query.get(report_id)
        
        if not report:
            return jsonify({"error": "Schadensmeldung nicht gefunden"}), 404
            
        report.description = data['description']
        report.status = data.get('status', report.status)
        
        # Aktualisiere die Bilderliste basierend auf den beibehaltenen Bildern
        if 'existing_images' in data:
            report.images = json.loads(data['existing_images'])
        
        # Füge neue Bilder hinzu
        if 'images' in request.files:
            new_images = []
            for file in request.files.getlist('images'):
                if file and allowed_file(file.filename):
                    filename = secure_filename(f"damage_{vehicle_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}")
                    filepath = os.path.join(DAMAGE_FOLDER, filename)
                    file.save(filepath)
                    new_images.append(f"/uploads/damage_reports/{filename}")
            
            # Füge neue Bilder zur bestehenden Liste hinzu
            report.images.extend(new_images)
        
        db.session.commit()
        
        return jsonify({
            "message": "Schadensmeldung aktualisiert",
            "report": {
                "id": report.id,
                "date": report.date.isoformat(),
                "description": report.description,
                "status": report.status,
                "images": report.images
            }
        })
    except Exception as e:
        print(f"Fehler beim Aktualisieren der Schadensmeldung: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/vehicles/<int:vehicle_id>/damage-reports/<int:report_id>', methods=['DELETE'])
def delete_damage_report(vehicle_id, report_id):
    try:
        report = DamageReport.query.get(report_id)
        if not report:
            return jsonify({"error": "Schadensmeldung nicht gefunden"}), 404
            
        # Optional: Lösche auch die Bilddateien
        for image_path in report.images:
            try:
                full_path = os.path.join(app.root_path, image_path.lstrip('/'))
                if os.path.exists(full_path):
                    os.remove(full_path)
            except Exception as e:
                print(f"Fehler beim Löschen der Bilddatei: {str(e)}")
        
        db.session.delete(report)
        db.session.commit()
        
        return jsonify({"message": "Schadensmeldung erfolgreich gelöscht"})
    except Exception as e:
        print(f"Fehler beim Löschen der Schadensmeldung: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/fahrzeug/test', methods=['GET'])
def test_get_vehicles():
    """Ein einfacher Test-Endpunkt, um Fahrzeuge direkt abzurufen"""
    try:
        # Verwende eine direkte SQL-Abfrage
        result = db.session.execute(text("SELECT * FROM Autos")).fetchall()
        
        # Konvertiere zu einer Liste von Wörterbüchern
        vehicles = []
        for row in result:
            vehicle_dict = {}
            for idx, column in enumerate(result.keys()):
                vehicle_dict[column] = row[idx]
            vehicles.append(vehicle_dict)
        
        return jsonify({
            "success": True,
            "message": f"Erfolgreich {len(vehicles)} Fahrzeuge abgerufen",
            "count": len(vehicles),
            "vehicles": vehicles,
            "raw_columns": list(result.keys()) if result else []
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Fehler beim Abrufen der Fahrzeuge"
        }), 500

@app.route('/ping', methods=['GET'])
def ping():
    """Ein sehr einfacher Endpunkt, der nur prüft, ob das Backend erreichbar ist"""
    print("PING wurde aufgerufen!")
    return jsonify({
        "status": "success",
        "message": "Backend ist erreichbar!",
        "time": datetime.now().strftime("%H:%M:%S")
    })

# ----- Benutzer-Authentifizierung -----

# Hilfsfunktion zum Generieren eines JWT-Tokens
def generate_token(user_id):
    try:
        payload = {
            'exp': datetime.utcnow() + timedelta(days=1),
            'iat': datetime.utcnow(),
            'sub': user_id
        }
        return jwt.encode(
            payload,
            app.config.get('JWT_SECRET_KEY'),
            algorithm='HS256'
        )
    except Exception as e:
        return str(e)

# Dekorator zur Token-Validierung
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Token ist erforderlich!'}), 401
        
        try:
            data = jwt.decode(token, app.config.get('JWT_SECRET_KEY'), algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['sub']).first()
            if not current_user:
                return jsonify({'message': 'Token ist ungültig!'}), 401
            
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token ist abgelaufen!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token ist ungültig!'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

# Registrierungsendpunkt
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Überprüfe, ob erforderliche Felder vorhanden sind
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'success': False, 'message': 'Unvollständige Daten'}), 400
    
    # Überprüfe, ob Benutzer bereits existiert
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({'success': False, 'message': 'Benutzer existiert bereits!'}), 409
    
    # Neuen Benutzer erstellen
    new_user = User(
        name=data['name'],
        email=data['email'],
        rolle='Mitarbeiter',  # Standard-Rolle
        department=data.get('department', 'Allgemein')
    )
    
    # Passwort mit der set_password-Methode setzen
    new_user.set_password(data['password'])
    
    try:
        db.session.add(new_user)
        db.session.commit()
        
        # Token generieren
        token = generate_token(new_user.id)
        
        return jsonify({
            'success': True,
            'message': 'Benutzer erfolgreich registriert',
            'userId': new_user.id,
            'token': token,
            'name': new_user.name,
            'department': new_user.department
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# Login-Endpunkt
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Überprüfe, ob erforderliche Felder vorhanden sind
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Unvollständige Daten'}), 400
    
    # Benutzer in der Datenbank suchen
    user = User.query.filter_by(email=data['email']).first()
    
    # Wenn Benutzer nicht gefunden oder Passwort falsch
    if not user or not user.check_password(data['password']):
        return jsonify({'success': False, 'message': 'Ungültige Anmeldedaten'}), 401
    
    # Token generieren
    token = generate_token(user.id)
    
    # Ist Admin?
    is_admin = user.rolle in ['Admin', 'Administrator']
    
    # Berechtigungen abrufen
    permissions = user.permissions or {
        'canBookVehicles': True,
        'canViewStatistics': is_admin,
        'canManageVehicles': is_admin,
        'canApproveRequests': is_admin
    }
    
    return jsonify({
        'success': True,
        'userId': user.id,
        'name': user.name,
        'token': token,
        'isAdmin': is_admin,
        'department': user.department,
        'permissions': permissions
    }), 200

# Geschützter Endpunkt (Beispiel)
@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify({
        'id': current_user.id,
        'name': current_user.name,
        'email': current_user.email,
        'rolle': current_user.rolle,
        'department': current_user.department
    })

# Passwort zurücksetzen (Beispiel - in Produktion würde man E-Mail-Verifizierung verwenden)
@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    
    # Überprüfe, ob erforderliche Felder vorhanden sind
    if not data or not data.get('email'):
        return jsonify({'success': False, 'message': 'E-Mail-Adresse erforderlich'}), 400
    
    # Benutzer in der Datenbank suchen
    user = User.query.filter_by(email=data['email']).first()
    
    if not user:
        # Wir geben aus Sicherheitsgründen die gleiche Nachricht zurück, auch wenn der Benutzer nicht existiert
        return jsonify({'success': True, 'message': 'Wenn Ihre E-Mail-Adresse in unserem System ist, erhalten Sie eine E-Mail mit Anweisungen zum Zurücksetzen Ihres Passworts.'}), 200
    
    # In einer echten Anwendung würde hier eine E-Mail mit einem Zurücksetzungs-Link gesendet werden
    # Für die Demo geben wir einfach eine Erfolgsmeldung zurück
    
    return jsonify({'success': True, 'message': 'Wenn Ihre E-Mail-Adresse in unserem System ist, erhalten Sie eine E-Mail mit Anweisungen zum Zurücksetzen Ihres Passworts.'}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Stelle sicher, dass alle Tabellen existieren
        create_default_users()  # Erstelle die Standardbenutzer
    app.run(debug=True, host='0.0.0.0') 



    #wie viele km wurden insgesammt fehler und auch wie wurde es durchschnittlich gefahren
    #welche autos wurden am öftesten gefahren
    #reisenkosten abrechnung abrechnung