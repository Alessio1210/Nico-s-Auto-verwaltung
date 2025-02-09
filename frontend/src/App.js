import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import VehicleList from './components/VehicleList';
import GlobalDashboard from './components/GlobalDashboard';
import BookingForm from './components/BookingForm';
import StatisticsDashboard from './components/StatisticsDashboard';

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderContent = () => {
    switch(activeView) {
      case 'dashboard':
        return <GlobalDashboard />;
      case 'vehicles':
        return <VehicleList />;
      case 'booking':
        return <BookingForm />;
      case 'statistics':
        return <StatisticsDashboard />;
      default:
        return <GlobalDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App; 