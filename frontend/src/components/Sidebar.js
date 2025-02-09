import React from 'react';
import { 
  HomeIcon, 
  CalendarIcon,
  TruckIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

function Sidebar({ activeView, setActiveView }) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: HomeIcon },
    { id: 'vehicles', name: 'Fahrzeuge', icon: TruckIcon },
    { id: 'booking', name: 'Buchung', icon: CalendarIcon },
    { id: 'statistics', name: 'Statistiken', icon: ChartBarIcon },
  ];

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">Fuhrpark</h1>
      </div>
      <nav className="mt-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center px-6 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
              activeView === item.id ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
            }`}
          >
            <item.icon className="h-5 w-5 mr-3" />
            <span className="font-medium">{item.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar; 