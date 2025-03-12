-- Fuhrpark Datenbank-Setup
-- Dieses Skript erstellt alle benötigten Tabellen für die Fuhrpark-Anwendung

-- Erstelle die Datenbank (falls sie nicht existiert)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'Fuhrpark')
BEGIN
    CREATE DATABASE Fuhrpark;
END
GO

USE Fuhrpark;
GO

-- Tabelle für Benutzer
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(100) NOT NULL UNIQUE,
        email NVARCHAR(100) NOT NULL UNIQUE,
        first_name NVARCHAR(100) NOT NULL,
        last_name NVARCHAR(100) NOT NULL,
        is_fleet_manager BIT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- Tabelle für Fahrzeuge
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'vehicles')
BEGIN
    CREATE TABLE Autos (
        id INT IDENTITY(1,1) PRIMARY KEY,
        license_plate NVARCHAR(20) NOT NULL UNIQUE,
        model NVARCHAR(100) NOT NULL,
        manufacturer NVARCHAR(100) NOT NULL,
        year INT,
        color NVARCHAR(50),
        image_url NVARCHAR(255),
        status NVARCHAR(50) NOT NULL DEFAULT 'verfügbar',
        notes NVARCHAR(MAX),
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- Tabelle für Buchungen
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'bookings')
BEGIN
    CREATE TABLE bookings (
        id INT IDENTITY(1,1) PRIMARY KEY,
        vehicle_id INT NOT NULL,
        user_id INT NOT NULL,
        start_datetime DATETIME NOT NULL,
        end_datetime DATETIME NOT NULL,
        purpose NVARCHAR(255) NOT NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'angefragt', -- angefragt, genehmigt, abgelehnt, abgeschlossen
        approved_by INT, -- Bezieht sich auf einen Benutzer mit is_fleet_manager = 1
        notes NVARCHAR(MAX),
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
    );
END;

-- Tabelle für Wartungstermine
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'maintenance')
BEGIN
    CREATE TABLE maintenance (
        id INT IDENTITY(1,1) PRIMARY KEY,
        vehicle_id INT NOT NULL,
        maintenance_type NVARCHAR(100) NOT NULL,
        scheduled_date DATETIME NOT NULL,
        completion_date DATETIME,
        cost DECIMAL(10, 2),
        service_provider NVARCHAR(100),
        notes NVARCHAR(MAX),
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );
END;

-- Tabelle für Systemeinstellungen
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'settings')
BEGIN
    CREATE TABLE settings (
        id INT IDENTITY(1,1) PRIMARY KEY,
        setting_key NVARCHAR(100) NOT NULL UNIQUE,
        setting_value NVARCHAR(MAX),
        description NVARCHAR(255),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
    );
END;

-- Beispieldaten für Benutzer einfügen
IF NOT EXISTS (SELECT TOP 1 * FROM users)
BEGIN
    INSERT INTO users (username, email, first_name, last_name, is_fleet_manager)
    VALUES 
    ('admin', 'admin@firma.de', 'Admin', 'Benutzer', 1),
    ('mitarbeiter1', 'mitarbeiter1@firma.de', 'Max', 'Mustermann', 0),
    ('mitarbeiter2', 'mitarbeiter2@firma.de', 'Erika', 'Musterfrau', 0);
END;

-- Beispieldaten für Fahrzeuge einfügen
IF NOT EXISTS (SELECT TOP 1 * FROM vehicles)
BEGIN
    INSERT INTO vehicles (license_plate, model, manufacturer, year, color, status)
    VALUES 
    ('M-AB 123', 'Golf', 'Volkswagen', 2021, 'Silber', 'verfügbar'),
    ('M-CD 456', 'A4', 'Audi', 2020, 'Schwarz', 'verfügbar'),
    ('M-EF 789', 'Passat', 'Volkswagen', 2019, 'Blau', 'in Wartung');
END;

-- Standardeinstellungen einfügen
IF NOT EXISTS (SELECT TOP 1 * FROM settings)
BEGIN
    INSERT INTO settings (setting_key, setting_value, description)
    VALUES 
    ('booking_lead_time', '24', 'Vorlaufzeit für Buchungen in Stunden'),
    ('max_booking_duration', '168', 'Maximale Buchungsdauer in Stunden'),
    ('enable_notifications', 'true', 'E-Mail-Benachrichtigungen aktivieren');
END;

PRINT 'Datenbank-Setup abgeschlossen.'
GO 
