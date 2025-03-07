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
  XMarkIcon
} from '@heroicons/react/24/outline';

function Sidebar({ isOpen, toggleSidebar, isAdmin, onLogout, activeView, setActiveView }) {
  // Icon-Mapping, um die Icon-Namen in tatsächliche Icons umzuwandeln
  const iconMap = {
    'HomeIcon': HomeIcon,
    'TruckIcon': TruckIcon,
    'CalendarIcon': CalendarIcon,
    'ChartBarIcon': ChartBarIcon,
    'UserIcon': UserIcon,
    'InboxIcon': InboxIcon
  };

  // Menüpunkte basierend auf der Benutzerrolle
  const getMenuItems = () => {
    if (isAdmin) {
      return [
        { id: 'dashboard', name: 'Dashboard', icon: 'HomeIcon' },
        { id: 'vehicles', name: 'Fahrzeuge', icon: 'TruckIcon' },
        { id: 'vehicle-requests', name: 'Anfragen', icon: 'InboxIcon' },
        { id: 'statistics', name: 'Statistiken', icon: 'ChartBarIcon' },
      ];
    } else {
      return [
        { id: 'dashboard', name: 'Dashboard', icon: 'HomeIcon' },
        { id: 'vehicles', name: 'Fahrzeuge', icon: 'TruckIcon' },
        { id: 'my-requests', name: 'Meine Anfragen', icon: 'InboxIcon' },
      ];
    }
  };

  const items = getMenuItems();

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
        
        <nav className="mt-6">
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
          
          {/* Logout-Button */}
          <button
            onClick={onLogout}
            className="w-full flex items-center px-6 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors mt-auto"
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