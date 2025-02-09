import os

class Config:
    DEBUG = True
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your_secret_key')
    # SQL Server Verbindung für lokale Entwicklung
    SQLALCHEMY_DATABASE_URI = 'mssql+pyodbc:///?odbc_connect=' + ';'.join([
        'DRIVER={ODBC Driver 18 for SQL Server}',  # Wichtig: Exakter Treibername
        'SERVER=DESKTOP-QD39JFR',  # Dein lokaler Server
        'DATABASE=Fuhrpark',
        'Trusted_Connection=yes',  # Windows-Authentifizierung
        'TrustServerCertificate=yes',
        'Encrypt=no',  # Deaktiviere Verschlüsselung für lokale Entwicklung
        'timeout=60'  # Erhöhter Timeout für Entwicklung
    ])
    SQLALCHEMY_TRACK_MODIFICATIONS = False 