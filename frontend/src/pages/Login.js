import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login({ onLogin }) {
  const [modo, setModo] = useState('login');
  const [email, setEmail] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [nombre, setNombre] = useState('');
  const [celular, setCelular] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const url = `/auth/${modo === 'login' ? 'login' : 'register'}`;
      const datos = modo === 'login' 
        ? { email, contraseña } 
        : { nombre, email, contraseña, celular };

      const response = await api.post(url, datos);
      onLogin(response.data.token, response.data.usuario);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error en la solicitud');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="text-center mb-4" style={{ color: '#27ae60', fontSize: '2.5rem' }}>
          🌾 SCA AgroCuentas
        </h1>
        <p className="text-center text-muted mb-4">
          {modo === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
        </p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={manejarSubmit}>
          {modo === 'register' && (
            <>
              <div className="mb-3">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  className="form-control"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Celular</label>
                <input
                  type="tel"
                  className="form-control"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-control"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-success w-100 mb-3"
            disabled={cargando}
          >
            {cargando ? 'Procesando...' : (modo === 'login' ? 'Ingresar' : 'Registrarse')}
          </button>
        </form>

        <p className="text-center">
          {modo === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          <button
            className="btn btn-link"
            onClick={() => {
              setModo(modo === 'login' ? 'register' : 'login');
              setError('');
            }}
          >
            {modo === 'login' ? 'Regístrate aquí' : 'Inicia sesión aquí'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;