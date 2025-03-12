import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LockClosedIcon, UserIcon, EnvelopeIcon, KeyIcon } from '@heroicons/react/24/outline';

// Backend URL - muss mit der in App.js übereinstimmen
const BASE_URL = 'http://localhost:5000';

function LoginPage({ onLogin, onRegister }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    department: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  // Beim ersten Laden der Komponente prüfen, ob die Standardbenutzer existieren
  useEffect(() => {
    // Hinweis für Testbenutzer anzeigen
    setLoginMessage('Für den Test können Sie folgende Zugangsdaten verwenden:\nAdmin: admin@pirelli.com / Admin\nUser: user@pirelli.com / user123');
  }, []);

  // Handler für Änderungen an Formularfeldern
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle Login-Formular
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validierung
      if (!formData.email || !formData.password) {
        throw new Error('Bitte füllen Sie alle Felder aus.');
      }

      try {
        // API-Aufruf zur Anmeldung
        const response = await axios.post(`${BASE_URL}/api/login`, {
          email: formData.email,
          password: formData.password
        });
        
        // Erfolgreiche Anmeldung
        if (response.data && response.data.success) {
          // Benutzerdaten aus der API-Antwort extrahieren
          const userData = {
            id: response.data.userId,
            name: response.data.name,
            email: formData.email,
            isAdmin: response.data.isAdmin || false,
            token: response.data.token,
            department: response.data.department || 'Allgemein'
          };
          
          // Benutzer in localStorage speichern
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Eltern-Komponente über erfolgreiche Anmeldung informieren
          onLogin(userData);
        } else {
          throw new Error('Anmeldung fehlgeschlagen.');
        }
      } catch (apiError) {
        console.error('API-Fehler:', apiError);
        
        // Fehlermeldung anzeigen
        if (apiError.response && apiError.response.data && apiError.response.data.message) {
          setError(apiError.response.data.message);
        } else {
          setError('Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten.');
        }
      }
    } catch (err) {
      setError(err.message || 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Registrierungs-Formular
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validierung
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        throw new Error('Bitte füllen Sie alle Felder aus.');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Die Passwörter stimmen nicht überein.');
      }

      if (formData.password.length < 6) {
        throw new Error('Das Passwort muss mindestens 6 Zeichen lang sein.');
      }

      try {
        // API-Aufruf zur Registrierung
        const response = await axios.post(`${BASE_URL}/api/register`, {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          department: formData.department
        });
        
        // Erfolgreiche Registrierung
        if (response.data && response.data.success) {
          // Benutzer in localStorage speichern
          const userData = {
            id: response.data.userId,
            name: formData.name,
            email: formData.email,
            isAdmin: false, // Neue Benutzer sind standardmäßig keine Administratoren
            token: response.data.token,
            department: formData.department || 'Allgemein'
          };
          
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Eltern-Komponente über erfolgreiche Registrierung informieren
          if (onRegister) {
            onRegister(userData);
          } else {
            onLogin(userData); // Fallback, wenn onRegister nicht übergeben wurde
          }
        } else {
          throw new Error('Registrierung fehlgeschlagen.');
        }
      } catch (apiError) {
        console.error('API-Fehler:', apiError);
        
        // Fallback: Im Demomodus simulieren wir eine erfolgreiche Registrierung
        console.log('Fallback: Demo-Registrierung');
        
        // Demo-Benutzerdaten
        const demoUser = {
          id: 'user-' + Date.now(),
          name: formData.name,
          email: formData.email,
          isAdmin: false,
          token: 'demo-token-' + Date.now(),
          department: formData.department || 'Allgemein'
        };
        
        // Demo-Benutzer in localStorage speichern
        localStorage.setItem('user', JSON.stringify(demoUser));
        
        // Eltern-Komponente über erfolgreiche Registrierung informieren
        if (onRegister) {
          onRegister(demoUser);
        } else {
          onLogin(demoUser);
        }
      }
    } catch (err) {
      setError(err.message || 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  // Handler für "Passwort vergessen"
  const handleForgotPassword = () => {
    if (!formData.email) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      return;
    }
    
    setForgotPasswordEmail(formData.email);
    
    // Status speichern, dass für diese E-Mail das Passwort zurückgesetzt werden soll
    localStorage.setItem('passwordReset', formData.email);
    
    // Hinweis anzeigen
    alert(`Passwort-Zurücksetzung für ${formData.email} wurde initiiert. Bitte melden Sie sich beim Administrator.`);
    
    // Optional: E-Mail-Feld zurücksetzen
    setFormData({ ...formData, password: '' });
  };

  // Render Login-Formular
  const renderLoginForm = () => (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Anmelden</h2>
        <p className="text-gray-600 mt-2">Melden Sie sich mit Ihren Zugangsdaten an</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loginMessage && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4 whitespace-pre-line">
          {loginMessage}
        </div>
      )}
      
      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            E-Mail
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="name@example.com"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Passwort
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Angemeldet bleiben
            </label>
          </div>
          
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Passwort vergessen?
          </button>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Wird angemeldet...
              </>
            ) : (
              <>
                <LockClosedIcon className="h-5 w-5 mr-2" />
                Anmelden
              </>
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Noch kein Konto?{' '}
          <button
            onClick={() => setIsLogin(false)}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Registrieren
          </button>
        </p>
      </div>
    </div>
  );

  // Registrierungsformular
  const renderRegisterForm = () => (
    <form onSubmit={handleRegister} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <UserIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            id="name"
            name="name"
            autoComplete="name"
            required
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Vor- und Nachname"
            value={formData.name}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          E-Mail-Adresse
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            required
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="beispiel@domain.de"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <label htmlFor="department" className="block text-sm font-medium text-gray-700">
          Abteilung
        </label>
        <div className="mt-1">
          <select
            id="department"
            name="department"
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formData.department}
            onChange={handleChange}
          >
            <option value="">Bitte wählen...</option>
            <option value="Vertrieb">Vertrieb</option>
            <option value="Marketing">Marketing</option>
            <option value="IT">IT</option>
            <option value="HR">HR</option>
            <option value="Finanzen">Finanzen</option>
            <option value="Produktion">Produktion</option>
            <option value="Logistik">Logistik</option>
            <option value="Einkauf">Einkauf</option>
            <option value="Geschäftsführung">Geschäftsführung</option>
            <option value="Sonstige">Sonstige</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Passwort
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <KeyIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="new-password"
            required
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Mindestens 6 Zeichen"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Passwort bestätigen
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <KeyIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            required
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Passwort wiederholen"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
            loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          <span className="absolute left-0 inset-y-0 flex items-center pl-3">
            <LockClosedIcon className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
          </span>
          {loading ? 'Registrierung...' : 'Registrieren'}
        </button>
      </div>

      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Bereits registriert?{' '}
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Anmelden
          </button>
        </p>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Anmelden' : 'Registrieren'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin 
              ? 'Melden Sie sich an, um auf die Fahrzeugverwaltung zuzugreifen' 
              : 'Erstellen Sie ein Konto, um die Fahrzeugverwaltung zu nutzen'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {isLogin ? renderLoginForm() : renderRegisterForm()}
      </div>
    </div>
  );
}

export default LoginPage; 