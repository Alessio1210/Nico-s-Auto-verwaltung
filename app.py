from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Datenbank-Konfiguration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///fahrzeuge.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Fahrzeug-Modell
class Fahrzeug(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    modell = db.Column(db.String(100), nullable=False)
    kennzeichen = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Datenbank erstellen
with app.app_context():
    db.create_all()

# Endpunkte für Fahrzeugverwaltung
@app.route('/fahrzeug/getAll', methods=['GET'])
def get_all_vehicles():
    vehicles = Fahrzeug.query.all()
    return jsonify([{
        'id': v.id,
        'modell': v.modell,
        'kennzeichen': v.kennzeichen
    } for v in vehicles])

@app.route('/fahrzeug', methods=['POST'])
def add_vehicle():
    data = request.json
    new_vehicle = Fahrzeug(
        modell=data['modell'],
        kennzeichen=data['kennzeichen']
    )
    db.session.add(new_vehicle)
    db.session.commit()
    return jsonify({
        'id': new_vehicle.id,
        'modell': new_vehicle.modell,
        'kennzeichen': new_vehicle.kennzeichen
    }), 201

@app.route('/fahrzeug/<int:id>', methods=['DELETE'])
def delete_vehicle(id):
    vehicle = Fahrzeug.query.get_or_404(id)
    db.session.delete(vehicle)
    db.session.commit()
    return '', 204

if __name__ == '__main__':
    app.run(debug=True, port=5000) 