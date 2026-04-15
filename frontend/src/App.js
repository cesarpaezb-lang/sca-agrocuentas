import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Proyecto from './pages/Proyecto';  // <-- AGREGAR ESTA LÍNEA

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [usuario, setUsuario] = useState(JSON.parse(localStorage.getItem('usuario') || '{}'));

  const manejarLogin = (token, usuario) => {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    setToken(token);
    setUsuario(usuario);
  };

  const manejarLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario({});
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={manejarLogin} />} />
        <Route 
          path="/dashboard" 
          element={token ? <Dashboard usuario={usuario} onLogout={manejarLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/proyecto/:id" 
          element={token ? <Proyecto token={token} /> : <Navigate to="/login" />}  // <-- AGREGAR ESTA RUTA
        />
        <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} />} />
      </Routes>
    </Router>
  );
}

export default App;