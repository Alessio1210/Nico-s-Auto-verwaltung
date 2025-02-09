import os

class Config:
    DEBUG = True
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your_secret_key')
    # Nutze DATABASE_URL aus der Umgebung (z. B. von Docker Compose) oder fallback auf SQLite
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///fuhrpark.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False 