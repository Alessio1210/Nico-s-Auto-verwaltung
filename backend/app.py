from flask import Flask, request, jsonify, g, Response, send_file
from flask_cors import CORS
from config import Config
from models import db, Vehicle, User, Booking, MaintenanceRecord, AuditLog, VehicleDocument, DamageReport, FuelLog
import os
import requests
from werkzeug.utils import secure_filename
from datetime import datetime
import json
from sqlalchemy import text  # Füge diesen Import am Anfang der Datei hinzu

app = Flask(__name__)
app.config.from_object(Config)

# Zurück zur einfachen CORS-Konfiguration
CORS(app)

db.init_app(app)

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
    UNSPLASH_ACCESS_KEY = "YOUR_UNSPLASH_ACCESS_KEY"  # Sie müssen sich bei Unsplash registrieren
    
    try:
        # Suche nach Bildern des Automodells
        search_url = f"https://api.unsplash.com/search/photos"
        params = {
            "query": f"car {modell}",
            "per_page": 1,
            "orientation": "landscape",
            "client_id": UNSPLASH_ACCESS_KEY
        }
        
        response = requests.get(search_url, params=params)
        data = response.json()
        
        # Wenn Bilder gefunden wurden, verwende das erste
        if data["results"] and len(data["results"]) > 0:
            return data["results"][0]["urls"]["regular"]
            
        # Fallback, falls kein Bild gefunden wurde
        return f"https://dummyimage.com/600x400/000/fff&text={modell}"
        
    except Exception as e:
        print(f"Fehler beim Abrufen des Fahrzeugbildes: {e}")
        return f"https://dummyimage.com/600x400/000/fff&text={modell}"

# Konfiguration für Bildupload
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# -------- Vehicles Endpoints --------
@app.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    try:
        print("GET /api/vehicles wurde aufgerufen")  # Debug-Log
        vehicles = Vehicle.query.all()
        result = [{
            'id': v.id,
            'modell': v.modell,
            'kennzeichen': v.kennzeichen,
            'bild': v.bild,
            'status': v.status,
            'kilometerstand': v.kilometerstand,
            'tankstand': v.tankstand
        } for v in vehicles]
        print(f"Gefundene Fahrzeuge: {result}")  # Debug-Log
        return jsonify(result)
    except Exception as e:
        print(f"Fehler beim Abrufen der Fahrzeuge: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/vehicles', methods=['POST'])
def add_vehicle():
    try:
        data = request.form
        image = request.files.get('image')
        
        # Bildverarbeitung
        image_path = None
        if image and allowed_file(image.filename):
            filename = secure_filename(f"{data['kennzeichen']}_{image.filename}")
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            image.save(filepath)
            image_path = f"/api/uploads/vehicles/{filename}"
        
        new_vehicle = Vehicle(
            modell=data['modell'],
            kennzeichen=data['kennzeichen'],
            status=data.get('status', 'verfügbar'),
            bild=image_path,
            kilometerstand=int(data.get('kilometerstand', 0)),
            tankstand=int(data.get('tankstand', 100))
        )
        
        db.session.add(new_vehicle)
        db.session.commit()
        
        return jsonify({
            "message": "Fahrzeug hinzugefügt",
            "vehicle": {
                "id": new_vehicle.id,
                "modell": new_vehicle.modell,
                "kennzeichen": new_vehicle.kennzeichen,
                "bild": new_vehicle.bild,
                "status": new_vehicle.status,
                "kilometerstand": new_vehicle.kilometerstand,
                "tankstand": new_vehicle.tankstand
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

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
        result.append({
            "id": u.id,
            "name": u.name,
            "rolle": u.rolle,
            "email": u.email,
            "department": u.department,
            "building": u.building
        })
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
    
    new_user = User(name=name, rolle=rolle, email=email, department=department, building=building)
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "Benutzer erstellt", "user": {
        "id": new_user.id,
        "name": new_user.name,
        "rolle": new_user.rolle,
        "email": new_user.email,
        "department": new_user.department,
        "building": new_user.building
    }}), 201

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    user.name = data.get('name', user.name)
    user.rolle = data.get('rolle', user.rolle)
    user.email = data.get('email', user.email)
    user.department = data.get('department', user.department)
    user.building = data.get('building', user.building)
    if 'password' in data:
        user.set_password(data['password'])
    db.session.commit()
    return jsonify({"message": "Benutzer aktualisiert"})

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
    from sqlalchemy import func
    # Statistiken: Anzahl der Buchungen je Fahrzeug
    vehicle_counts = db.session.query(Booking.vehicle_id, func.count(Booking.id)).group_by(Booking.vehicle_id).all()
    bookings_per_vehicle = {str(vehicle_id): count for vehicle_id, count in vehicle_counts}

    # Durchschnittliche Buchungsdauer (in Stunden) je Fahrzeug
    avg_durations = {}
    for vehicle_id, _ in vehicle_counts:
        avg_duration = db.session.query(func.avg(func.julianday(Booking.endzeit) - func.julianday(Booking.startzeit))).filter(Booking.vehicle_id == vehicle_id).scalar()
        avg_durations[str(vehicle_id)] = avg_duration * 24 if avg_duration else 0

    stats = {
        "bookings_per_vehicle": bookings_per_vehicle,
        "average_booking_duration_hours": avg_durations
    }
    return jsonify(stats)

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

if __name__ == '__main__':
    with app.app_context():
        try:
            # Teste zuerst die Verbindung mit text()
            db.session.execute(text('SELECT 1'))
            print("Datenbankverbindung erfolgreich!")
            
            # Erstelle Tabellen
            db.create_all()
            print("Tabellen wurden erstellt/aktualisiert")
            
            # Prüfe ob Beispieldaten nötig sind
            vehicle_count = db.session.query(Vehicle).count()
            if vehicle_count == 0:
                print("Erstelle Beispieldaten...")
                # Füge ein Testfahrzeug hinzu
                test_vehicle = Vehicle(
                    modell='VW Golf',
                    kennzeichen='B-AA 1234',
                    bild='https://example.com/golf.jpg',
                    status='verfügbar'
                )
                db.session.add(test_vehicle)
                db.session.commit()
                print("Beispielfahrzeug wurde erstellt")
            else:
                print(f"Datenbank enthält bereits {vehicle_count} Fahrzeuge")
                
        except Exception as e:
            print(f"Fehler beim Datenbankzugriff: {str(e)}")
            db.session.rollback()
        finally:
            db.session.close()

    app.run(host='0.0.0.0', port=5000, debug=True) 