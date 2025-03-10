import React from 'react';
import { 
  HomeIcon, 
  CalendarIcon,
  TruckIcon,
  ChartBarIcon,
  UserIcon,
  InboxIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  UsersIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

function Sidebar({ isOpen, toggleSidebar, isAdmin, onLogout, activeView, setActiveView, user, permissions }) {
  // Icon-Mapping, um die Icon-Namen in tatsächliche Icons umzuwandeln
  const iconMap = {
    'HomeIcon': HomeIcon,
    'TruckIcon': TruckIcon,
    'CalendarIcon': CalendarIcon,
    'ChartBarIcon': ChartBarIcon,
    'UserIcon': UserIcon,
    'InboxIcon': InboxIcon,
    'UsersIcon': UsersIcon,
    'Cog6ToothIcon': Cog6ToothIcon
  };

  // Benutzerinfo
  const userInfo = user || {
    name: isAdmin ? 'Administrator' : 'Benutzer',
    department: isAdmin ? 'IT-Administration' : 'Allgemein'
  };

  // Standardberechtigungen, falls keine übergeben wurden
  const userPermissions = permissions || {
    canBookVehicles: true,
    canViewStatistics: isAdmin,
    canManageVehicles: isAdmin,
    canApproveRequests: isAdmin
  };

  // Menüpunkte basierend auf der Benutzerrolle und Berechtigungen
  const getMenuItems = () => {
    const items = [
      { id: 'dashboard', name: 'Dashboard', icon: 'HomeIcon', show: true },
      { id: 'vehicles', name: 'Fahrzeuge', icon: 'TruckIcon', show: true }
    ];

    // Menüpunkte basierend auf Berechtigungen
    if (userPermissions.canApproveRequests) {
      items.push({ id: 'vehicle-requests', name: 'Anfragen', icon: 'InboxIcon', show: true });
    }

    if (userPermissions.canViewStatistics) {
      items.push({ id: 'statistics', name: 'Statistiken', icon: 'ChartBarIcon', show: true });
    }

    if (userPermissions.canBookVehicles) {
      items.push({ id: 'my-requests', name: 'Meine Anfragen', icon: 'InboxIcon', show: !isAdmin });
    }

    // Benutzerverwaltung nur für Admins
    if (isAdmin) {
      items.push({ id: 'user-management', name: 'Benutzerverwaltung', icon: 'UsersIcon', show: true });
    }

    // Nur Menüpunkte zurückgeben, die angezeigt werden sollen
    return items.filter(item => item.show);
  };

  const items = getMenuItems();

  // Funktion zum Abmelden
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md"
        onClick={toggleSidebar}
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6 text-gray-600" />
        ) : (
          <Bars3Icon className="h-6 w-6 text-gray-600" />
        )}
      </button>

      {/* Sidebar */}
      <div className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} transform md:translate-x-0 fixed md:static inset-y-0 left-0 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out z-40`}>
        <div className="p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Fuhrpark</h1>
          <button className="md:hidden" onClick={toggleSidebar}>
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          </button>
        </div>
        
        {/* Benutzerinformationen */}
        <div className="px-6 py-4 border-t border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <UserIcon className="h-6 w-6" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{userInfo.name}</p>
              <p className="text-xs text-gray-500">{userInfo.department}</p>
            </div>
          </div>
        </div>
        
        <nav className="mt-6 flex flex-col h-[calc(100%-180px)]">
          {items.map((item) => {
            // Icon-Komponente aus dem Mapping abrufen
            const IconComponent = iconMap[item.icon] || HomeIcon; // Fallback auf HomeIcon
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center px-6 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                  activeView === item.id ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                }`}
              >
                <IconComponent className="h-5 w-5 mr-3" />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
          
          {/* Spacer to push logout button to the bottom */}
          <div className="flex-grow"></div>
          
          {/* Logout-Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-6 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3" />
            <span className="font-medium">Abmelden</span>
          </button>
        </nav>
      </div>
    </>
  );
}

export default Sidebar; 