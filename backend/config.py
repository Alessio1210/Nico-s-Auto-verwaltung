import os

class Config:
    DEBUG = True
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your_secret_key')
    
    # SQL Server Verbindung für lokale Entwicklung mit spezifischen Treiber-Optionen
    SQLALCHEMY_DATABASE_URI = 'mssql+pyodbc:///?odbc_connect=' + ';'.join([
        'DRIVER={ODBC Driver 17 for SQL Server}',  # Aktuellerer Treiber
        'SERVER=WKS258-1971DE\\SQLEXPRESS',
        'DATABASE=Fuhrpark',
        'MARS_Connection=yes',
        'MultipleActiveResultSets=True',
        'UID=sa',
        'PWD=LOLIGERbob2!',
    ])
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }
    SQLALCHEMY_ECHO = True  # SQL-Ausgabe für Debugging 