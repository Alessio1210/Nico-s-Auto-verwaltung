from flask import Flask, request, jsonify, g, Response
from flask_cors import CORS
from config import Config
from models import db, Vehicle, User, Booking
import os
import requests

app = Flask(__name__)
app.config.from_object(Config)

CORS(app)

db.init_app(app)

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

# -------- Vehicles Endpoints --------
@app.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    try:
        vehicles = Vehicle.query.all()
        return jsonify([{
            'id': v.id,
            'modell': v.modell,
            'kennzeichen': v.kennzeichen,
            'bild': v.bild,
            'status': v.status
        } for v in vehicles])
    except Exception as e:
        print(f"Fehler beim Abrufen der Fahrzeuge: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/vehicles', methods=['POST'])
def add_vehicle():
    data = request.get_json()
    modell = data.get('modell')
    kennzeichen = data.get('kennzeichen')
    status = data.get('status', 'verfügbar')
    bild = get_vehicle_image(modell)
    
    new_vehicle = Vehicle(modell=modell, kennzeichen=kennzeichen, status=status, bild=bild)
    db.session.add(new_vehicle)
    db.session.commit()
    
    return jsonify({"message": "Fahrzeug hinzugefügt", "vehicle": {
        "id": new_vehicle.id,
        "modell": new_vehicle.modell,
        "kennzeichen": new_vehicle.kennzeichen,
        "bild": new_vehicle.bild,
        "status": new_vehicle.status
    }}), 201

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

if __name__ == '__main__':
    with app.app_context():
        try:
            # Erstelle Beispieldaten, falls die Tabellen leer sind
            db.create_all()
            
            if not Vehicle.query.first():  # Wenn keine Fahrzeuge existieren
                test_vehicles = [
                    Vehicle(
                        modell='VW Golf',
                        kennzeichen='B-AA 1234',
                        bild='https://example.com/golf.jpg',
                        status='verfügbar'
                    ),
                    Vehicle(
                        modell='BMW 3er',
                        kennzeichen='B-BB 5678',
                        bild='https://example.com/bmw.jpg',
                        status='verfügbar'
                    )
                ]
                for vehicle in test_vehicles:
                    db.session.add(vehicle)
                
                # Erstelle einen Test-User
                if not User.query.first():
                    test_user = User(
                        name="Test User",
                        rolle="Mitarbeiter",
                        email="test@example.com",
                        department="IT",
                        building="Hauptgebäude"
                    )
                    test_user.set_password("test123")
                    db.session.add(test_user)
                
                db.session.commit()
                print("Beispieldaten wurden erstellt!")
            
        except Exception as e:
            print(f"Fehler beim Initialisieren der Datenbank: {str(e)}")

    app.run(host='0.0.0.0', port=5000) 