import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  UserIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  ShieldCheckIcon, 
  ShieldExclamationIcon,
  UserPlusIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

// Backend URL
const BASE_URL = 'http://localhost:5000';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Formular-Daten für Bearbeitung/Erstellung
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rolle: 'Mitarbeiter',
    department: '',
    building: '',
    permissions: {
      canBookVehicles: true,
      canViewStatistics: false,
      canManageVehicles: false,
      canApproveRequests: false
    }
  });

  // Berechtigungsoptionen
  const permissionOptions = [
    { id: 'canBookVehicles', label: 'Fahrzeuge buchen', description: 'Kann Fahrzeuge reservieren und buchen' },
    { id: 'canViewStatistics', label: 'Statistiken einsehen', description: 'Kann Nutzungsstatistiken und Berichte einsehen' },
    { id: 'canManageVehicles', label: 'Fahrzeuge verwalten', description: 'Kann Fahrzeuge hinzufügen, bearbeiten und löschen' },
    { id: 'canApproveRequests', label: 'Anfragen genehmigen', description: 'Kann Fahrzeuganfragen genehmigen oder ablehnen' }
  ];

  // Benutzer laden
  useEffect(() => {
    loadUsers();
  }, []);

  // Benutzer vom Backend laden
  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${BASE_URL}/api/users`);
      if (response.data) {
        setUsers(response.data);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Benutzer:', err);
      setError('Benutzer konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
      
      // Fallback: Demo-Benutzer laden
      const demoUsers = [
        {
          id: 1,
          name: 'Administrator',
          email: 'admin@pirelli.com',
          rolle: 'Admin',
          department: 'IT-Administration',
          building: 'Hauptgebäude'
        },
        {
          id: 2,
          name: 'Normaler Benutzer',
          email: 'user@pirelli.com',
          rolle: 'Mitarbeiter',
          department: 'Vertrieb',
          building: 'Gebäude B'
        },
        {
          id: 3,
          name: 'Max Mustermann',
          email: 'max.mustermann@pirelli.com',
          rolle: 'Mitarbeiter',
          department: 'Produktion',
          building: 'Werk 1'
        }
      ];
      setUsers(demoUsers);
    } finally {
      setLoading(false);
    }
  };

  // Benutzer zum Bearbeiten auswählen
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Passwort wird nicht geladen
      rolle: user.rolle,
      department: user.department || '',
      building: user.building || '',
      permissions: user.permissions || {
        canBookVehicles: true,
        canViewStatistics: user.rolle === 'Admin',
        canManageVehicles: user.rolle === 'Admin',
        canApproveRequests: user.rolle === 'Admin'
      }
    });
    setIsEditing(true);
    setIsCreating(false);
  };

  // Neuen Benutzer erstellen
  const handleCreateUser = () => {
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      rolle: 'Mitarbeiter',
      department: '',
      building: '',
      permissions: {
        canBookVehicles: true,
        canViewStatistics: false,
        canManageVehicles: false,
        canApproveRequests: false
      }
    });
    setIsCreating(true);
    setIsEditing(false);
  };

  // Benutzer löschen
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?')) {
      return;
    }
    
    try {
      await axios.delete(`${BASE_URL}/api/users/${userId}`);
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      console.error('Fehler beim Löschen des Benutzers:', err);
      alert('Der Benutzer konnte nicht gelöscht werden. Bitte versuchen Sie es später erneut.');
      
      // Fallback: Benutzer aus der lokalen Liste entfernen
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  // Benutzer zum Admin machen oder Admin-Rechte entziehen
  const toggleAdminRole = async (user) => {
    const newRole = user.rolle === 'Admin' ? 'Mitarbeiter' : 'Admin';
    
    try {
      await axios.put(`${BASE_URL}/api/users/${user.id}`, {
        ...user,
        rolle: newRole
      });
      
      // Benutzer in der Liste aktualisieren
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, rolle: newRole } : u
      ));
    } catch (err) {
      console.error('Fehler beim Ändern der Benutzerrolle:', err);
      alert('Die Benutzerrolle konnte nicht geändert werden. Bitte versuchen Sie es später erneut.');
      
      // Fallback: Benutzer in der lokalen Liste aktualisieren
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, rolle: newRole } : u
      ));
    }
  };

  // Formular-Änderungen verarbeiten
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Berechtigungsänderungen verarbeiten
  const handlePermissionChange = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionId]: !prev.permissions[permissionId]
      }
    }));
  };

  // Formular absenden
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isCreating) {
        // Neuen Benutzer erstellen
        const response = await axios.post(`${BASE_URL}/api/users`, formData);
        setUsers([...users, response.data]);
      } else if (isEditing && selectedUser) {
        // Bestehenden Benutzer aktualisieren
        const response = await axios.put(`${BASE_URL}/api/users/${selectedUser.id}`, formData);
        setUsers(users.map(user => 
          user.id === selectedUser.id ? response.data : user
        ));
      }
      
      // Formular zurücksetzen
      setIsEditing(false);
      setIsCreating(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Fehler beim Speichern des Benutzers:', err);
      alert('Der Benutzer konnte nicht gespeichert werden. Bitte versuchen Sie es später erneut.');
      
      // Fallback: Benutzer in der lokalen Liste aktualisieren
      if (isCreating) {
        const newUser = {
          id: Date.now(), // Temporäre ID
          ...formData
        };
        setUsers([...users, newUser]);
      } else if (isEditing && selectedUser) {
        setUsers(users.map(user => 
          user.id === selectedUser.id ? { ...user, ...formData } : user
        ));
      }
      
      // Formular zurücksetzen
      setIsEditing(false);
      setIsCreating(false);
      setSelectedUser(null);
    }
  };

  // Formular abbrechen
  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    setSelectedUser(null);
  };

  // Benutzerformular rendern
  const renderUserForm = () => (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">
        {isCreating ? 'Neuen Benutzer erstellen' : 'Benutzer bearbeiten'}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isCreating ? 'Passwort' : 'Neues Passwort (leer lassen, um nicht zu ändern)'}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required={isCreating}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rolle</label>
            <select
              name="rolle"
              value={formData.rolle}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="Mitarbeiter">Mitarbeiter</option>
              <option value="Admin">Administrator</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Abteilung</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gebäude</label>
            <input
              type="text"
              name="building"
              value={formData.building}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="text-md font-medium text-gray-700 mb-2">Berechtigungen</h3>
          <div className="space-y-2">
            {permissionOptions.map(permission => (
              <div key={permission.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={permission.id}
                  checked={formData.permissions[permission.id]}
                  onChange={() => handlePermissionChange(permission.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={permission.id} className="ml-2 block text-sm text-gray-900">
                  <span className="font-medium">{permission.label}</span>
                  <span className="text-gray-500 ml-1">- {permission.description}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Speichern
          </button>
        </div>
      </form>
    </div>
  );

  // Benutzerliste rendern
  const renderUserList = () => (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Benutzerverwaltung</h2>
        <button
          onClick={handleCreateUser}
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center"
        >
          <UserPlusIcon className="h-5 w-5 mr-1" />
          Neuer Benutzer
        </button>
      </div>
      
      {loading ? (
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Benutzer werden geladen...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-red-500">
          <p>{error}</p>
        </div>
      ) : users.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <p>Keine Benutzer gefunden.</p>
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Benutzer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rolle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Abteilung
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.rolle === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {user.rolle}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.department || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Bearbeiten"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={() => toggleAdminRole(user)}
                      className={`${
                        user.rolle === 'Admin' ? 'text-purple-600 hover:text-purple-900' : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title={user.rolle === 'Admin' ? 'Admin-Rechte entziehen' : 'Zum Admin machen'}
                    >
                      {user.rolle === 'Admin' ? (
                        <ShieldExclamationIcon className="h-5 w-5" />
                      ) : (
                        <ShieldCheckIcon className="h-5 w-5" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Löschen"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {(isEditing || isCreating) ? renderUserForm() : renderUserList()}
    </div>
  );
}

export default UserManagement; 