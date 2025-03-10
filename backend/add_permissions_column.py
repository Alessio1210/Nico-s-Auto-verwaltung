from app import app, db
from sqlalchemy import text

def add_permissions_column():
    with app.app_context():
        try:
            # Überprüfen, ob die Spalte bereits existiert
            db.session.execute(text("SELECT permissions FROM Users LIMIT 1"))
            print("Die Spalte 'permissions' existiert bereits in der Users-Tabelle.")
        except Exception as e:
            print(f"Die Spalte 'permissions' existiert nicht: {e}")
            
            try:
                # Spalte hinzufügen
                # Für SQL Server (MSSQL)
                db.session.execute(text("ALTER TABLE Users ADD permissions NVARCHAR(MAX)"))
                db.session.commit()
                print("Die Spalte 'permissions' wurde erfolgreich zur Users-Tabelle hinzugefügt.")
                
                # Standardwerte für bestehende Benutzer setzen
                db.session.execute(text("""
                    UPDATE Users 
                    SET permissions = CASE 
                        WHEN rolle = 'Admin' THEN '{"canBookVehicles": true, "canViewStatistics": true, "canManageVehicles": true, "canApproveRequests": true}'
                        ELSE '{"canBookVehicles": true, "canViewStatistics": false, "canManageVehicles": false, "canApproveRequests": false}'
                    END
                """))
                db.session.commit()
                print("Standardberechtigungen für bestehende Benutzer wurden gesetzt.")
                
            except Exception as add_error:
                db.session.rollback()
                print(f"Fehler beim Hinzufügen der Spalte 'permissions': {add_error}")

if __name__ == "__main__":
    add_permissions_column()
    print("Skript abgeschlossen.") 