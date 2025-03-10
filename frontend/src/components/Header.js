import React, { useState, useRef, useEffect } from 'react';
import { 
  UserCircleIcon,
  Cog6ToothIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

function Header({ isAdmin, onLogout, user }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Benutzerprofilinformationen aus dem übergebenen user-Objekt
  const userInfo = user || {
    name: isAdmin ? 'Administrator' : 'John Doe',
    email: isAdmin ? 'admin@example.com' : 'john.doe@example.com',
    avatar: null // Hier könnte ein Bild-URL stehen
  };

  // Schließt das Dropdown, wenn außerhalb geklickt wird
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Funktion zum Abmelden
  const handleLogout = () => {
    setShowDropdown(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="bg-white p-4 shadow-sm flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-800">Fahrzeugverwaltung</h1>
      
      <div className="flex items-center">
        {/* Modusanzeige */}
        <div className="mr-4 px-3 py-1 rounded-full text-sm font-medium bg-gray-100">
          {isAdmin ? 'Admin-Modus' : 'Benutzer-Modus'}
        </div>

        {/* Profil-Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center focus:outline-none"
          >
            {userInfo.avatar ? (
              <img
                src={userInfo.avatar}
                alt={userInfo.name}
                className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center border-2 border-gray-200 hover:border-blue-300 transition">
                <UserCircleIcon className="h-9 w-9" />
              </div>
            )}
            <span className="ml-2 text-gray-700 font-medium hidden md:block">{userInfo.name}</span>
          </button>

          {/* Dropdown-Menü */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-md shadow-lg z-10 py-1">
              {/* Profilkopf */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-700">{userInfo.name}</p>
                <p className="text-xs text-gray-500 mt-1">{userInfo.email}</p>
              </div>

              {/* Menüeinträge */}
              <div className="py-1">
                <button
                  onClick={() => {
                    // Profil anzeigen (in einer realen App)
                    alert('Profil wird angezeigt');
                    setShowDropdown(false);
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <UserIcon className="h-5 w-5 mr-3 text-gray-400" />
                  Profil anzeigen
                </button>

                <button
                  onClick={() => {
                    // Einstellungen anzeigen (in einer realen App)
                    alert('Einstellungen werden angezeigt');
                    setShowDropdown(false);
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <Cog6ToothIcon className="h-5 w-5 mr-3 text-gray-400" />
                  Einstellungen
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 text-gray-400" />
                  Abmelden
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header; 