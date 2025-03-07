import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// ChartJS Registrierung
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend
);

function StatisticsDashboard() {
  const [stats, setStats] = useState(null);
  const [timeFilter, setTimeFilter] = useState('week'); // 'week' oder 'day'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get('http://localhost:5000/api/statistics')
      .then(response => {
        setStats(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching statistics:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-600">Lade Statistiken...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Keine Statistikdaten verfügbar.</p>
      </div>
    );
  }

  // Format für die Prozentanzeige mit plus/minus
  const formatPercentage = (value) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  // Format für Stunden und Minuten aus Gesamtstunden
  const formatHoursAndMinutes = (totalHours) => {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <h2 className="text-3xl font-bold mb-2 text-center text-gray-800">Statistiken</h2>
      <div className="text-right text-sm text-gray-500 mb-6">
        Letzt Update: {format(new Date(), "dd. MMMM yyyy", { locale: de })}
      </div>
      
      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Inspektionen Kosten */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Inspektionen Kosten</h3>
              <button className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {Object.entries(stats.inspection_costs || {})
                .filter(([_, cost]) => cost > 0)
                .slice(-2)
                .map(([month, cost]) => (
                  <div key={month} className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">{month}</span>
                    <span className="font-semibold text-gray-800">{cost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
        
        {/* Fahrtzeiten */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Fahrtzeiten</h3>
              <button className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </button>
            </div>
            
            <h4 className="text-2xl font-bold mb-6 text-gray-800">{formatHoursAndMinutes(stats.drive_time?.total_hours || 0)}</h4>
            
            {stats.drive_time?.by_brand && Object.entries(stats.drive_time.by_brand).length > 0 && (
              <div className="space-y-4">
                {Object.entries(stats.drive_time.by_brand).map(([brand, hours]) => (
                  <div key={brand} className="w-full">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{brand}</span>
                      <span className="text-gray-700">{formatHoursAndMinutes(hours)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${Math.min((hours / stats.drive_time.total_hours) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Gefahrene KM */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Gefahrene KM</h3>
              <div className="bg-gray-200 rounded-lg">
                <button 
                  className={`px-3 py-1 rounded-md text-sm ${timeFilter === 'week' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
                  onClick={() => setTimeFilter('week')}
                >
                  Week
                </button>
                <button 
                  className={`px-3 py-1 rounded-md text-sm ${timeFilter === 'day' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
                  onClick={() => setTimeFilter('day')}
                >
                  Day
                </button>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800">Total screen time</h4>
                  <div className="text-3xl font-bold text-gray-800">{formatHoursAndMinutes(stats.this_month?.drive_time_hours || 0)}</div>
                </div>
                <div className={`text-sm font-medium ${stats.this_month?.drive_time_change_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(stats.this_month?.drive_time_change_pct || 0)} 
                  <span className="block">{stats.this_month?.drive_time_change_abs >= 0 ? '+' : ''}{formatHoursAndMinutes(stats.this_month?.drive_time_change_abs || 0)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800">Total pickups</h4>
                  <div className="text-3xl font-bold text-gray-800">{stats.this_month?.total_pickups || 0}</div>
                </div>
                <div className={`text-sm font-medium ${stats.this_month?.pickups_change_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(stats.this_month?.pickups_change_pct || 0)}
                  <span className="block">{stats.this_month?.pickups_change_abs >= 0 ? '+' : ''}{stats.this_month?.pickups_change_abs || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Häufigkeit Fahrzeuge */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Häufigkeit Fahrzeuge</h3>
                <p className="text-sm text-gray-500">Welches Auto wird am meisten genommen</p>
              </div>
              <div className="bg-gray-200 rounded-lg">
                <button 
                  className={`px-3 py-1 rounded-md text-sm ${timeFilter === 'week' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
                  onClick={() => setTimeFilter('week')}
                >
                  Week
                </button>
                <button 
                  className={`px-3 py-1 rounded-md text-sm ${timeFilter === 'day' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
                  onClick={() => setTimeFilter('day')}
                >
                  Day
                </button>
              </div>
            </div>
            
            {stats.kilometers?.by_vehicle && Object.entries(stats.kilometers.by_vehicle).length > 0 && (
              <div className="space-y-4">
                {Object.entries(stats.kilometers.by_vehicle)
                  .sort((a, b) => b[1] - a[1])
                  .map(([vehicle, km]) => (
                    <div key={vehicle} className="w-full">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{vehicle}</span>
                        <span className="text-gray-700">{km.toLocaleString()} km</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min((km / Math.max(...Object.values(stats.kilometers.by_vehicle))) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Tank verbrauch */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Tank verbrauch</h3>
                <p className="text-sm text-gray-500">Durchschnittlicher Tank verbrauch</p>
              </div>
              <button className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </button>
            </div>
            
            {stats.fuel_consumption && Object.entries(stats.fuel_consumption).length > 0 && (
              <div className="space-y-4">
                {Object.entries(stats.fuel_consumption).map(([type, amount]) => (
                  <div key={type} className="w-full">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{type}</span>
                      <span className="text-gray-700">
                        {type.toLowerCase().includes('strom') 
                          ? `${amount.toLocaleString()} kWh` 
                          : `${amount.toLocaleString()} L`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          type.toLowerCase().includes('diesel') ? 'bg-blue-600' :
                          type.toLowerCase().includes('super plus') ? 'bg-red-600' :
                          type.toLowerCase().includes('super') ? 'bg-red-500' :
                          type.toLowerCase().includes('strom') ? 'bg-green-500' :
                          type.toLowerCase().includes('gas') ? 'bg-indigo-500' :
                          'bg-purple-500'
                        }`}
                        style={{ 
                          width: `${Math.min((amount / Math.max(...Object.values(stats.fuel_consumption))) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Abteilung */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Abteilung</h3>
              <button className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </button>
            </div>
            
            {stats.department_usage && Object.entries(stats.department_usage).length > 0 && (
              <div className="space-y-4">
                {Object.entries(stats.department_usage)
                  .sort((a, b) => b[1] - a[1])
                  .map(([dept, percentage]) => (
                    <div key={dept} className="w-full">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{dept}</span>
                        <span className="text-gray-700">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
        
        {/* This Month Summary */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">This Month</h3>
              <button className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </button>
            </div>
            
            <div className="text-center">
              <h4 className="text-4xl font-bold mb-2 text-gray-800">{formatHoursAndMinutes(stats.this_month?.drive_time_hours || 0)}</h4>
              <p className={`text-sm font-medium ${stats.this_month?.drive_time_change_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(stats.this_month?.drive_time_change_pct || 0)} ({stats.this_month?.drive_time_change_abs >= 0 ? '+' : ''}{formatHoursAndMinutes(stats.this_month?.drive_time_change_abs || 0)})
              </p>
              
              <h4 className="text-xl font-bold mt-6 mb-2 text-gray-800">Amount</h4>
              <p className="text-4xl font-bold mb-2 text-gray-800">{stats.this_month?.total_pickups || 0}</p>
              <p className={`text-sm font-medium ${stats.this_month?.pickups_change_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.this_month?.pickups_change_pct >= 0 ? '+' : ''}{stats.this_month?.pickups_change_abs || 0} ({formatPercentage(stats.this_month?.pickups_change_pct || 0)})
              </p>
            </div>
          </div>
        </div>
        
        {/* Device type */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Device type</h3>
              <button className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </button>
            </div>
            
            <div className="h-56 flex items-center justify-center">
              {stats.device_stats && (
                <Pie 
                  data={{
                    labels: Object.keys(stats.device_stats),
                    datasets: [{
                      data: Object.values(stats.device_stats),
                      backgroundColor: ['#3b82f6', '#93c5fd'],
                      borderWidth: 0,
                    }]
                  }}
                  options={{
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          padding: 20,
                          color: '#374151'
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.label}: ${context.raw}%`
                        }
                      }
                    }
                  }}
                />
              )}
            </div>
            
            <div className="flex justify-center gap-8 text-sm mt-4">
              {stats.device_stats && Object.entries(stats.device_stats).map(([device, percentage]) => (
                <div key={device} className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${device === 'Mobile' ? 'bg-blue-500' : 'bg-blue-300'}`}></div>
                  <span className="text-gray-700">{device} | {percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default StatisticsDashboard; 